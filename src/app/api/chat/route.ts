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
        const { text, media, mode, turnId, action } = body;

        let targetModel = "gemini-3.1-flash-lite-preview";
        let promptParts = [];
        let temperature = 0;

        // メディア（画像）のパース処理（共通で使用するため外に出す）
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

        // ==========================================
        // 1. 解答フェーズ (action === "solve")
        // ==========================================
        if (action === "solve") {
            if (mode === "think") {
                targetModel = "gemini-3.1-pro";
            } else if (mode === "standard") {
                targetModel = "gemini-3.1-flash";
            } else {
                targetModel = "gemini-3.1-flash-lite-preview";
            }

            temperature = 0.7;

            // 元の画像と、選択された問題文を一緒に渡す
            promptParts = [
                ...mediaParts,
                { text: `提供された画像を参考に、以下の問題について解答・解説を行ってください。\n\n${text}` }
            ];
        }
        // ==========================================
        // 2. 問題抽出フェーズ (デフォルト)
        // ==========================================
        else {
            targetModel = "gemini-3.1-flash-lite-preview";
            temperature = 0;

            promptParts = [
                ...mediaParts,
                { text: `ユーザーのテキスト: ${text || "なし"}` }, {
                    text: `指示:
1. 提供された画像から問題を正確に抽出してください。
2. 【重要】(1), (2), (3) などの小問がある場合は、必ず1つずつ独立した項目として分割して抽出してください。
3. 各項目の冒頭には必ず「# 問題」とだけ記述してください。前置きや挨拶、説明文は一切出力せず、いきなり「# 問題」から始めてください。
4. すべての数式、変数、数学記号は、例外なく標準的な LaTeX 形式（$...$ または $$...$$）で記述してください。
5. 問題文は要約せず、画像にある通りに全文を抽出してください。`,
                }
            ];
        }

        // AIへリクエスト送信
        const responseStream = await ai.models.generateContentStream({
            model: targetModel, // 分岐したモデルを適用
            contents: [{ role: "user", parts: promptParts }],
            config: {
                temperature: temperature, // 分岐した温度を適用
                thinkingConfig: {
                    includeThoughts: false,
                }
            }
        });

        const stream = new ReadableStream({
            // ... (stream の処理は変更なし) ...
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