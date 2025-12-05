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

	loginEmail: string;
	loginPassword: string;
	setLoginEmail: (email: string) => void;
	setLoginPassword: (password: string) => void;

	registerEmail: string;
	registerPassword: string;
	setRegisterEmail: (email: string) => void;
	setRegisterPassword: (password: string) => void;
}

// ================================================================
//     2. ストアの実装
// ================================================================

export const useAuthStore = create<AuthState>((set) => ({
	isModalOpen: false,
	openModal: () => set({ isModalOpen: true }),
	closeModal: () => set({ isModalOpen: false }),

	isLoggedIn: false,
	user: null,
	login: (userData) =>
		set({ isLoggedIn: true, user: userData, isModalOpen: false }),
	logout: () => set({ isLoggedIn: false, user: null }),

	loginEmail: "",
	loginPassword: "",
	setLoginEmail: (email) => set({ loginEmail: email }),
	setLoginPassword: (password) => set({ loginPassword: password }),

	registerEmail: "",
	registerPassword: "",
	setRegisterEmail: (email) => set({ registerEmail: email }),
	setRegisterPassword: (password) => set({ registerPassword: password }),
}));
