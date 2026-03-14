import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import curriculumData from "@/assets/curriculum/JP/high-school/vol-1.json";

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

        if (action === "solve") {
            if (mode === "think") {
                targetModel = "gemini-3.1-pro";
            } else if (mode === "standard") {
                targetModel = "gemini-3.1-flash";
            } else {
                targetModel = "gemini-3.1-flash-lite-preview";
            }

            temperature = 0.7;

            promptParts = [
                ...mediaParts,
                { text: `提供された画像を参考に、以下の問題について解答・解説を行ってください。\n\n${text}` }
            ];
        }
        else {
            targetModel = "gemini-3.1-flash-lite-preview";
            temperature = 0;

            promptParts = [
                ...mediaParts,
                { text: `ユーザーのテキスト: ${text || "なし"}` }, {
                    text: `指示:
                    1. 提供情報から問題を正確に全文を抽出すること。
                    2. 全ての小問を各々独立した項目として分割して抽出すること。
                    3. 各問題について、以下のカリキュラムデータに基づいて"教科/科目/単元"を判定すること。該当するものがない場合は"Unknown"と出力すること。
                    [カリキュラムデータ]: ${JSON.stringify(curriculumData)}
                    4. 各項目の先頭には必ず "# Problem: [実際の番号]" と記述し、改行すること。大問と小問のような（問の階層数は無限）階層が存在する場合は必ず "/" で区切ること。どちらか一方しかない場合は "/" を使わずそのまま記述すること。番号が特定できない場合は "# Problem: None" と記述すること。
                    5. その次の行には問題文を記述し，前置きや挨拶、説明文は一切出力しないこと。
                    6. その次の行には必ず'### Curriculum: "教科/科目/単元"'と記述し、改行すること。
                    7. 全ての数式，変数，記号は，標準的な LaTeX 形式（$...$ または $$...$$）で記述すること。
                    8. 提供情報に問題が含まれていない，または問題として認識できない場合は，"# Error"とだけ出力すること。`,
                }
            ];
        }

        const responseStream = await ai.models.generateContentStream({
            model: targetModel,
            contents: [{ role: "user", parts: promptParts }],
            config: {
                temperature: temperature,
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