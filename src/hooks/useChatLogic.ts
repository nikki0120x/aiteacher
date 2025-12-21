/* src\hooks\useChatLogic.ts */
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "@/stores/useChat";
import type { Content, ImageItem, Part } from "@/types/chat";
import type { SliderState, SwitchState } from "./useChatSettings";

declare global {
	interface Window {
		__TAURI__?: unknown;
	}
}

export const useChatLogic = () => {
	// ================================================================
	//     1. グローバル状態の取得
	// ================================================================

	const {
		isSent,
		isLoading,
		history,
		abortController,
		setIsSent,
		setIsLoading,
		setActiveContent,
		addMessage,
		addContentToHistory,
		setAbortController,
		updateMessage,
	} = useChatStore();

	// ================================================================
	//     2. リクエスト送信処理（handleSend）
	// ================================================================

	const handleSend = async (
		inputText: string,
		images: ImageItem[],
		sliders: SliderState,
		switchState: SwitchState,
		setInputText: (text: string) => void,
		setImages: (images: { [key: string]: ImageItem[] }) => void,
	) => {
		if (inputText.trim() === "" && images.length === 0) return;

		// ================================================================
		//     1. 画面状態を更新
		// ================================================================

		setIsSent(true);
		setIsLoading(true);
		setActiveContent(null);
		setInputText("");
		setImages({ problem: [] });

		// ================================================================
		//     2. リクエストを準備
		// ================================================================

		const userText = inputText || "(画像のみ)";
		const tempId = crypto.randomUUID();
		const controller = new AbortController();
		setAbortController(controller);

		// ================================================================
		//     3. 画面に待機メッセージを追加
		// ================================================================

		addMessage(userText, "user");
		addMessage("#LOADING_PHRASE#", "ai", switchState, tempId);

		// ================================================================
		//     4. API送信用のデータを準備
		// ================================================================

		const userParts: Part[] = [{ text: userText }];

		images.forEach((img) => {
			const base64Data = img.src.split(",")[1] || img.src;
			userParts.push({
				inlineData: { mimeType: "image/webp", data: base64Data },
			});
		});

		const userContent: Content = { role: "user", parts: userParts };

		// ===============================================================
		//     5. AIへのリクエスト送信
		// ===============================================================

		try {
			let data: string;

			if (typeof window.__TAURI__ !== "undefined") {
				const imageSources = images.map((item) => item.src);
				data = await invoke("process_gemini_request", {
					prompt: inputText,
					images: { problem: imageSources },
					options: switchState,
					sliders,
				});

				if (!controller.signal.aborted && data) {
					updateMessage(tempId, data);
					addContentToHistory(userContent);
					addContentToHistory({
						role: "model",
						parts: [{ text: data }],
					});
				}
			} else {
				const payloadImages = {
					problem: images.map((item) => item.src.split(",")[1] || item.src),
				};

				const res = await fetch("/api/gemini", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						prompt: userText,
						options: switchState,
						sliders,
						images: payloadImages,
						history,
					}),
					signal: controller.signal,
				});

				if (!res.body) {
					throw new Error("応答ストリームがありません。");
				}

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let accumulatedText = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					accumulatedText += chunk;
					updateMessage(tempId, accumulatedText);
				}

				if (!controller.signal.aborted && accumulatedText) {
					addContentToHistory(userContent);
					addContentToHistory({
						role: "model",
						parts: [{ text: accumulatedText }],
					});
				}
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				console.log("Request aborted successfully.");
			} else {
				console.error("Gemini request error:", error);
			}
		} finally {
			setIsLoading(false);
			setAbortController(null);
		}
	};

	// ================================================================
	//     3. リクエスト中断処理（handleAbort）
	// ================================================================

	const handleAbort = () => {
		if (abortController) {
			abortController.abort();
			setAbortController(null);
			setIsLoading(false);
		}
	};

	// ================================================================
	//     4. 外部公開インターフェース
	// ================================================================

	return {
		isSent,
		isLoading,
		handleSend,
		handleAbort,
	};
};
