/* src\hooks\useTextInput.ts */
import { useState, useEffect, useRef } from "react";

export const useChatInput = (onSend: (text: string) => void) => {
	// ================================================================
	//     1. 状態管理
	// ================================================================

	const [inputText, setInputText] = useState("");
	const [isListening, setIsListening] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const recognitionRef = useRef<SpeechRecognition | null>(null);

	// ================================================================
	//     2. キーダウンイベントの処理
	// ================================================================

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (!isMobile && e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (inputText.trim() !== "") {
				onSend(inputText);
			}
		}
	};

	// ================================================================
	//     3. 環境判定
	// ================================================================

	useEffect(() => {
		if (typeof navigator !== "undefined") {
			setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
		}
	}, []); // ユーザーエージェントからモバイルデバイス（iPhone/iPad/iPod/Android）を判定

	// ================================================================
	//     4. 音声認識の初期化とイベント設定
	// ================================================================

	useEffect(() => {
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (!SpeechRecognition) {
			console.warn("このブラウザは音声認識をサポートしていません！");
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = "ja-JP";
		recognition.interimResults = true;
		recognition.continuous = true;

		const handleResult = (event: SpeechRecognitionEvent) => {
			const transcript = Array.from(event.results)
				.map((result) => result[0].transcript)
				.join("");
			setInputText(transcript);
		};

		const handleError = (event: SpeechRecognitionErrorEvent) => {
			console.error("音声認識エラー:", event);
			setIsListening(false);
		};

		const handleEnd = () => {
			setIsListening(false);
		};

		recognition.addEventListener("result", handleResult);
		recognition.addEventListener("error", handleError);
		recognition.addEventListener("end", handleEnd);

		recognitionRef.current = recognition;

		return () => {
			recognition.removeEventListener("result", handleResult);
			recognition.removeEventListener("error", handleError);
			recognition.removeEventListener("end", handleEnd);
			recognition.stop();
			recognitionRef.current = null;
		};
	}, []);

	// ================================================================
	//     5. マイクの切替
	// ================================================================

	const toggleListening = () => {
		const recognition = recognitionRef.current;
		if (!recognition) return;

		if (isListening) {
			recognition.stop();
			setIsListening(false);
		} else {
			recognition.start();
			setIsListening(true);
		}
	};

	// ================================================================
	//     6. 外部公開インターフェース
	// ================================================================

	return {
		inputText,
		setInputText,
		isListening,
		toggleListening,
		handleKeyDown,
		isMobile,
	};
};
