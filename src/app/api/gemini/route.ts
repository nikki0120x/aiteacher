import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt が無効です" }, { status: 400 });
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

    // Step 1: 教科分類
    // Step 1: 教科分類
    const classify = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
次の質問がどの教科に属するかを判断してください。
候補は "math"（数学）, "physics"（物理）, "chemistry"（化学）, 
"biology"（生物）, "earth_science"（地学）, "english"（英語）, "other"（その他） のいずれかです。
出力はその7つのうち1つだけにしてください。
質問: ${prompt}
          `,
            },
          ],
        },
      ],
    });

    // 教科分類結果の抽出
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

    // Step 2: 教科別プロンプト生成
    const mathInstruction = `
あなたは高校数学の教師です。
ユーザーから提供された数学の問題について、以下の形式で答えてください：

---
### 要約
問題の要点を簡潔にまとめる。

### 解説
解答の手順を丁寧に説明。
数式は LaTeX で書き、MathJax で表示できるように。
高校レベルの知識で説明する。

### 解答
テストで書くための簡潔な答え。
---

ユーザーの質問: ${prompt}
    `;

    const physicsInstruction = `
あなたは高校物理の教師です。
以下の物理の問題について、わかりやすく説明してください。

---
### 要約
物理現象や問題の設定を簡潔にまとめる。

### 解説
公式の導出や考え方を丁寧に説明。
数式は LaTeX で書き、物理量の意味も補足する。
高校物理の範囲を超えないように。

### 解答
テストで書くための簡潔な答え。
---

ユーザーの質問: ${prompt}
    `;

    const chemistryInstruction = `
あなたは高校化学の教師です。
次の化学の質問に対して、化学反応や理論を高校範囲で説明してください。

---
### 要約
問題のテーマと目的を簡潔にまとめる。

### 解説
化学反応式や理論を使いながら、手順を丁寧に説明。
数式や化学式は LaTeX で書き、MathJax で表示できるように。
必要があれば注意点や例も加える。

### 解答
テストで書くための簡潔な答え。
---

ユーザーの質問: ${prompt}
    `;

    const biologyInstruction = `
あなたは高校生物の教師です。
次の生物の質問に対して、高校範囲の知識で丁寧に説明してください。

---
### 要約
生物現象や仕組みの概要を簡潔にまとめる。

### 解説
関連する生体反応、構造、メカニズムを説明。
必要に応じて図や例を言葉で表現。
数式や化学式は LaTeX で書いてもよい。

### 解答
テストで書くための簡潔な答え。
---

ユーザーの質問: ${prompt}
`;

    const earthScienceInstruction = `
あなたは高校地学の教師です。
次の地学に関する質問に対して、わかりやすく高校範囲で説明してください。

---
### 要約
地球現象や観測対象の概要を簡潔にまとめる。

### 解説
プレートテクトニクス、気象、天文、地質など関連する理論を整理して説明。
必要に応じて数値や式は LaTeX 形式で記述。

### 解答
テストで書くための簡潔な答え。
---

ユーザーの質問: ${prompt}
`;

    const englishInstruction = `
あなたは高校英語の教師です。
次の英語の質問に対して、文法・語彙・読解の観点から高校レベルで説明してください。

---
### 要約
質問のテーマや文法項目を簡潔にまとめる。

### 解説
文構造・意味・用法を丁寧に解説。
例文を示して理解を助ける。

### 解答
テストで書くための簡潔な答え。
---

ユーザーの質問: ${prompt}
`;

    const otherInstruction = `
あなたは高校生向けのやさしい先生です。
以下の質問に対して、わかりやすく、丁寧に、かつ簡潔に説明してください。
専門用語が出る場合は短く補足を加えて。
ユーザーの質問: ${prompt}
    `;

    const finalPrompt =
      category === "math"
        ? mathInstruction
        : category === "physics"
        ? physicsInstruction
        : category === "chemistry"
        ? chemistryInstruction
        : category === "biology"
        ? biologyInstruction
        : category === "earth_science"
        ? earthScienceInstruction
        : category === "english"
        ? englishInstruction
        : otherInstruction;

    // Step 3: 実際の回答生成
    const response = (await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
