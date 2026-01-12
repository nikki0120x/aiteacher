/* src/utils/chat.ts */
import { z } from "zod";
import type { NormalizedSwitchState, Part, SwitchState } from "@/types/chat";

/* ================================ 入力内容 ================================ */

// ================================================================
//     教科
// ================================================================

export const SUBJECT_IDS = [
	"japanese",
	"math",
	"english",
	"society",
	"science",
	"information",
	"other",
] as const;
export const SUBJECT_NAMES: Record<(typeof SUBJECT_IDS)[number], string> = {
	japanese: "国語",
	math: "数学",
	english: "英語",
	society: "社会",
	science: "理科",
	information: "情報",
	other: "一般教養",
};

const contentBlockSchema = z.object({
	type: z.enum(["text", "formula"]).describe("テキストか数式か"),
	content: z.string().describe("内容。数式の場合はLaTeX形式（$$等は不要）"),
});
const sectionSchema = z.array(contentBlockSchema);

/* ================================ 入力設定 ================================ */

// ================================================================
//     スライダー
// ================================================================

export function getPolitenessInstruction(value: number = 0.5): string {
	if (value <= 0) return "かなり簡潔で分かりやすい返答";
	else if (value <= 0.25) return "よく簡潔で分かりやすい返答";
	else if (value <= 0.5) return "十分に丁寧で簡潔な分かりやすい返答";
	else if (value <= 0.75) return "よく丁寧で分かりやすい返答";
	else if (value <= 1) return "かなり丁寧で分かりやすい返答";
	else return "丁寧で簡潔な分かりやすい返答";
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
//     画像
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

/* ================================ ブループリント ================================ */

// ================================================================
//     スキーマ
// ================================================================

export function buildUnifiedSchema(
	switches: NormalizedSwitchState,
): z.ZodSchema {
	const shape: Record<string, z.ZodTypeAny> = {
		isProblem: z.boolean().describe("入力内容が質問や問題であるか"),
		subject: z.enum(SUBJECT_IDS).describe("入力内容が該当する教科"),
	};

	if (switches.summary) shape.summary = sectionSchema.describe("問題の要約");
	if (switches.guidance) shape.guidance = sectionSchema.describe("問題の指針");
	if (switches.explanation)
		shape.explanation = sectionSchema.describe("問題の解説");
	if (switches.answer) shape.answer = sectionSchema.describe("問題の解答");

	return z.object(shape);
}

// ================================================================
//     プロンプト
// ================================================================

export function buildUnifiedPrompt(
	politenessText: string,
	switches: NormalizedSwitchState,
	userPrompt: string,
): string {
	const sections: string[] = [
		`貴方は学生からの質問に対して説明をする"AITeacher"です。
		以下の手順でJSONを出力すること:
		1. 入力内容を分析し、それが質問や問題であるか(isProblem)、および教科(subject)を判定する。
		2. 判定された教科(subject)に応じた規則に従って、解説コンテンツを生成する。`,

		`# 共通規則
		- 返答は正確で分かりやすく、親しみやすい口調で説明をすること。
		- Markdownを積極的に用いて、構造的に順序立て見やすいようなレイアウトの返答をすること。
		- ${politenessText}`,

		`# 教科別生成規則 (subjectの値によって切り替えること)
		## subjectが"math"(数学)の場合:
		- 説明の途中で重要な数式や長い数式が登場する場合は、必ず \`type: 'formula'\` のブロックとして独立させること。
		- \`type: 'text'\` ブロック内のインライン数式は単一のドル記号「$ ... $」を使用すること。
		- formulaブロックの中身には \`$$\` などの囲み記号を含めず、純粋なLaTeXコードのみを記述すること。

		## subjectが"other"(一般教養)の場合:
		- 返答はすべて \`type: 'text'\` ブロックのみ使用すること。
		- 数式や記号が必要な場合は、テキストブロック内でMarkdownまたはLaTeXを使用すること。`,
	];

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
			`[解答]: 問題の解答(記述テストで答えるために必要な一連の解答)のみ説明をしてください。`,
		);

	sections.push(`
		入力が挨拶や雑談で、特定の質問や問題を含まない場合は \`isProblem: false\` を出力し、各配列フィールドは空にすること。
    `);

	sections.push(`今回の入力: ${userPrompt}`);

	return sections.join("\n\n");
}
