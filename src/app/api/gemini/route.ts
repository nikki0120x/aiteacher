import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

type SwitchOptions = {
  summary?: boolean;
  guidance?: boolean;
  explanation?: boolean;
  answer?: boolean;
};

type SliderOptions = {
  politeness?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, options, sliders, images } = (await req.json()) as {
      prompt: string;
      options?: SwitchOptions;
      sliders?: SliderOptions;
      images?: {
        problem?: string[];
        solution?: string[];
      };
    };

    if (
      (!prompt || typeof prompt !== "string") &&
      !images?.problem?.length &&
      !images?.solution?.length
    ) {
      return NextResponse.json(
        { error: "prompt または画像が必要です" },
        { status: 400 }
      );
    }

    // スイッチ設定
    const switchOptions: Required<SwitchOptions> = {
      summary: options?.summary ?? true,
      guidance: options?.guidance ?? false,
      explanation: options?.explanation ?? false,
      answer: options?.answer ?? true,
    };

    if (
      !switchOptions.summary &&
      !switchOptions.guidance &&
      !switchOptions.explanation &&
      !switchOptions.answer
    ) {
      switchOptions.summary = true;
      switchOptions.explanation = true;
    }

    // スライダー設定
    const politeness = sliders?.politeness ?? 0.5;

    // 丁寧度の指示
    let politenessText = "";

    if (politeness === 0) {
      politenessText =
        "簡潔に無駄な言葉は使わずテストや入試のような簡単明瞭な返答をして";
    } else if (politeness <= 0.25) {
      politenessText = "簡単にわかりやすく必要最低限の説明で返答して";
    } else if (politeness <= 0.5) {
      politenessText = "一般的にわかりやすくなるように返答して。";
    } else if (politeness <= 0.75) {
      politenessText = "見やすくわかりやすく丁寧に返答して。";
    } else if (politeness <= 1) {
      politenessText = "誰でも理解できるよう非常に丁寧かつ詳しく返答して。";
    }

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

    console.log("分類結果:", classify);

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
${politenessText}
以下の形式で回答してください:
`;

    if (switchOptions.summary) {
      finalPrompt += `
### 要約
問題の要点を簡潔にまとめて、それ以外の指針、解説、解答はしない。
数式は LaTeX で書き、MathJax で表示できるように、コードブロックで書かないように。
`;
    }

    if (switchOptions.guidance) {
      finalPrompt += `
### 指針
問題解決の方針や考え方を丁寧に示し、それ以外の問題の要約、解説、解答はしない。
数式は LaTeX で書き、MathJax で表示できるように、コードブロックで書かないように。
`;
    }

    if (switchOptions.explanation) {
      finalPrompt += `
### 解説
解答までの手順を説明するように。
数式は LaTeX で書き、MathJax で表示できるように、コードブロックで書かないように。
最後にはリスト形式で使用した定義や公式をまとめること | 左部: 名前, 中部: 定義や公式, 右部: 記号や単位
`;
    }

    if (switchOptions.answer) {
      finalPrompt += `
### 解答
テストや入試などの筆記等で記述するための解答をする。生徒が実際に解答として書くのを意識して返答して。
数式は LaTeX で書き、MathJax で表示できるように、コードブロックで書かないように。
`;
    }

    finalPrompt += `\nユーザーの質問: ${prompt}\n`;

    const parts: {
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }[] = [{ text: finalPrompt }];

    // 画像がある場合は inlineData に変換して追加
    if (images?.problem?.length) {
      images.problem.forEach((imgBase64) => {
        const data = imgBase64?.split(",")[1];
        if (data) {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data,
            },
          });
        }
      });
    }

    if (images?.solution?.length) {
      images.solution.forEach((imgBase64) => {
        const data = imgBase64?.split(",")[1];
        if (data) {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data,
            },
          });
        }
      });
    }

    // これで generateContent を呼ぶ
    const response = (await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
    })) as GenerateContentResponse;

    const text = response.text ?? "応答がありません";
    return NextResponse.json({ text, category });
  } catch (error: unknown) {
    console.error("POST /api/gemini でエラー発生:", error);
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
