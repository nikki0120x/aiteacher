// src\app\api\gemini\route.ts

import * as fs from "node:fs";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { NextRequest } from "next/server";
import type { PostPayload, Part, Content } from "@/types/chat";
import {
	getPolitenessInstruction,
	normalizeSwitchOptions,
	buildPrompt,
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
	const { prompt, options, sliders, images, history, model = "gemini-2.5-pro" }: PostPayload =
		await req.json();

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

	const politenessText = getPolitenessInstruction(sliders?.politeness ?? 0.5);
	const switches = normalizeSwitchOptions(options);
	const finalPrompt = buildPrompt(politenessText, switches, prompt);

	const userParts: Part[] = [{ text: finalPrompt }];

	if (images?.problem) {
		images.problem.forEach((base64) => {
			const data = base64;

			userParts.push({ inlineData: { mimeType: "image/webp", data } });
		});
	}

	const userContent: Content = { role: "user", parts: userParts };
	const contents: Content[] = [...(history || []), userContent];

	const { readable, writable } = new TransformStream();

	(async () => {
		try {
			const stream = await ai.models.generateContentStream({
				model: model,
				contents,
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
					`\n\n**エラーが発生しました:** ${String(err)}`,
				),
			);
			writer.close();
		}
	})();

	return new Response(readable, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
