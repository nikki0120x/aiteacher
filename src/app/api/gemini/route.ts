/* src/app/api/gemini/route.t */
import * as fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Content, Part, PostPayload } from "@/types/chat";
import {
	buildImageParts,
	buildUnifiedPrompt,
	buildUnifiedSchema,
	getPolitenessInstruction,
	normalizeSwitchOptions,
} from "@/utils/chat";

export const runtime = "nodejs";

function ensureCredentials() {
	const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
	const target = "/tmp/credentials.json";
	if (json && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		if (!fs.existsSync(target)) fs.writeFileSync(target, json);
		process.env.GOOGLE_APPLICATION_CREDENTIALS = target;
	}
}

export async function POST(req: NextRequest) {
	const startTime = Date.now();
	const {
		prompt,
		options,
		sliders,
		images,
		history,
		model = "gemini-2.5-flash",
	}: PostPayload = await req.json();

	console.log(
		`\x1b[36m[Request]\x1b[0m Model: ${model}, Prompt: "${prompt?.substring(0, 30)}..."`,
	);

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

	try {
		const imageParts = buildImageParts(images);
		const politenessText = getPolitenessInstruction(sliders?.politeness ?? 0.5);
		const switches = normalizeSwitchOptions(options);

		const responseSchema = buildUnifiedSchema(switches);
		const finalPrompt = buildUnifiedPrompt(
			politenessText,
			switches,
			prompt || "(Image provided)",
		);

		const mainUserParts: Part[] = [{ text: finalPrompt }, ...imageParts];
		const userContent: Content = { role: "user", parts: mainUserParts };
		const contents: Content[] = [...(history || []), userContent];

		const { readable, writable } = new TransformStream();

		(async () => {
			const writer = writable.getWriter();
			let fullResponseText = "";
			let firstChunkTime: number | null = null;

			try {
				const stream = await ai.models.generateContentStream({
					model: model,
					contents,
					config: {
						responseMimeType: "application/json",
						responseSchema: z.toJSONSchema(responseSchema),
					},
				});

				for await (const part of stream) {
					if (part.text) {
						if (firstChunkTime === null) {
							firstChunkTime = Date.now();
							console.log(
								`\x1b[32m[Stream]\x1b[0m Response started (TTFB: ${firstChunkTime - startTime}ms)`,
							);
						}

						fullResponseText += part.text;
						await writer.ready;
						writer.write(new TextEncoder().encode(part.text));
					}
				}

				const duration = Date.now() - startTime;
				try {
					const parsed = JSON.parse(fullResponseText);
					console.log(
						`\x1b[35m[Result]\x1b[0m isProblem: ${parsed.isProblem}, Subject: ${parsed.subject}`,
					);
				} catch {
					const isProblem = fullResponseText.includes('"isProblem":true');
					const isMath = fullResponseText.includes('"subject":"math"');
					console.log(
						`\x1b[35m[Result]\x1b[0m (Heuristic) isProblem: ${isProblem}, Math: ${isMath}`,
					);
				}
				console.log(`\x1b[32m[Done]\x1b[0m Total Duration: ${duration}ms`);

				writer.close();
			} catch (err) {
				console.error("\x1b[31m[Stream Error]\x1b[0m", err);
				const errorPayload = JSON.stringify({
					isProblem: true,
					subject: "other",
					summary: [
						{
							type: "text",
							content: `**エラーが発生しました:** ${String(err)}`,
						},
					],
					guidance: [],
					explanation: [],
					answer: [],
				});
				writer.write(new TextEncoder().encode(errorPayload));
				writer.close();
			}
		})();

		return new Response(readable, {
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	} catch (e) {
		console.error("\x1b[31m[Critical Error]\x1b[0m", e);
		return NextResponse.json(
			{ error: "処理中にエラーが発生しました" },
			{ status: 500 },
		);
	}
}
