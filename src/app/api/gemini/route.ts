import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
あなたは説明をするAIです。
計算式や数式は Markdown のコードブロック (\`\`\`math\`\`\`) で書いてください。
ユーザーの質問:${prompt}
`,
            },
          ],
        },
      ],
    });

    // getter プロパティなので () は不要
    const text = response.text ?? "応答がありません";

    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
