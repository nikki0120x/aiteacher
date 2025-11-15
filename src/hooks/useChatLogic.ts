/* src\hooks\useChatLogic.ts */
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "@/stores/useChat";
import type { Part, Content, ImageItem } from "@/types/chat";
import type { SwitchState, SliderState } from "./useChatSettings";

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
		inputText: string, // ユーザーが入力したテキスト
		images: ImageItem[], // ユーザーがアップロードした画像データ
		sliders: SliderState, // スライダーの値
		switchState: SwitchState, // スイッチの値
		setInputText: (text: string) => void, // 入力欄をクリア
		setImages: (images: { [key: string]: ImageItem[] }) => void, // 画像欄をクリア
	) => {
		if (inputText.trim() === "" && images.length === 0) return; // 入力も画像も空なら何もしない

		// ================================================================
		//     1. 画面状態を更新
		// ================================================================

		setIsSent(true); // 初回送信済みフラグをON
		setIsLoading(true); // ローディング開始
		setActiveContent(null); // 設定パネルを閉じる
		setInputText(""); // 入力欄をクリア
		setImages({ problem: [] }); // 画像欄をクリア

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

		const userParts: Part[] = [{ text: userText }]; // テキスト部分

		images.forEach((img) => {
			const base64Data = img.src.split(",")[1] || img.src; // 画像のBase64データ（画像本体）を抽出
			userParts.push({
				inlineData: { mimeType: "image/webp", data: base64Data },
			}); // 画像データをAPI送信用の形式（inlineData）で追加
		});

		const userContent: Content = { role: "user", parts: userParts }; // ユーザーの完全なContentオブジェクト

		// ===============================================================
		//     5. AIへのリクエスト送信
		// ===============================================================

		try {
			let data: string; // AIからの最終応答テキストを格納する変数

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
					addContentToHistory({ role: "model", parts: [{ text: data }] });
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
			abortController.abort(); //  進行中のリクエストを中止
			setAbortController(null); //  コントローラーの状態をクリア
			setIsLoading(false); //  ローディング状態を解除
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
