// src/app/api/chat/route.ts
import { VertexAI } from "@google-cloud/vertexai";
import { NextResponse } from "next/server";

// 環境変数に以下を設定しておく必要があります:
// GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION (例: asia-northeast1)
const project = process.env.GOOGLE_CLOUD_PROJECT || "your-project-id";
const location = process.env.GOOGLE_CLOUD_LOCATION || "asia-northeast1";

const vertexAI = new VertexAI({ project, location });

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, mediaUrls } = body;

        const generativeModel = vertexAI.getGenerativeModel({
            model: "gemini-2.5-pro", // または gemini-2.5-flash
        });

        const parts: any[] = [];

        // テキストの追加
        if (text) {
            parts.push({ text });
        }

        // 画像URLをBase64に変換して追加
        if (mediaUrls && mediaUrls.length > 0) {
            for (const url of mediaUrls) {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const mimeType = response.headers.get("content-type") || "image/jpeg";

                parts.push({
                    inlineData: {
                        data: buffer.toString("base64"),
                        mimeType: mimeType,
                    },
                });
            }
        }

        // ストリーミングで回答を生成
        const streamingResp = await generativeModel.generateContentStream({
            contents: [{ role: "user", parts }],
        });

        // クライアント側でReadableStreamとして受け取るための設定
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of streamingResp.stream) {
                    const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    if (chunkText) {
                        controller.enqueue(new TextEncoder().encode(chunkText));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    } catch (error) {
        console.error("Vertex AI Error:", error);
        return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }
}