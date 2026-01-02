/* src/utils/chat.ts */
import { z } from "zod";
import type { NormalizedSwitchState, Part, SwitchState } from "@/types/chat";

// ================================================================
//     定数・共通定義
// ================================================================

export const SUBJECT_IDS = ["math", "other"] as const;
export const SUBJECT_NAMES: Record<(typeof SUBJECT_IDS)[number], string> = {
	math: "数学",
	other: "一般教養",
};

// コンテンツブロックの定義
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
//     画像ヘルパー
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

// ================================================================
//     【統合版】スキーマ構築
//     isProblem, subject を先頭に定義し、続けて各セクションを配置します
// ================================================================

export function buildUnifiedSchema(
	switches: NormalizedSwitchState,
): z.ZodSchema {
	// 1. 基本となる判定フィールド
	const shape: Record<string, z.ZodTypeAny> = {
		isProblem: z.boolean().describe("入力内容が質問や問題であるか"),
		subject: z.enum(SUBJECT_IDS).describe("入力内容が該当する教科"),
	};

	// 2. ユーザー設定に基づく回答セクション
	// Geminiはスキーマの定義順に出力する傾向があるため、判定結果の後に配置します
	if (switches.summary) shape.summary = sectionSchema.describe("問題の要約");
	if (switches.guidance) shape.guidance = sectionSchema.describe("問題の指針");
	if (switches.explanation)
		shape.explanation = sectionSchema.describe("問題の解説");
	if (switches.answer) shape.answer = sectionSchema.describe("問題の解答");

	return z.object(shape);
}

// ================================================================
//     【統合版】プロンプト構築
//     教科ごとの振る舞いや、解説の構成指示をまとめて記述します
// ================================================================

export function buildUnifiedPrompt(
	politenessText: string,
	switches: NormalizedSwitchState,
	userPrompt: string,
): string {
	const sections: string[] = [
		// 役割定義と全体フロー
		`貴方は学生からの質問に対して説明をするAI講師です。
以下の手順でJSONを出力してください:
1. 入力内容を分析し、それが質問や問題であるか(isProblem)、および科目(subject)を判定する。
2. 判定された科目(subject)に応じたルールに従って、解説コンテンツを生成する。`,

		// 共通フォーマット
		`## 共通ルール
- 返答は正確で分かりやすく、親しみやすい口調で説明をしてください。
- Markdownを積極的に使用し、**見出し（##, ###）**、**太字**、**箇条書きリスト**などを用いて、構造的に順序立てて見やすいよう返答すること。
- ${politenessText}`,

		// 科目別ルール (条件分岐)
		`## 科目別生成ルール (subjectの値によって切り替えること)
1. **subjectが "math" (数学) の場合**:
   - 説明の途中で重要な数式や長い数式が登場する場合は、必ず \`type: 'formula'\` のブロックとして独立させること。
   - \`type: 'text'\` ブロック内のインライン数式は単一のドル記号「$ ... $」を使用すること。
   - formulaブロックの中身には \`$$\` などの囲み記号を含めず、純粋なLaTeXコードのみを記述すること。

2. **subjectが "other" (一般教養) の場合**:
   - 回答はすべて \`type: 'text'\` ブロックのみを使用すること。数式ブロック(\`type: 'formula'\`)は使用しないこと。
   - 数式や記号が必要な場合は、テキストブロック内でMarkdownまたはLaTeXを使用してください。`,
	];

	// 各セクションの生成指示
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

	// 非質問時の制御
	sections.push(`
    **重要**: 入力が挨拶や雑談で、特定の質問や問題を含まない場合は \`isProblem: false\` を出力し、解説等の各配列フィールドは空にしてください。
    `);

	sections.push(`今回の入力: ${userPrompt}`);

	return sections.join("\n\n");
}
