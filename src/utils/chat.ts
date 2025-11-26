/* src\utils\chat.ts */
import type { SwitchState, NormalizedSwitchState } from "@/types/chat";

// ================================================================
//     1. スライダー
// ================================================================

export function getPolitenessInstruction(value: number = 0.5): string {
	if (value <= 0) return "超簡潔な返答";
	else if (value <= 0.25) return "簡潔な返答";
	else if (value <= 0.5) return "普通の返答";
	else if (value <= 0.75) return "丁寧な返答";
	else if (value <= 1) return "超丁寧な返答";
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
		"Markdownを積極的に使用し、**見出し（##, ###）**、**太字**、**箇条書きリスト**などを用いて、構造的に順序立てて見やすいよう返答すること",
		"**数式（$や$$で囲まれた部分）をMarkdownのコードブロック（```）で囲まないこと**",
		"**インライン数式は単一のドル記号「$ ... $」を使用**",
		"**単独の数式は必ず、前後に空行（改行）を入れて二重のドル記号「$$...$$」を使用すること**",
		"sections間の区切り線は不要",
		politenessText,
	];

	if (switches.summary)
		sections.push(`### 要約\n問題の要約(問題の要点)のみ返答`);

	if (switches.guidance)
		sections.push(`### 指針\n問題の指針(問題を解くためのヒント)のみ返答`);

	if (switches.explanation)
		sections.push(`### 解説\n問題の解説(問題の答えまで導く説明)のみ返答`);

	if (switches.answer)
		sections.push(`### 解答\n問題の解答(問題の答え)のみ返答`);

	sections.push(`今回の質問: ${userPrompt}`);
	return sections.join("\n\n");
}
