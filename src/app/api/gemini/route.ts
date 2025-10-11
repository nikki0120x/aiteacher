import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
    });

    // SDK の型を使って型安全にする
    const response = (await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
あなたは説明をするAIです。
計算式や数式は Markdown のコードブロック (\`\`\`math\`\`\`) で書いてください。
ユーザーの質問: ${prompt}
`,
            },
          ],
        },
      ],
    })) as GenerateContentResponse;

    // getter プロパティなので () は不要
    const text = response.text ?? "応答がありません";

    return NextResponse.json({ text });
  } catch (error: unknown) {
    // 型安全にエラー処理
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}