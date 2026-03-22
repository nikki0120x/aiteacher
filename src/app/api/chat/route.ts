import { GoogleGenAI, ThinkingLevel } from "@google/genai";
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
		const { text, media, mode, action } = body;

		let targetModel = "gemini-3.1-flash-lite-preview";
		let promptParts = [];
		let temperature = 0;
		let thinkLevel: ThinkingLevel = ThinkingLevel.LOW;

		const mediaParts = [];
		if (media?.length > 0) {
			const urlPattern = new RegExp(
				`https://storage.googleapis.com/${bucketName}/(.+)`,
			);
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
			targetModel = "gemini-3.1-pro-preview";
			temperature = 0;

			if (mode === "fast") {
				thinkLevel = ThinkingLevel.LOW;
			} else if (mode === "standard") {
				thinkLevel = ThinkingLevel.MEDIUM;
			} else if (mode === "think") {
				thinkLevel = ThinkingLevel.HIGH;
			}

			promptParts = [
				...mediaParts,
				{
					text: `提供情報を参考に以下の問題について，柔らかく優しい口調で，非常に丁寧で分かりやすい返答をすること。
                    ${text}
                    [重要事項]
                    出力は必ず以下の4つのセクション（要約，指針，解説，解答）に分けてください。
                    各セクションの開始行は必ず [SECTION: セクション名] という形式で記述してください。

                    【数式の出力に関する厳密なルール】
                    1. 文中の単一の変数や短い記号（例: $x$ や $y$）のみインライン数式 ($...$) を使用すること。
                    2. 計算過程、分数、ベクトル、方程式など、少しでも長さのある数式は、**必ず**ディスプレイ数式 ($$...$$) を用いて独立した行として出力すること。
                    3. 単一の $ 記号で数式を囲んで改行するだけ（例: $\n3x+2\n$）の記法は絶対に禁止です。

                    前置きや挨拶は一切出力せず、以下の形式のみを出力してください。
                    [SECTION: 要約]
                    (要約の内容)
                    [SECTION: 指針]
                    (指針の内容)
                    [SECTION: 解説]
                    (解説の内容)
                    [SECTION: 解答]
                    (解答の内容)`,
				},
			];
		} else {
			targetModel = "gemini-3.1-flash-lite-preview";
			temperature = 0;

			promptParts = [
				...mediaParts,
				{ text: `ユーザーのテキスト: ${text || "なし"}` },
				{
					text: `指示:
                    1. 全ての小問を各々独立した項目として分割して抽出すること（4の問題文の記述の際は小問を包含する大問を参照するものとする）。
                    2. 各問題について、以下のカリキュラムデータに基づいて"教科/科目/単元"を判定すること。該当するものがない場合は"Unknown"と出力すること。
                    [カリキュラムデータ]: ${JSON.stringify(curriculumData)}
                    3. 各項目の先頭には，必ず "# Problem: [実際の番号]" と記述し、改行すること。大問と小問（問の階層数は無限）階層が存在する場合は必ず "/" で区切ること。どちらか一方しかない場合は "/" を使わずそのまま記述すること。番号が特定できない場合は "# Problem: None" と記述すること。
                    4. [重要]その次の行には，問題文を全ての小問を包含する全ての大問まで全文正確に記述し，前置きや挨拶、説明文は一切出力しないこと。
                    5. その次の行には，必ず'### Curriculum: "教科/科目/単元"'と記述し、改行すること。
                    6. 全ての数式，変数，記号は，標準的な LaTeX 形式（$...$ または $$...$$）で記述すること。
                    7. 提供情報に問題が含まれていない，または問題として認識できない場合は，"# Error"とだけ出力すること。`,
				},
			];
		}

		const responseStream = await ai.models.generateContentStream({
			model: targetModel,
			contents: [{ role: "user", parts: promptParts }],
			config: {
				temperature: temperature,
				thinkingConfig: {
					includeThoughts: false,
					thinkingLevel: thinkLevel,
				},
			},
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
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("API Route Error:", error);
		return NextResponse.json({ error: "Failed" }, { status: 500 });
	}
}
