import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import fs from "fs";
import path from "path";

// サーバーサイド専用 API
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt が無効です" }, { status: 400 });
    }

    // Vercel や一部クラウド環境では JSON を一時ファイルに書き込む
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

    const response = (await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
あんたはユーザーから提供された問題の要約と解説と解答をしてね。解説には問題の答えを求めるまでの丁寧な解説を書いてね。解答にはテストで書くための生徒に寄り添った必要最低限の簡潔な解答を書いてね。
要約と解説と解答中の数式は必ず LaTeX を使い、ブラウザで MathJax で SVG として表示されることを意識して書いて。
文中の重要な部分は ==ハイライト== を使って欲しいけど、コードブロックや数式内には絶対に==を入れないでね。
ユーザーは高校生なので、大学以上の知識は使わず、教科書・参考書レベルで、とてもわかりやすく説明してね。
レイアウトは必要な公式や重要な数式、途中式は見やすいよう場所を広くとって、わかりやすい説明をお願い！
ユーザーの質問: ${prompt}
              `,
            },
          ],
        },
      ],
    })) as GenerateContentResponse;

    const text = response.text ?? "応答がありません";
    return NextResponse.json({ text });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
