import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import fs from "fs";
import path from "path";

type SwitchOptions = {
  summary?: boolean;
  guidance?: boolean;
  answer?: boolean;
  explanation?: boolean;
};

type SliderOptions = {
  understanding?: number; // 0〜1
  politeness?: number;    // 0〜1
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, options, sliders } = (await req.json()) as {
      prompt: string;
      options?: SwitchOptions;
      sliders?: SliderOptions;
    };

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt が無効です" }, { status: 400 });
    }

    // スイッチ設定
    const switchOptions: Required<SwitchOptions> = {
      summary: true,
      guidance: options?.guidance ?? false,
      answer: options?.answer ?? false,
      explanation: options?.explanation ?? false,
    };

    // スライダー設定
    const understanding = sliders?.understanding ?? 0.5;
    const politeness = sliders?.politeness ?? 0.5;

    // 理解度の指示
    let understandingText = "";
    if (understanding <= 0.33) understandingText = "ユーザーは問題への理解が浅いことを考慮してください。";
    else if (understanding <= 0.66) understandingText = "ユーザーは問題への理解が普通なことを考慮してください。";
    else understandingText = "ユーザーは問題への理解が深いことを考慮してください。";

    // 丁寧度の指示
    let politenessText = "";
    if (politeness <= 0.33) politenessText = "簡潔に無駄な言葉は使わずテストや入試のような返答をしてください。";
    else if (politeness <= 0.66) politenessText = "一般的な普通のわかりやすい、公式を用いる際はそれも記述して返答をしてください。";
    else politenessText = "誰でもわかりやすいようとても丁寧に詳しく、公式を用いる際は公式と公式の説明をして返答してください。";

    // 一時認証設定（Vercel対応）
    if (
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON &&
      !process.env.GOOGLE_APPLICATION_CREDENTIALS
    ) {
      const tmpPath = path.join("/tmp", "credentials.json");
      fs.writeFileSync(
        tmpPath,
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      );
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
    }

    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
    });

    // 教科分類
    const classify = await ai.models.generateContent({
      model: "gemini-2.5-pro",
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

    const rawCategory = classify.text?.toLowerCase() ?? "other";
    let category:
      | "math"
      | "physics"
      | "chemistry"
      | "biology"
      | "earth_science"
      | "english"
      | "other" = "other";

    if (rawCategory.includes("math")) category = "math";
    else if (rawCategory.includes("phys")) category = "physics";
    else if (rawCategory.includes("chem")) category = "chemistry";
    else if (rawCategory.includes("bio")) category = "biology";
    else if (rawCategory.includes("earth") || rawCategory.includes("geo"))
      category = "earth_science";
    else if (rawCategory.includes("eng")) category = "english";

    const baseInstructions: Record<string, string> = {
      math: "あなたは高校数学の教師です。",
      physics: "あなたは高校物理の教師です。",
      chemistry: "あなたは高校化学の教師です。",
      biology: "あなたは高校生物の教師です。",
      earth_science: "あなたは高校地学の教師です。",
      english: "あなたは高校英語の教師です。",
      other: "あなたは高校生向けのやさしい先生です。",
    };

    // プロンプトに理解度と丁寧度の指示を追加
    let finalPrompt = `${baseInstructions[category]}
${understandingText}
${politenessText}
以下の形式で回答してください:
`;

    if (switchOptions.summary) {
      finalPrompt += `
### 要約
問題の要点を簡潔にまとめて、それ以外の指針、解説、解答はしない。
`;
    }

    if (switchOptions.guidance) {
      finalPrompt += `
### 指針
問題解決の方針や考え方を丁寧に示し、それ以外の問題の要約、解説、解答はしない。
`;
    }

    if (switchOptions.answer) {
      finalPrompt += `
### 解説
解答までの手順を説明するように。
数式は LaTeX で書き、MathJax で表示できるように。
最後にリスト形式で使用した定義や公式をまとめること | 左部: 名前, 中部: 定義や公式, 右部: 記号や単位
`;
    }

    if (switchOptions.explanation) {
      finalPrompt += `
### 解答
テストや入試などの筆記等で記述するための解答をする。生徒が実際に解答として書くのを意識して返答して。
`;
    }

    finalPrompt += `\nユーザーの質問: ${prompt}\n`;

    const response = (await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
    })) as GenerateContentResponse;

    const text = response.text ?? "応答がありません";
    return NextResponse.json({ text, category });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}