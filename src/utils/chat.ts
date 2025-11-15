/* src\utils\chat.ts */
import type { SwitchState, NormalizedSwitchState } from "@/types/chat";

// ================================================================
//     1. スライダー
// ================================================================

export function getPolitenessInstruction(value: number = 0.5): string {
	if (value <= 0) return "最大限簡潔で明瞭な返答をしてね！";
	else if (value <= 0.25) return "簡潔で明瞭な返答をしてね！";
	else if (value <= 0.5) return "必要十分な返答をしてね！";
	else if (value <= 0.75) return "丁寧でわかりやすい返答をしてね!";
	else if (value <= 1) return "最大限丁寧でわかりやすい返答をしてね！";
	else return "";
}

// ================================================================
//     2. スイッチ
// ================================================================

export function normalizeSwitchOptions(
	options?: SwitchState,
): NormalizedSwitchState {
	const result: NormalizedSwitchState = {
		summary: options?.summary ?? true,
		guidance: options?.guidance ?? true,
		explanation: options?.explanation ?? true,
		answer: options?.answer ?? true,
	};

	return result;
}

// ================================================================
//     3. プロンプト
// ================================================================

export function buildPrompt(
	politenessText: string,
	switches: NormalizedSwitchState,
	userPrompt: string,
): string {
	const sections: string[] = [
		"以下の4つのセクションにおいて、それぞれ独立したものとして干渉や連携しないで返答してね！でも、セクション間の区切り線は不要だ。",
		politenessText,
		"以下の形式で日本語で一般的な知識で教科書に準拠して返答してね:",
	];

	sections.push(
		"整理されたわかりやすいレイアウト（記号や絵文字など）で構築し、数式は **可能な限り、改行したディスプレイ数式（$$ ... $$）** で書くこと",
	);

	if (switches.summary)
		sections.push(
			`### 要約\n提示された質問の要約のみをやって！\n質問の本質的なものを抽出する感じ。`,
		);

	if (switches.guidance)
		sections.push(
			`### 指針\n提示された質問の指針のみを立てて！\n答えを導くための重要なヒントをフローチャート的に。`,
		);

	if (switches.explanation)
		sections.push(
			`### 解説\n提示された質問の解説のみをして答えを導き出して！\n数式・公式・計算、英文など解説の対象のものは改行して。`,
		);

	if (switches.answer)
		sections.push(
			`### 解答\n提示された質問の解答のみを書いて！\n記述式のテストに書き込むのを意識して、答えを求めるまでの必須な軌跡も含めて簡潔に。`,
		);

	sections.push(`今回の質問: ${userPrompt}`);
	return sections.join("\n\n");
}
