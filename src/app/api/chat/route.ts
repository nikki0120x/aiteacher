import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const project = process.env.GOOGLE_CLOUD_PROJECT || "aiteacher-0120";
const location = process.env.GOOGLE_CLOUD_LOCATION || "global";
const bucketName = process.env.GCS_BUCKET_NAME || "aiteacher-media";

const client_email = process.env.GOOGLE_CLIENT_EMAIL;
let private_key = process.env.GOOGLE_PRIVATE_KEY;

if (private_key) {
    private_key = private_key
        .replace(/\\n/g, "\n")
        .replace(/\r/g, "")
        .replace(/^"|"$/g, "");
}

const credentials =
    client_email && private_key
        ? { client_email, private_key }
        : undefined;

const ai = new GoogleGenAI({
    vertexai: true,
    project,
    location,
    googleAuthOptions: credentials ? { credentials } : undefined,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, media, mode, turnId } = body;
        const mediaParts = [];

        if (media?.length > 0) {
            const urlPattern = new RegExp(`https://storage.googleapis.com/${bucketName}/(.+)`);
            for (const m of media) {
                const match = m.url?.match(urlPattern);
                if (match?.[1]) {
                    const filename = decodeURIComponent(match[1]);
                    mediaParts.push({
                        fileData: {
                            fileUri: `gs://${bucketName}/${filename}`,
                            mimeType: m.mimeType || "application/octet-stream"
                        }
                    });
                }
            }
        }

        const promptParts = [
            ...mediaParts,
            { text: `ユーザーのテキスト: ${text || "なし"}` }, {
                text: `指示:
1. 提供された画像から問題を正確に抽出してください。
2. 【重要】(1), (2), (3) などの小問がある場合は、必ず1つずつ独立した項目として分割して抽出してください。
3. 各項目の冒頭には必ず「# 問題」とだけ記述してください。前置き（例：「抽出いたします」など）や挨拶、説明文は一切出力せず、いきなり「# 問題」から始めてください。
4. すべての数式、変数、数学記号は、例外なく標準的な LaTeX 形式（$...$ または $$...$$）で記述してください。
5. 問題文は要約せず、画像にある通りに全文を抽出してください。`,
            }
        ];

        const responseStream = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: [{ role: "user", parts: promptParts }],
            config: {
                temperature: 0,
                thinkingConfig: {
                    includeThoughts: false,
                }
            }
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of responseStream) {
                        if (chunk.text) {
                            controller.enqueue(encoder.encode(chunk.text));
                        }
                    }
                } catch (e) {
                    console.error("Stream error:", e);
                    controller.error(e);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        });

    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}