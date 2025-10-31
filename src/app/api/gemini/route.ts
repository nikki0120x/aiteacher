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
    const { prompt, options, sliders, images, history } =
      (await req.json()) as PostPayload; // ★ history を受け取る

    if (!prompt && !images?.problem?.length && !images?.solution?.length) {
      return NextResponse.json(
        { error: "prompt または画像が必要です" },
        { status: 400 }
      );
    }

    ensureCredentials();

    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
    });

    // 履歴を考慮に入れるか、新しい質問のみで分類するかはユースケースによりますが、
    // ここでは引き続き新しいプロンプトのみで分類します。
    const category = await classifyCategory(ai, prompt);
    const switches = normalizeSwitchOptions(options);
    const politenessText = getPolitenessInstruction(sliders?.politeness ?? 0.5);

    // ★ buildPrompt で作成したインストラクションを最初のターンにのみ適用するため、
    //    履歴がない（最初の会話）場合のみ finalPrompt を使用します。
    //    会話継続時は、履歴がモデルに文脈を伝えます。
    const fullInitialPrompt = buildPrompt(
      category,
      politenessText,
      switches,
      prompt
    );
    // 履歴がある場合は、finalPromptのテキストをプロンプトとして使用せず、
    // 履歴の最後に新しいユーザーの質問を追加します。
    // ユーザーの質問部分（最後の行）を探す
    const lastQuestionMarker = `ユーザーの質問: ${prompt}`;
    let instructionPart = fullInitialPrompt;

    // 形式指示部分を抽出 (ユーザーの質問以降を削除)
    if (fullInitialPrompt.endsWith(lastQuestionMarker)) {
      instructionPart = fullInitialPrompt
        .substring(0, fullInitialPrompt.length - lastQuestionMarker.length)
        .trim();
    } else {
      // 安全策: 見つからない場合は全体を使う (初回はこれでOK)
      instructionPart = fullInitialPrompt;
    }

    // 2回目以降の会話 (履歴あり) のために Content を準備
    let newParts: Part[] = [];

    if (history && history.length > 0) {
      // ★修正ポイント１: 履歴がある場合、指示部分と今回のプロンプトを結合して新しいPartを作成
      const combinedPrompt = `${instructionPart}\n\n${lastQuestionMarker}`;
      newParts = [{ text: combinedPrompt }];
    } else {
      // 初回会話 (履歴なし) の場合、instructionPart == fullInitialPrompt であり、
      // newPartsは不要。buildContents内で fullInitialPrompt が使われる。
      newParts = [{ text: fullInitialPrompt }];
    }

    // 画像の Part を追加
    const pushImages = (arr?: string[]) =>
      arr?.forEach((img) => {
        const base64 = img.split(",")[1];
        if (base64)
          newParts.push({
            inlineData: { mimeType: "image/png", data: base64 },
          });
      });

    pushImages(images?.problem);
    pushImages(images?.solution);

    // 履歴と今回のユーザー入力を結合したContents
    const contents: Content[] = [
      ...(history || []), // 既存の履歴
      { role: "user", parts: newParts }, // 今回のユーザー入力
    ];

    // ★ generateContent の呼び出しを contents に変更
    const response = (await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // 履歴と現在のプロンプトを含む contents を使用
      contents: contents,
    })) as GenerateContentResponse;

    return NextResponse.json({
      text: response.text ?? "応答がありません",
      category,
    });
  } catch (error: unknown) {
    console.error("POST /api/gemini でエラー発生:", error);
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ... (その他の既存の関数はそのまま)
