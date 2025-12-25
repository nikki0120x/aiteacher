/* src/app/api/gemini/route.ts */
import * as fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Content, Part, PostPayload } from "@/types/chat";
import {
	buildImageParts,
	buildPrompt,
	buildResponseSchema,
	buildRouterPrompt,
	getPolitenessInstruction,
	normalizeSwitchOptions,
	routingSchema,
	SUBJECT_NAMES,
} from "@/utils/chat";

export const runtime = "nodejs";

// ================================================================
//     ヘルパー関数
// ================================================================

function ensureCredentials() {
	const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
	const target = "/tmp/credentials.json";
	if (json && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		if (!fs.existsSync(target)) fs.writeFileSync(target, json);
		process.env.GOOGLE_APPLICATION_CREDENTIALS = target;
	}
}

// ================================================================
//     メイン処理
// ================================================================

export async function POST(req: NextRequest) {
	const {
		prompt,
		options,
		sliders,
		images,
		history,
		model = "gemini-2.5-flash",
	}: PostPayload = await req.json();

	if (!prompt && !images?.problem?.length) {
		return NextResponse.json(
			{ error: "質問内容または画像がありません" },
			{ status: 400 },
		);
	}

	ensureCredentials();

	const ai = new GoogleGenAI({
		vertexai: true,
		project: process.env.GOOGLE_CLOUD_PROJECT,
		location: process.env.GOOGLE_CLOUD_LOCATION,
	});

	// ================================================================
	//     判定ルーティング
	// ================================================================

	const routerPrompt = buildRouterPrompt(prompt || "(Image provided)");
	const imageParts = buildImageParts(images);

	const routerUserParts: Part[] = [{ text: routerPrompt }, ...imageParts];

	try {
		const classificationResult = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: [{ role: "user", parts: routerUserParts }],
			config: {
				responseMimeType: "application/json",
				responseSchema: z.toJSONSchema(routingSchema),
			},
		});

		const routingText =
			classificationResult.candidates?.[0]?.content?.parts?.[0]?.text;
		if (!routingText)
			throw new Error("判定結果（テキスト）が取得できませんでした");

		const cleanedJson = routingText.replace(/```json|```/g, "").trim();
		const route = JSON.parse(cleanedJson) as z.infer<typeof routingSchema>;

		if (route.isProblem === false) {
			return NextResponse.json({
				isProblem: false,
			});
		}

		const subjectName = SUBJECT_NAMES[route.subject] || "先生";
		console.log(`[Router] Subject detected: ${subjectName} (${route.subject})`);

		// ================================================================
		//     返答ストリーミング
		// ================================================================

		const politenessText = getPolitenessInstruction(sliders?.politeness ?? 0.5);
		const switches = normalizeSwitchOptions(options);

		const responseSchema = buildResponseSchema(switches);
		const finalPrompt = buildPrompt(
			politenessText,
			switches,
			prompt,
			subjectName,
			route.subject,
		);

		const mainUserParts: Part[] = [{ text: finalPrompt }, ...imageParts];
		const userContent: Content = { role: "user", parts: mainUserParts };
		const contents: Content[] = [...(history || []), userContent];

		const { readable, writable } = new TransformStream();

		(async () => {
			try {
				const stream = await ai.models.generateContentStream({
					model: model,
					contents,
					config: {
						responseMimeType: "application/json",
						responseSchema: z.toJSONSchema(responseSchema),
					},
				});

				const writer = writable.getWriter();
				for await (const part of stream) {
					if (part.text) {
						await writer.ready;
						writer.write(new TextEncoder().encode(part.text));
					}
				}
				writer.close();
			} catch (err) {
				console.error("ストリームエラー:", err);
				const writer = writable.getWriter();
				writer.write(
					new TextEncoder().encode(
						JSON.stringify({
							summary: [
								{
									type: "text",
									content: `**エラーが発生しました:** ${String(err)}`,
								},
							],
						}),
					),
				);
				writer.close();
			}
		})();

		return new Response(readable, {
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	} catch (e) {
		console.error("Routing/Generation Error:", e);
		return NextResponse.json(
			{ error: "処理中にエラーが発生しました" },
			{ status: 500 },
		);
	}
}
