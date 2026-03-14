import modal
import io
import textwrap
from pydantic import BaseModel
from typing import Optional

image = (
    modal.Image.debian_slim()
    .apt_install(
        "ffmpeg", "libpango1.0-dev", "pkg-config", "python3-dev", "libcairo2-dev",
        "texlive", "texlive-latex-extra", "texlive-fonts-extra", "texlive-latex-recommended" # ← これらを追加
    )
    .pip_install("manim", "Pillow", "fastapi[standard]", "pydantic") 
)

app = modal.App("manim-app-v2", image=image)

class GraphRequest(BaseModel):
    formula: Optional[str] = ""
    code: Optional[str] = ""

@app.function()
@modal.fastapi_endpoint(method="POST")
def generate_graph_image(item: GraphRequest):
    from fastapi import Response
    import manim
    import re
    import textwrap
    
    code_str = item.code or ""
    formula = item.formula or ""
    
    if code_str:
        code_str = re.sub(r'^(from manim import \*|import manim)', '', code_str, flags=re.MULTILINE)
        code_str = re.sub(r'^class .*:', '', code_str, flags=re.MULTILINE)
        code_str = re.sub(r'^\s*def construct\(self\):', '', code_str, flags=re.MULTILINE)
        code_str = textwrap.dedent(code_str).strip()
        
    if not code_str and formula:
        code_str = f"""
ax = Axes(x_range=[-5, 5, 1], y_range=[-5, 5, 1], axis_config={{"include_tip": True}})
clean_formula = '{formula}'.replace('^', '**')
graph = ax.plot(lambda x: eval(clean_formula), color=BLUE)
self.add(ax, graph)
"""
    elif not code_str:
        code_str = "self.add(Text('No Input Provided', color=WHITE))"

    # AIコードのインデントを整理
    indented_code = textwrap.indent(code_str.strip(), '        ')
    
    # 実行用スコープの作成
    # import * の代わりに、manimモジュールの内容を辞書として展開して渡す
    exec_scope = {k: v for k, v in vars(manim).items() if not k.startswith('_')}
    
    # 実行用ラッパー関数を構築
    wrapper_code = f"""
def custom_construct(self):
    try:
{indented_code}
    except Exception as e:
        # 内部エラーをキャッチして画像内に表示
        err_msg = str(e)[:40]
        self.add(Text(f"Code Error: {{err_msg}}", color=RED).scale(0.6))
"""
    
    try:
        # ラッパー関数をスコープ内で定義
        exec(wrapper_code, exec_scope)
        custom_construct = exec_scope['custom_construct']
        
        class MyScene(manim.Scene):
            def construct(self):
                custom_construct(self)

        scene = MyScene()
        scene.render()
        img = scene.camera.get_image()
        
    except Exception as e:
        print(f"Critical System Error: {e}")
        class ErrorScene(manim.Scene):
            def construct(self):
                self.add(manim.Text("Syntax Error in Gen-Code", color=manim.YELLOW).scale(0.8))
        
        err_scene = ErrorScene()
        err_scene.render()
        img = err_scene.camera.get_image()

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    
    return Response(content=buf.getvalue(), media_type="image/png")