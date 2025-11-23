/* src\hooks\useChatDisplay.ts */
import {
	useState,
	useEffect,
	useRef,
	useLayoutEffect,
	useCallback,
} from "react";
import { useChatStore } from "@/stores/useChat";
import type { ChatTurn } from "@/types/chat";

// ================================================================
//     1. チャットの構成
// ================================================================

const LOADING_PHRASES = [
	"回答を準備しています...",
	"思考中...",
	"思案中...",
	"構成を練っています...",
	"情報を整理中...",
	"回答を生成中です...",
];
const NUM_PHRASES = LOADING_PHRASES.length;

// ================================================================
//     2. チャットの構成
// ================================================================

export const useChatDisplay = () => {
	const { message, isLoading, isPanelOpen } = useChatStore();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const chatHistoryRef = useRef<HTMLDivElement>(null);

	const [chatHistoryHeight, setChatHistoryHeight] = useState<
		number | undefined
	>(undefined);
	const prevHeightRef = useRef<number | undefined>(undefined);
	const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);

	// チャット履歴のターンを計算
	const calculateTurns = useCallback((): ChatTurn[] => {
		const turns: ChatTurn[] = [];
		for (let i = 0; i < message.length; i++) {
			const msg = message[i];
			if (msg.role === "user") {
				turns.push({
					user: msg,
					model: message[i + 1]?.role === "ai" ? message[i + 1] : undefined,
				});
			}
		}
		return turns;
	}, [message]);

	const turns = calculateTurns();
	const lastTurnId = turns.slice(-1)[0]?.user.id;

	// ローディングフレーズの切り替え
	useEffect(() => {
		const isCurrentlyLoadingWithPlaceholder =
			isLoading && message.slice(-1)[0]?.text === "#LOADING_PHRASE#";

		if (isCurrentlyLoadingWithPlaceholder) {
			const interval = setInterval(() => {
				setCurrentLoadingIndex((prevIndex) => (prevIndex + 1) % NUM_PHRASES);
			}, 2500);

			return () => clearInterval(interval);
		}
	}, [isLoading, message]);

	// 自動スクロール
	useLayoutEffect(() => {
		// `turns.length` が変わったとき（つまり新しいユーザーメッセージが追加されたとき）に実行される
		if (messagesEndRef.current) {
			// 新しいターンが追加されたら、一番下へスクロール
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [turns.length]); // 依存配列に `turns.length` を指定

	// chatHistoryHeight の動的計測 (ResizeObserverとDebounceを使用)
	useLayoutEffect(() => {
		const chatElement = chatHistoryRef.current;
		if (!chatElement) return;

		let timeoutId: NodeJS.Timeout | null = null;
		const DEBOUNCE_DELAY = 50;

		const measureHeight = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				const height = chatElement.clientHeight;
				if (height !== prevHeightRef.current) {
					setChatHistoryHeight(height);
				}
				prevHeightRef.current = height;
			}, DEBOUNCE_DELAY);
		};

		const observer = new ResizeObserver(measureHeight);
		observer.observe(chatElement);

		return () => {
			observer.disconnect();
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, []);

	const getLoadingPhrase = (index: number) => {
		const phraseIndex = (index + currentLoadingIndex) % NUM_PHRASES;
		return LOADING_PHRASES[phraseIndex];
	};

	return {
		turns,
		lastTurnId,
		chatHistoryRef,
		messagesEndRef,
		chatHistoryHeight,
		getLoadingPhrase,
		isPanelOpen,
	};
};
