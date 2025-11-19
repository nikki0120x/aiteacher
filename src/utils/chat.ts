/* src\utils\chat.ts */
import type { SwitchState, NormalizedSwitchState } from "@/types/chat";

// ================================================================
//     1. スライダー
// ================================================================

export function getPolitenessInstruction(value: number = 0.5): string {
	if (value <= 0) return "最大限簡潔で明瞭な返答";
	else if (value <= 0.25) return "簡潔で明瞭な返答";
	else if (value <= 0.5) return "必要十分な返答";
	else if (value <= 0.75) return "丁寧でわかりやすい返答";
	else if (value <= 1) return "最大限丁寧でわかりやすい返答";
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
		"【全セクションに共通する厳格なルール】",
		"- 数式は KaTeX の「改行ディスプレイ数式（$$ ... $$）」を絶対に使うこと",
		"- 文中に式を埋め込まない。式は必ず単独の行に絶対に置くこと",
		"- レイアウトは整理された見やすい構成にする。必要なら箇条書きや記号を使用可",
		"- 日本語で、一般的知識 + 教科書レベルの内容で説明",

		"以下の4つのセクションは相互に干渉せず、独立して返答。区切り線は不要。",
		politenessText,
		"以下の形式で返答",
	];

	if (switches.summary)
		sections.push(
			`### 要約\n問題の要約(問題の要点)のみ返答`,
		);

	if (switches.guidance)
		sections.push(
			`### 指針\n問題の指針(問題を解くためのヒント)のみ返答`,
		);

	if (switches.explanation)
		sections.push(
			`### 解説\n問題の解説(問題の答えまで導く説明)のみ返答`,
		);

	if (switches.answer)
		sections.push(
			`### 解答\n問題の解答(問題の答え)のみ返答`,
		);

	sections.push(`今回の質問: ${userPrompt}`);
	return sections.join("\n\n");
}
