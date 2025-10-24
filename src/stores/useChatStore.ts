import { create } from "zustand";

type Message = {
  id: string; // ← number から string に変更（UUID対応）
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
  message: Message[];
  abortController: AbortController | null;

  // 状態操作関数たち
  setIsSent: (sent: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setActiveContent: (content: "sliders" | "images" | null) => void;

  addMessage: (
    text: string,
    role?: "user" | "ai",
    sectionsState?: {
      summary: boolean;
      guidance: boolean;
      explanation: boolean;
      answer: boolean;
    },
    id?: string // ← IDを指定可能に
  ) => void;

  updateMessage: (id: string, newText: string) => void; // ← 新機能

  clearMessage: () => void;
  setAbortController: (controller: AbortController | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isSent: false,
  isLoading: false,
  isPanelOpen: true,
  activeContent: "sliders",
  message: [],
  abortController: null,

  setIsSent: (sent) => set({ isSent: sent }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setActiveContent: (content) => set({ activeContent: content }),

  // メッセージ追加
  addMessage: (
    text,
    role = "user",
    sectionsState,
    id = crypto.randomUUID() // ← 明示的IDを受け取れるように
  ) =>
    set((state) => {
      const newMessage: Message = { id, text, role };
      if (role === "ai" && sectionsState) {
        newMessage.sectionsState = sectionsState;
      }
      return {
        message: [...state.message, newMessage],
      };
    }),

  // ★ メッセージ内容を上書きする関数
  updateMessage: (id, newText) =>
    set((state) => ({
      message: state.message.map((msg) =>
        msg.id === id ? { ...msg, text: newText } : msg
      ),
    })),

  clearMessage: () => set({ message: [] }),
  setAbortController: (controller) => set({ abortController: controller }),
}));
