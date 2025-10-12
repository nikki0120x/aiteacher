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
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const tmpPath = path.join("/tmp", "credentials.json");
      fs.writeFileSync(tmpPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
    }

    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
    });

    const response = (await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
あなたは説明をする AI です。
計算式や数式は Markdown のコードブロック (\`\`\`math\`\`\`) で書いてください。
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
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}