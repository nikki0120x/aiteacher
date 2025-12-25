/* src/utils/chat.ts */
import { z } from "zod";
import type { NormalizedSwitchState, Part, SwitchState } from "@/types/chat";

// ================================================================
//     0. 定数・共通定義 (新規追加)
// ================================================================

export const SUBJECT_IDS = ["math", "other"] as const;
export const SUBJECT_NAMES: Record<(typeof SUBJECT_IDS)[number], string> = {
	math: "数学",
	other: "一般教養",
};

export const routingSchema = z.object({
	isProblem: z.boolean().describe("入力内容が質問や問題であるか"),
	subject: z.enum(SUBJECT_IDS).describe("入力内容が該当する教科"),
});

const contentBlockSchema = z.object({
	type: z.enum(["text", "formula"]).describe("テキストか数式か"),
	content: z.string().describe("内容。数式の場合はLaTeX形式（$$等は不要）"),
});
const sectionSchema = z.array(contentBlockSchema);

// ================================================================
//     スライダー
// ================================================================

export function getPolitenessInstruction(value: number = 0.5): string {
	if (value <= 0) return "かなり簡潔で分かりやすい返答";
	else if (value <= 0.25) return "やや簡潔で分かりやすい返答";
	else if (value <= 0.5) return "まあまあ丁寧で簡潔な分かりやすい返答";
	else if (value <= 0.75) return "やや丁寧で分かりやすい返答";
	else if (value <= 1) return "かなり丁寧で分かりやすい返答";
	else return "分かりやすい返答";
}

// ================================================================
//     スイッチ
// ================================================================

export function normalizeSwitchOptions(
	options?: SwitchState,
): NormalizedSwitchState {
	return {
		summary: options?.summary ?? true,
		guidance: options?.guidance ?? true,
		explanation: options?.explanation ?? true,
		answer: options?.answer ?? true,
	};
}

// ================================================================
//     プロンプト・ヘルパー
// ================================================================

export function buildImageParts(images?: { problem?: string[] }): Part[] {
	const parts: Part[] = [];
	if (images?.problem) {
		images.problem.forEach((base64) => {
			parts.push({ inlineData: { mimeType: "image/webp", data: base64 } });
		});
	}
	return parts;
}

export function buildRouterPrompt(userInput: string): string {
	return `
    入力内容を分析してください。
    1. 入力内容は質問や問題ですか? (isProblem)
    2. どの科目に分類されますか? (subject)
    JSONで出力してください。

    User Input: ${userInput}
    `;
}

export function buildPrompt(
	politenessText: string,
	switches: NormalizedSwitchState,
	userPrompt: string,
	subjectName: string = "先生",
	subjectId: string = "math",
): string {
	const sections: string[] = [
		`貴方は学生からの質問に対して説明をする${subjectName}の先生です。返答は正確で分かりやすく、親しみやすい口調で説明をしてください。`,
		"Markdownを積極的に使用し、**見出し（##, ###）**、**太字**、**箇条書きリスト**などを用いて、構造的に順序立てて見やすいよう返答すること",
		politenessText,
	];

	if (subjectId === "math") {
		sections.push(
			"**説明の途中で重要な数式や長い数式が登場する場合は、必ず `type: 'formula'` のブロックとして独立させること**",
			"**`type: 'text'` ブロック内のインライン数式は単一のドル記号「$ ... $」を使用**",
			"formulaブロックの中身には `$$` などの囲み記号を含めず、純粋なLaTeXコードのみを記述すること",
		);
	} else {
		sections.push(
			"**回答はすべて `type: 'text'` ブロックのみを使用すること。数式ブロック(`type: 'formula'`)は使用しないでください。**",
			"数式や記号が必要な場合は、テキストブロック内でMarkdownまたはLaTeXを使用してください。",
		);
	}

	if (switches.summary)
		sections.push(
			`[要約]: 問題の要約(問題から解くのに必要な情報とその整理)のみ説明をしてください。`,
		);
	if (switches.guidance)
		sections.push(
			`[指針]: 問題の指針(問題を解くために必要な情報)のみ説明をしてください。`,
		);
	if (switches.explanation)
		sections.push(
			`[解説]: 問題の解説(問題の解き方がわかるようなわかりやすい解説)のみ説明をしてください。`,
		);
	if (switches.answer)
		sections.push(
			`[解答]: 問題の解答(記述テストで答えるために必要な一連の解答(式など))のみ説明をしてください。`,
		);

	sections.push(`今回の質問: ${userPrompt}`);
	return sections.join("\n\n");
}

export function buildResponseSchema(
	switches: NormalizedSwitchState,
): z.ZodSchema {
	const shape: Record<string, z.ZodTypeAny> = {};
	if (switches.summary) shape.summary = sectionSchema.describe("問題の要約");
	if (switches.guidance) shape.guidance = sectionSchema.describe("問題の指針");
	if (switches.explanation)
		shape.explanation = sectionSchema.describe("問題の解説");
	if (switches.answer) shape.answer = sectionSchema.describe("問題の解答");

	return z.object(shape);
}
