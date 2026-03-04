/* src/app/api/gemini/route.ts */
import * as fs from "node:fs";
import { type Content, GoogleGenAI, type Part } from "@google/genai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
	BlockSchema,
	CATEGORY_MAP,
	type PostPayload,
	type Question,
	type SliderState,
	SUBJECT_MAP,
	type SwitchState,
} from "@/models/modelChat";

export const runtime = "nodejs";

//	=================================================================
//		鍵を環境変数から取得
//	=================================================================

function ensureCredentials() {
	const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
	const target = "/tmp/credentials.json";
	if (json && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		if (!fs.existsSync(target)) fs.writeFileSync(target, json);
		process.env.GOOGLE_APPLICATION_CREDENTIALS = target;
	}
}

// 	=================================================================
//  	返答構築
// 	=================================================================

function buildResponseSchema(
	sliderConfig: SliderState,
	switchConfig: SwitchState,
	questionConfig: Question,
) {
	const blockArray = z.array(BlockSchema);

	const politenessInst = (() => {
		const v = sliderConfig.politeness;
		if (v <= 0) return "かなり簡潔で分かりやすい返答";
		if (v <= 0.25) return "よく簡潔で分かりやすい返答";
		if (v <= 0.5) return "十分に丁寧で簡潔な分かりやすい返答";
		if (v <= 0.75) return "よく丁寧で分かりやすい返答";
		if (v <= 1) return "かなり丁寧で分かりやすい返答";
		return "丁寧で簡潔な分かりやすい返答";
	})();

	const responseShape: Record<string, z.ZodTypeAny> = {};
	if (switchConfig.summary) responseShape.summary = blockArray;
	if (switchConfig.guidance) responseShape.guidance = blockArray;
	if (switchConfig.explanation) responseShape.explanation = blockArray;
	if (switchConfig.answer) responseShape.answer = blockArray;

	return z.object({
		metadata: z.object({
			appliedPoliteness: z.string().describe(`指示: ${politenessInst}`),
			sliderValue: z.number().describe(`設定値: ${sliderConfig.politeness}`),
		}),

		// --- 教科・カテゴリの推測 ---
		analysis: z.object({
			subjectId: z
				.enum(Object.keys(SUBJECT_MAP) as [string, ...string[]])
				.nullable(),
			categoryId: z.enum(Object.keys(CATEGORY_MAP) as [string, ...string[]]),
		}),

		response: z.object(responseShape),

		curriculumContext: z
			.object({
				suggestedRange: z
					.array(z.string())
					.describe(`範囲設定: ${JSON.stringify(questionConfig.range)}`),
				nextLearningTopic: z.string().describe("次に学習すべきトピックの提案"),
			})
			.optional(),
	});
}

// =================================================================
//  データ変換ヘルパー
// =================================================================

function normalizeContents(payload: PostPayload): Content[] {
	const history = payload.history || [];
	const currentPrompt = payload.prompt;
	const allContents = [...history, currentPrompt];

	return allContents.map((c) => {
		const parts: Part[] = c.parts.map((p) => {
			if (p.text) return { text: p.text };
			if (p.file) {
				const src = p.file.src;
				const base64Data = src.split(",")[1] || src;
				return {
					inlineData: {
						mimeType: p.file.mimeType,
						data: base64Data,
					},
				};
			}
			return { text: "" };
		});

		return {
			role: c.role === "model" ? "model" : "user",
			parts: parts,
		};
	});
}

// 	=================================================================
// 		送信
// 	=================================================================

export async function POST(req: NextRequest) {
	const startTime = Date.now();

	try {
		const body = await req.json();

		if (!body.prompt && !body.history) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const payload = body as PostPayload;

		const {
			model = "gemini-2.5-flash",
			slider = { politeness: 0.5 },
			switch: switchConfig = {
				isEnabled: true,
				summary: true,
				explanation: true,
				guidance: true,
				answer: true,
			},
		} = payload;

		console.log(
			`\x1b[36m[Request]\x1b[0m Model: ${model}, Politeness: ${slider.politeness}`,
		);

		ensureCredentials();

		const ai = new GoogleGenAI({
			vertexai: true,
			project: process.env.GOOGLE_CLOUD_PROJECT,
			location: process.env.GOOGLE_CLOUD_LOCATION,
		});

		const responseSchema = buildResponseSchema(switchConfig);
		const contents = normalizeContents(payload);
		const politenessInst = getPolitenessInstruction(slider.politeness);

		const activeSections = Object.entries(switchConfig)
			.filter(([key, value]) => key !== "isEnabled" && value === true)
			.map(([key]) => key)
			.join(", ");

		const systemInstruction = `
あなたは高度な教育支援AIです。以下の指示に従ってユーザーを支援してください。

### 基本方針
- **丁寧さ**: ${politenessInst}
- **フォーマット**: 指定されたJSONスキーマに厳密に従ってください。
- **数式**: 数式は必ずLaTeX形式で記述し、単独の行の場合は \`$$\`、文中の場合は \`$\` で囲んでください。
- **構造化**: 回答はブロック(Block)のリストとして構成されます。テキスト、数式、コードなどを適切なブロックタイプに分けて出力してください。

### ブロックタイプ定義
- \`text\`: 通常の文章 (Markdown可)
- \`formula\`: LaTeX数式
- \`modernJapanese\`: 現代文の解説など
- \`glossary\`: 用語集 (term, description, importanceを含む)
- その他のブロックタイプも文脈に応じて使用可能

### 出力セクション
ユーザーの設定に基づき、以下のセクションが有効な場合にのみ生成してください:
${activeSections}
`;

		const { readable, writable } = new TransformStream();
		const writer = writable.getWriter();

		(async () => {
			try {
				const result = await ai.models.generateContentStream({
					model: model,
					contents: contents,
					config: {
						systemInstruction: systemInstruction,
						responseMimeType: "application/json",
						responseSchema: responseSchema,
					},
				});

				let firstChunkTime: number | null = null;

				// 修正箇所: resultを直接イテレーションし、chunk.text をプロパティとしてアクセス
				for await (const chunk of result) {
					const text = chunk.text; // 修正: () を削除
					if (text) {
						if (!firstChunkTime) {
							firstChunkTime = Date.now();
							console.log(
								`\x1b[32m[Stream]\x1b[0m Started (TTFB: ${firstChunkTime - startTime}ms)`,
							);
						}
						await writer.ready;
						writer.write(new TextEncoder().encode(text));
					}
				}

				console.log(
					`\x1b[32m[Done]\x1b[0m Total Duration: ${Date.now() - startTime}ms`,
				);
			} catch (error) {
				console.error("\x1b[31m[Stream Error]\x1b[0m", error);
				const errorResponse = JSON.stringify({
					isProblem: true,
					subjectId: "others",
					categoryId: "default",
					explanation: [
						{
							type: "text",
							content: `**エラーが発生しました**: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
				});
				writer.write(new TextEncoder().encode(errorResponse));
			} finally {
				writer.close();
			}
		})();

		return new Response(readable, {
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (e) {
		console.error("\x1b[31m[Critical Error]\x1b[0m", e);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
