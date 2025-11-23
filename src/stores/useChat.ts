/* src\stores\useChat.ts */
import { create } from "zustand";
import type { Content, MessageItem, SwitchState } from "@/types/chat";
import { normalizeSwitchOptions } from "@/utils/chat";

// ================================================================
//     1. チャットの状態と更新
// ================================================================

interface ChatState {
	isSent: boolean;
	isLoading: boolean;
	isPanelOpen: boolean;
	message: MessageItem[];
	activeContent: "sliders" | "images" | null;
	history: Content[];
	abortController: AbortController | null;

	setIsSent: (sent: boolean) => void;
	setIsLoading: (loading: boolean) => void;
	setActiveContent: (content: "sliders" | "images" | null) => void;
	addContentToHistory: (content: Content) => void;
	addMessage: (
		text: string,
		role?: "user" | "ai",
		sectionsState?: SwitchState,
		id?: string,
	) => void;
	updateMessage: (id: string, newText: string) => void;
	clearMessage: () => void;
	setAbortController: (controller: AbortController | null) => void;
}

// ================================================================
//     2. ストアの実装
// ================================================================

export const useChatStore = create<ChatState>((set) => ({
	isSent: false,
	isLoading: false,
	isPanelOpen: true,
	activeContent: null,
	message: [],
	history: [],
	abortController: null,

	setIsSent: (sent) => set({ isSent: sent }),
	setIsLoading: (loading) => set({ isLoading: loading }),
	setActiveContent: (content) => set({ activeContent: content }),
	addMessage: (text, role = "user", sectionsState, id = crypto.randomUUID()) =>
		set((state) => {
			const newMessage: MessageItem = {
				id,
				text,
				role,
				timestamp: Date.now(),
			};
			if (role === "ai" && sectionsState) {
				newMessage.sectionsState = normalizeSwitchOptions(sectionsState);
			}
			return {
				message: [...state.message, newMessage],
			};
		}),
	addContentToHistory: (content) =>
		set((state) => ({
			history: [...state.history, content],
		})),
	updateMessage: (id, newText) =>
		set((state) => ({
			message: state.message.map((msg) =>
				msg.id === id ? { ...msg, text: newText } : msg,
			),
		})),
	clearMessage: () => set({ message: [], history: [] }),
	setAbortController: (controller) => set({ abortController: controller }),
}));
