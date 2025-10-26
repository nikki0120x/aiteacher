// src/app/api/gemini/route.ts (最終修正版)

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
// ❌ fsとpathのインポートを削除
// import fs from "fs";
// import path from "path";

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

// ❌ ensureCredentials 関数を完全に削除
// 理由：fs.writeFileSyncがサーバーレス環境でクラッシュの原因となるため
/*
function ensureCredentials() {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (json && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const tmpPath = path.join("/tmp", "credentials.json");
    fs.writeFileSync(tmpPath, json);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  }
}
*/

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
    math: "あなたは高校数学の教師です。",
    physics: "あなたは高校物理の教師です。",
    chemistry: "あなたは高校化学の教師です。",
    biology: "あなたは高校生物の教師です。",
    earth_science: "あなたは高校地学の教師です。",
    english: "あなたは高校英語の教師です。",
    other: "あなたは高校生向けのやさしい先生です。",
  };

  const sections: string[] = [
    `${baseInstructions[category]}`,
    politenessText,
    "以下の形式で回答してください:",
  ];

  if (switches.summary)
    sections.push(
      `### 要約\n問題の要点を簡潔にまとめて、それ以外の指針、解説、解答はしない。\n数式は LaTeX で書き、コードブロックではなく通常の形式で書くこと。`
    );

  if (switches.guidance)
    sections.push(
      `### 指針\n問題解決の方針や考え方を丁寧に示し、それ以外の要約や解説、解答はしない。\n数式は LaTeX 形式で書くこと。`
    );

  if (switches.explanation)
    sections.push(
      `### 解説\n解答までの手順を説明する。最後に使用した定義や公式をリスト形式でまとめること。\n数式は LaTeX 形式で書くこと。`
    );

  if (switches.answer)
    sections.push(
      `### 解答\nテストや入試の筆記を意識した簡潔な解答をする。\n数式は LaTeX 形式で書くこと。`
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

function buildParts(prompt: string, images?: ImageSet) {
  const parts: {
    text?: string;
    inlineData?: { mimeType: string; data: string };
  }[] = [{ text: prompt }];

  const pushImages = (arr?: string[]) =>
    arr?.forEach((img) => {
      const base64 = img.split(",")[1];
      if (base64)
        parts.push({
          inlineData: { mimeType: "image/png", data: base64 },
        });
    });

  pushImages(images?.problem);
  pushImages(images?.solution);

  return parts;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, options, sliders, images } = (await req.json()) as {
      prompt: string;
      options?: SwitchOptions;
      sliders?: SliderOptions;
      images?: ImageSet;
    };

    if (!prompt && !images?.problem?.length && !images?.solution?.length) {
      return NextResponse.json(
        { error: "prompt または画像が必要です" },
        { status: 400 }
      );
    }

    // ❌ ensureCredentials(); の呼び出しを削除

    // 認証情報に関する特殊なオプションを使用せず、環境変数から自動認証を期待
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
      // ✅ credentials オプションを削除
    });

    const category = await classifyCategory(ai, prompt);
    const switches = normalizeSwitchOptions(options);
    const politenessText = getPolitenessInstruction(sliders?.politeness ?? 0.5);
    const finalPrompt = buildPrompt(category, politenessText, switches, prompt);
    const parts = buildParts(finalPrompt, images);

    const response = (await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
    })) as GenerateContentResponse;

    return NextResponse.json({
      text: response.text ?? "応答がありません",
      category,
    });
  } catch (error: unknown) {
    // サーバーがクラッシュしてもHTMLを返さず、必ずJSON形式のエラーを返す
    console.error("POST /api/gemini でエラー発生:", error);
    
    const errorMessage =
      error instanceof Error
        ? error.message
        : "サーバーで予期せぬエラーが発生しました。ログを確認してください。";

    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 }
    );
  }
}