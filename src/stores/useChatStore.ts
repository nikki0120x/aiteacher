import { create } from "zustand";

type Message = {
  id: number;
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
  nextId: number;
  abortController: AbortController | null;
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
    }
  ) => void;
  clearMessage: () => void;
  setAbortController: (controller: AbortController | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isSent: false,
  isLoading: false,
  isPanelOpen: true,
  activeContent: "sliders",
  message: [],
  nextId: 0,
  abortController: null,
  setIsSent: (sent) => set({ isSent: sent }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setActiveContent: (content) => set({ activeContent: content }),
  addMessage: (
    text: string,
    role: "user" | "ai" = "user",
    sectionsState?: {
      summary: boolean;
      guidance: boolean;
      explanation: boolean;
      answer: boolean;
    }
  ) =>
    set((state) => {
      const newMessage: Message = { id: state.nextId, text, role };
      if (role === "ai" && sectionsState)
        newMessage.sectionsState = sectionsState;
      return {
        message: [...state.message, newMessage],
        nextId: state.nextId + 1,
      };
    }),

  clearMessage: () => set({ message: [], nextId: 0 }),
  setAbortController: (controller) => set({ abortController: controller }),
}));
