import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type SwitchOptions = {
  summary?: boolean;
  guidance?: boolean;
  explanation?: boolean;
  answer?: boolean;
};

type SliderOptions = {
  politeness?: number;
};

type ImageSet = {
  problem?: string[];
  solution?: string[];
};

// @google/genai の Content/Part の型に合わせる
type Part = {
  text?: string;
  inlineData?: { mimeType: string; data: string };
};

type Content = {
  role: "user" | "model";
  parts: Part[];
};

// POSTで受け取るペイロードの型
type PostPayload = {
  prompt: string;
  options?: SwitchOptions;
  sliders?: SliderOptions;
  images?: ImageSet;
  // ★追加: 会話履歴の型定義
  history?: Content[];
};

// ... (既存の型定義は省略)

function ensureCredentials() {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (json && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const tmpPath = path.join("/tmp", "credentials.json");
    fs.writeFileSync(tmpPath, json);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  }
}

function getPolitenessInstruction(value: number): string {
  if (value <= 0)
    return "簡潔に無駄な言葉は使わずテストや入試のような簡単明瞭な返答をして";
  else if (value <= 0.25) return "簡単にわかりやすく必要最低限の説明で返答して";
  else if (value <= 0.5) return "一般的にわかりやすくなるように返答して。";
  else if (value <= 0.75) return "見やすくわかりやすく丁寧に返答して。";
  else if (value <= 1)
    return "誰でも理解できるよう非常に丁寧かつ詳しく返答して。";
  else return "丁寧に、ただし冗長にならないよう自然な言葉で返答して。";
}

function normalizeSwitchOptions(
  options?: SwitchOptions
): Required<SwitchOptions> {
  const result = {
    summary: options?.summary ?? true,
    guidance: options?.guidance ?? false,
    explanation: options?.explanation ?? false,
    answer: options?.answer ?? true,
  };
  // 全部 false なら summary と explanation を強制ON
  if (!Object.values(result).some(Boolean)) {
    result.summary = true;
    result.explanation = true;
  }
  return result;
}

function buildPrompt(
  category: string,
  politenessText: string,
  switches: Required<SwitchOptions>,
  userPrompt: string
): string {
  const baseInstructions: Record<string, string> = {
    math: "あなたは数学者であり、教師です。",
    physics: "あなたは物理学者であり、教師です。",
    chemistry: "あなたは化学者であり、教師です。",
    biology: "あなたは生物学者であり、教師です。",
    earth_science: "あなたは地学者であり、教師です。",
    english: "あなたは英語話者であり、教師です。",
    other: "あなたは学者であり、教師です。",
  };

  const sections: string[] = [
    `${baseInstructions[category]}`,
    politenessText,
    "以下の形式で回答してください:",
  ];

  sections.push(
    "AI は、出力形式のセクション指示（###）を厳密に守り、ONになっている最初のセクションのヘッダーから直ちに回答を開始してください。それ以外のテキストは出力しないでください。",
    "**重要:** ユーザーがOFFにしたセクション（例：解答）の内容を、ONになっている他のセクション（例：解説）に含めないでください。各セクションの役割を厳密に守ってください。OFFになっているセクションの役割は、ONになっているセクションが代行してはいけません。"
  );

  if (switches.summary)
    sections.push(
      `### 要約\n問題の要点を**簡潔に**まとめてください。**詳細な手順や解答自体は書かないでください。**\n数式は LaTeX で書き、コードブロックではなく通常の形式で書くこと。`
    );

  if (switches.guidance)
    sections.push(
      `### 指針\n問題解決のための**最初のアプローチや着眼点**に焦点を当て、視覚的にわかりやすいように構造的に表現してください。**具体的な解法や計算手順は書かないでください。**\n数式は LaTeX 形式で書くこと。`
    );

  if (switches.explanation)
    sections.push(
      `### 解説\n**解答の裏付けとなる論理展開と手順**を詳細に説明してください。最初に、問題解決までの発想ルートを視覚的にわかりやすいように構造的に表現し、次に解答までの手順を説明する。最後に、使用した定義や公式をリスト形式でまとめること。\n数式は LaTeX 形式で書くこと。`
    );

  if (switches.answer)
    sections.push(
      `### 解答\n**答えとなる最終的な数式、計算結果、または値を正確に記載してください。**テストや入試の筆記を意識した、解答形式にしてください。\n数式は LaTeX 形式で書くこと。`
    );

  sections.push(`ユーザーの質問: ${userPrompt}`);
  return sections.join("\n\n");
}

