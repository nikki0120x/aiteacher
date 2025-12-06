import { create } from "zustand";

// ================================================================
//     1. 認証の状態と更新
// ================================================================

interface AuthState {
	isModalOpen: boolean;
	openModal: () => void;
	closeModal: () => void;
}

// ================================================================
//     2. ストアの実装
// ================================================================

export const useAuthStore = create<AuthState>((set) => ({
	isModalOpen: false,
	openModal: () => set({ isModalOpen: true }),
	closeModal: () => set({ isModalOpen: false }),
}));
