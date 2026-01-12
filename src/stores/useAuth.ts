/* src\stores\useAuth.ts */
import { create } from "zustand";

// ================================================================
//     状態
// ================================================================

interface AuthState {
	isModalOpen: boolean;
	openModal: () => void;
	closeModal: () => void;
}

// ================================================================
//     保存
// ================================================================

export const useAuthStore = create<AuthState>((set) => ({
	isModalOpen: false,
	openModal: () => set({ isModalOpen: true }),
	closeModal: () => set({ isModalOpen: false }),
}));
