import { create } from "zustand";

// ================================================================
//     1. 認証の状態と更新
// ================================================================

interface AuthState {
	isModalOpen: boolean;
	openModal: () => void;
	closeModal: () => void;
	isLoggedIn: boolean;
	user: {
		uid: string;
		name: string;
		email: string;
	} | null;
	login: (userData: { uid: string; name: string; email: string }) => void;
	logout: () => void;
}

// ================================================================
//     2. ストアの実装
// ================================================================

export const useAuthStore = create<AuthState>((set) => ({
	isModalOpen: false,
	isLoggedIn: false,
	user: null,

	openModal: () => set({ isModalOpen: true }),
	closeModal: () => set({ isModalOpen: false }),
	login: (userData) =>
		set({ isLoggedIn: true, user: userData, isModalOpen: false }),
	logout: () => set({ isLoggedIn: false, user: null }),
}));
