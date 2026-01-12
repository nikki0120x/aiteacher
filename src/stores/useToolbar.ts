/* src\stores\useToolbar.ts */
import { create } from "zustand";

// ================================================================
//     状態
// ================================================================

interface ToolbarState {
	isToolbarOpen: boolean;
	toggleToolbar: () => void;
	setToolbarOpen: (isOpen: boolean) => void;
}

// ================================================================
//     保存
// ================================================================

export const useToolbarStore = create<ToolbarState>((set) => ({
	isToolbarOpen: false,
	toggleToolbar: () =>
		set((state) => ({ isToolbarOpen: !state.isToolbarOpen })),
	setToolbarOpen: (isOpen) => set({ isToolbarOpen: isOpen }),
}));
