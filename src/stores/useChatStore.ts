import { create } from "zustand";

type Part = {
	text?: string;
	inlineData?: { mimeType: string; data: string };
};

type Content = {
	role: "user" | "model";
	parts: Part[];
};

export type MessageItem = {
	id: string;
	text: string;
	role: "user" | "ai";
	sectionsState?: {
		summary: boolean;
		guidance: boolean;
		explanation: boolean;
		answer: boolean;
	};
};

interface ChatState {
	isSent: boolean;
	isLoading: boolean;
	isPanelOpen: boolean;
	activeContent: "sliders" | "images" | null;
	message: MessageItem[];
	history: Content[];
	abortController: AbortController | null;

	setIsSent: (sent: boolean) => void;
	setIsLoading: (loading: boolean) => void;
	setIsPanelOpen: (open: boolean) => void;
	togglePanel: () => void;
	setActiveContent: (content: "sliders" | "images" | null) => void;
	addContentToHistory: (content: Content) => void;

	addMessage: (
		text: string,
		role?: "user" | "ai",
		sectionsState?: {
			summary: boolean;
			guidance: boolean;
			explanation: boolean;
			answer: boolean;
		},
		id?: string,
	) => void;

	updateMessage: (id: string, newText: string) => void;

	clearMessage: () => void;
	setAbortController: (controller: AbortController | null) => void;
}

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
	setIsPanelOpen: (open) => set({ isPanelOpen: open }),
	togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
	setActiveContent: (content) => set({ activeContent: content }),

	addMessage: (text, role = "user", sectionsState, id = crypto.randomUUID()) =>
		set((state) => {
			const newMessage: MessageItem = { id, text, role };
			if (role === "ai" && sectionsState) {
				newMessage.sectionsState = sectionsState;
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