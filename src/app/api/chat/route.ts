import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";

const project = process.env.GOOGLE_CLOUD_PROJECT || "aiteacher-0120";
const location = process.env.GOOGLE_CLOUD_LOCATION || "global";

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
        const {
            text,
            mediaFiles,
            mode,
            activeSettingsTab,
            sliderState,
            switchState,
            teachingMode,
            listFormatText,
            isAutoList,
        } = body;

        const p = sliderState?.[activeSettingsTab] ?? 0.5;

        let systemInstruction =
            "あなたは優秀な教育アシスタントです。\n" +
            "回答は必ずMarkdown形式で行い、数式はKaTeX形式を使用して記述してください。\n";

        // モード別のプロンプト制御
        if (activeSettingsTab === "standard") {
            let detail = "";
            if (p <= 0.2) detail = "専門的で簡潔な表現を用いてください。";
            else if (p <= 0.4) detail = "専門用語を含めた詳細な解説を行ってください。";
            else if (p <= 0.6) detail = "標準的で分かりやすい丁寧な解説を心がけてください。";
            else if (p <= 0.8) detail = "難しい言葉を避け、噛み砕いた易しい表現で解説してください。";
            else detail = "非常に丁寧かつ、極めて易しい言葉で解説してください。";
            systemInstruction += `\n【丁寧度設定: ${p}】\n指示: ${detail}\n`;

        } else if (activeSettingsTab === "learning") {
            let detail = "";
            if (p <= 0.2) detail = "学習者にとって非常に挑戦的な、ハイレベルな内容で構成してください。";
            else if (p <= 0.5) detail = "標準的な学習難易度で、段階を追って説明してください。";
            else detail = "基礎の基礎から、非常にハードルを下げて解説してください。";

            systemInstruction += `\n【学習難易度設定: ${p}】\n指示: ${detail}\n`;

            // --- ここから追加：スイッチの状態に応じた構造化出力の指示 ---
            systemInstruction += "\n【出力フォーマット指示】\n" +
                "以下の項目について、有効(true)となっているもののみを、指定されたカスタムタグで囲んで出力してください。\n" +
                "各タグ内はMarkdownで記述し、アコーディオン形式で表示されることを意識してください。\n\n";

            if (switchState?.summary) {
                systemInstruction += "- 要約: [[SUMMARY]]ここに内容を記述[[/SUMMARY]]\n";
            }
            if (switchState?.guidance) {
                systemInstruction += "- 指針: [[GUIDANCE]]解法のアプローチやヒントを記述[[/GUIDANCE]]\n";
            }
            if (switchState?.explanation) {
                systemInstruction += "- 解説: [[EXPLANATION]]詳しいステップバイステップの解説を記述[[/EXPLANATION]]\n";
            }
            if (switchState?.answer) {
                systemInstruction += "- 解答: [[ANSWER]]最終的な答えを簡潔に記述[[/ANSWER]]\n";
            }

            systemInstruction += "\n※ 無効(false)の項目は、タグを含め一切出力しないでください。\n";
            // --- ここまで追加 ---

        } else if (activeSettingsTab === "teaching") {
            let detail = "";
            if (p <= 0.5) detail = "指導のポイントを簡潔にまとめてください。";
            else detail = "生徒への声掛け例や、つまずきやすいポイントを詳細に指導案として提示してください。";
            systemInstruction += `\n【指導詳細度設定: ${p}】\n指示: ${detail}\n`;
        }

        let thinkingLevel: ThinkingLevel = ThinkingLevel.LOW;

        if (mode === "fast") {
            systemInstruction += "【思考モード: Low】 簡潔かつ迅速に思考してください。\n";
            thinkingLevel = ThinkingLevel.LOW;
        } else if (mode === "standard") {
            systemInstruction += "【思考モード: Medium】 標準的な深さで思考してください。\n";
            thinkingLevel = ThinkingLevel.MEDIUM;
        } else if (mode === "think") {
            systemInstruction += "【思考モード: High】 非常に深く詳細に思考してください。\n";
            thinkingLevel = ThinkingLevel.HIGH;
        }

        const parts: any[] = [];
        if (text) parts.push({ text });

        if (mediaFiles?.length) {
            for (const media of mediaFiles) {
                const { url, mimeType } = media;

                if (url.includes("storage.googleapis.com")) {
                    const pathParts = url.split("storage.googleapis.com/")[1];
                    const fileUri = `gs://${decodeURIComponent(pathParts)}`;

                    parts.push({
                        fileData: {
                            mimeType: mimeType || "application/octet-stream",
                            fileUri: fileUri,
                        },
                    });
                } else if (url.startsWith("blob:") || url.startsWith("data:")) {
                    // 追加：ブラウザ専用のローカルURLが送られてきた場合はfetchを回避する
                    console.warn("Skipping local URL on server:", url);
                } else {
                    try {
                        const safeUrl = new URL(url).href;
                        const res = await fetch(safeUrl);
                        if (!res.ok) throw new Error(`Fetch failed with status: ${res.status}`);
                        const buffer = await res.arrayBuffer();

                        parts.push({
                            inlineData: {
                                mimeType: res.headers.get("content-type") || mimeType || "application/octet-stream",
                                data: Buffer.from(buffer).toString("base64"),
                            },
                        });
                    } catch (e) {
                        console.error("Fetch fallback error:", e);
                    }
                }
            }
        }

        // 追加：テキストも有効なメディアも無い場合は、Gemini APIを叩く前にエラーを返す
        if (parts.length === 0) {
            return NextResponse.json(
                { error: "Model input cannot be empty. Text or valid media is required." },
                { status: 400 }
            );
        }

        const streamResp = await ai.models.generateContentStream({
            model: "gemini-3.1-pro-preview",
            contents: [{ role: "user", parts }],
            config: {
                systemInstruction,
                temperature: 0,
                topP: 0,
                topK: 64,
                candidateCount: 1,
                thinkingConfig: {
                    thinkingLevel: thinkingLevel,
                },
            },
        });

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of streamResp) {
                    const text = chunk.text;
                    if (text) {
                        controller.enqueue(new TextEncoder().encode(text));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    } catch (error: any) {
        console.error("Gemini Error:", error);
        return NextResponse.json(
            { error: "Failed to generate content", details: error.message },
            { status: 500 }
        );
    }
}