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
};

type Part = {
  text?: string;
  inlineData?: { mimeType: string; data: string };
};

type Content = {
  role: "user" | "model";
  parts: Part[];
};

type PostPayload = {
  prompt: string;
  options?: SwitchOptions;
  sliders?: SliderOptions;
  images?: ImageSet;
  history?: Content[];
};

function ensureCredentials() {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (json && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const tmpPath = path.join("/tmp", "credentials.json");
    fs.writeFileSync(tmpPath, json);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  }
}

function getPolitenessInstruction(value: number): string {
  if (value <= 0) return "最大限簡潔で明瞭な返答をしてね！";
  else if (value <= 0.25) return "簡潔で明瞭な返答をしてね！";
  else if (value <= 0.5) return "必要十分な返答をしてね！";
  else if (value <= 0.75) return "丁寧でわかりやすい返答をしてね!";
  else if (value <= 1) return "最大限丁寧でわかりやすい返答をしてね！";
  else return "";
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
  if (!Object.values(result).some(Boolean)) {
    result.summary = true;
    result.explanation = true;
  }
  return result;
}

function buildPrompt(
  politenessText: string,
  switches: Required<SwitchOptions>,
  userPrompt: string
): string {
  const sections: string[] = [
    "以下の4つのセクションにおいて、それぞれ独立したものとして干渉や連携しないで返答してね！でも、セクション間の区切り線は不要だ。",
    politenessText,
    "以下の形式で日本語で一般的な知識で教科書に準拠して返答してね:",
  ];

  sections.push(
    "整理されたわかりやすいレイアウト（記号や絵文字など）で構築し、数式は LaTeX 形式で書くことだ！"
  );

  if (switches.summary)
    sections.push(
      `### 要約\n提示された質問の要約のみをやって！\n質問の本質的なものを抽出する感じ。`
    );

  if (switches.guidance)
    sections.push(
      `### 指針\n提示された質問の指針のみを立てて！\n答えを導くための重要なヒントをフローチャート的に。`
    );

  if (switches.explanation)
    sections.push(
      `### 解説\n提示された質問の解説のみをして答えを導き出して！\n数式・公式・計算、英文など解説の対象のものは改行して。`
    );

  if (switches.answer)
    sections.push(
      `### 解答\n提示された質問の解答のみを書いて！\n記述式のテストに書き込むのを意識して、答えを求めるまでの必須な軌跡も含めて簡潔に。`
    );

  sections.push(`今回の質問: ${userPrompt}`);
  return sections.join("\n\n");
}

export async function POST(req: NextRequest) {
  const { prompt, options, sliders, images, history }: PostPayload =
    await req.json();

  if (!prompt && !images?.problem?.length) {
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

  const politenessText = getPolitenessInstruction(sliders?.politeness ?? 0.5);
  const switches = normalizeSwitchOptions(options);
  const finalPrompt = buildPrompt(politenessText, switches, prompt);

  const userParts: Part[] = [{ text: finalPrompt }];

  if (images?.problem) {
    images.problem.forEach((base64) => {
      const data = base64.split(",")[1];
      userParts.push({ inlineData: { mimeType: "image/png", data } });
    });
  }

  const userContent: Content = { role: "user", parts: userParts };
  const contents: Content[] = [...(history || []), userContent];

  const { readable, writable } = new TransformStream();

  (async () => {
    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
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
      const writer = writable.getWriter();
      writer.write(
        new TextEncoder().encode(`\n\n**エラーが発生しました:** ${String(err)}`)
      );
      writer.close();
    }
  })();

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