async function classifyCategory(ai: GoogleGenAI, prompt: string) {
  const classify = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
次の質問がどの教科に属するかを判断してください。
候補: "math","physics","chemistry","biology","earth_science","english","other"
出力はその7つのうち1つだけ
質問: ${prompt}
            `,
          },
        ],
      },
    ],
  });

  const text = classify.text?.toLowerCase() ?? "other";
  if (text.includes("math")) return "math";
  if (text.includes("phys")) return "physics";
  if (text.includes("chem")) return "chemistry";
  if (text.includes("bio")) return "biology";
  if (text.includes("earth") || text.includes("geo")) return "earth_science";
  if (text.includes("eng")) return "english";
  return "other";
}

// route.ts の POST 関数全体を修正

export async function POST(req: NextRequest) {
  // ★ 修正: ペイロード全体を取得し、オプション、スライダー、画像をデストラクト
  const { prompt, options, sliders, images, history }: PostPayload =
    await req.json();

  // ★ ユーザーがプロンプトを入力していない場合はエラー応答を返す
  if (!prompt && !images?.problem?.length && !images?.solution?.length) {
    return NextResponse.json(
      { error: "質問内容または画像がありません" },
      { status: 400 }
    );
  }

  ensureCredentials();

  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  });

  // 1. カテゴリ分類とプロンプトの構築
  const category = await classifyCategory(ai, prompt);
  const politenessText = getPolitenessInstruction(sliders?.politeness ?? 0.5);
  const switches = normalizeSwitchOptions(options);
  const finalPrompt = buildPrompt(category, politenessText, switches, prompt);

  // 2. ユーザー Content の Parts を構築
  const userParts: Part[] = [{ text: finalPrompt }];

  // 画像データを Parts に追加
  if (images?.problem) {
    images.problem.forEach((base64) => {
      // Base64 からプレフィックスを削除し、mimeType を指定（今回はpngと仮定）
      const data = base64.split(",")[1];
      userParts.push({ inlineData: { mimeType: "image/png", data } });
    });
  }
  if (images?.solution) {
    images.solution.forEach((base64) => {
      const data = base64.split(",")[1];
      userParts.push({ inlineData: { mimeType: "image/png", data } });
    });
  }

  // 3. 最終的な Contents 構築 (履歴 + 新しいユーザー Content)
  const userContent: Content = { role: "user", parts: userParts };
  const contents: Content[] = [...(history || []), userContent];

  const { readable, writable } = new TransformStream();

  (async () => {
    try {
      // generateContentStream の呼び出しに 'await' を追加 (以前の修正を保持)
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents, // ★ 構築したcontentsを使用
      });

      const writer = writable.getWriter();

      for await (const part of stream) {
        if (part.text) {
          writer.write(new TextEncoder().encode(part.text));
        }
      }
      writer.close();
    } catch (err) {
      console.error("ストリームエラー:", err);
      // エラー発生時もストリームを閉じる
      const writer = writable.getWriter();
      writer.write(
        new TextEncoder().encode(`\n\n**エラーが発生しました:** ${String(err)}`)
      );
      writer.close();
    }
  })();

  return new Response(readable, {
    // Content-Type を 'text/plain' のままにして、クライアント側で生のテキストとして処理
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
