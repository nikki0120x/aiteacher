import {
	type GenerateContentConfig,
	GoogleGenAI,
	ThinkingLevel,
} from "@google/genai";
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
	client_email && private_key ? { client_email, private_key } : undefined;

const ai = new GoogleGenAI({
	vertexai: true,
	project,
	location,
	googleAuthOptions: credentials ? { credentials } : undefined,
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { text, media, model, level, action, isInteractive, history } = body;

		let targetModel = "gemini-3.1-flash-lite-preview";
		let promptParts = [];
		const config: GenerateContentConfig = { temperature: 0 };
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
							mimeType: m.mimeType || "application/octet-stream",
						},
					});
				}
			}
		}

		if (action === "solve") {
			targetModel = model || "gemini-3.1-flash-lite-preview";

			// Thinking Config
			if (level === "minimal") config.thinkingConfig = { includeThoughts: true, thinkingLevel: ThinkingLevel.MINIMAL };
			else if (level === "low") config.thinkingConfig = { includeThoughts: true, thinkingLevel: ThinkingLevel.LOW };
			else if (level === "medium") config.thinkingConfig = { includeThoughts: true, thinkingLevel: ThinkingLevel.MEDIUM };
			else if (level === "high") config.thinkingConfig = { includeThoughts: true, thinkingLevel: ThinkingLevel.HIGH };

			if (isInteractive) {
				// リアルタイム対話モード用のプロンプト
				const historyContext = history ? `\n【会話履歴】\n${history}` : "";
				promptParts = [
					...mediaParts,
					{
						text: `あなたは生徒の伴走者となる教育チューターです。
                        ${historyContext}
                        【今回の生徒の入力】: ${text}

                        [厳守ルール]
                        1. **絶対に最初から正解や詳細な解説を教えないでください。**
                        2. 生徒が自分で考えられるよう、ヒントを小出しにし、必ず「次に何をすべきか」の選択肢（A, B, Cなど）を提示してください。
                        3. 返答は常に柔らかく励ますような口調で行ってください。
                        4. 出力は以下の形式のみを許可します。

                        [SECTION: チューター]
                        (生徒への問いかけと、理解度を確認するための3つ前後の選択肢)`
					}
				];
			} else {
				// 通常の解法モード
				promptParts = [
					...mediaParts,
					{
						text: `提供情報を参考に以下の問題について，柔らかく優しい口調で丁寧な返答をすること。\n${text}\n
                        [重要事項] 出力は必ず以下の4つのセクション（要約，指針，解説，解答）に分け [SECTION: セクション名] と記述してください。
                        数式はLaTeX形式($...$ または $$...$$)を使用してください。`
					}
				];
			}
		} else {
			// 問題抽出モード (既存通り)
			promptParts = [
				...mediaParts,
				{ text: `ユーザーのテキスト: ${text || "なし"}` },
				{ text: `指示: 問題を抽出し、カリキュラム判定を行ってください。\n[カリキュラム]: ${JSON.stringify(curriculumData)}` }
			];
		}

		const responseStream = await ai.models.generateContentStream({
			model: targetModel,
			contents: [{ role: "user", parts: promptParts }],
			config: config,
		});

		const stream = new ReadableStream({
			async start(controller) {
				const encoder = new TextEncoder();
				try {
					for await (const chunk of responseStream) {
						if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
					}
				} catch (e) { controller.error(e); } finally { controller.close(); }
			},
		});

		return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
	} catch (error) { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}