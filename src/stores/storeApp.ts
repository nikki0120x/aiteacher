import { create } from "zustand";
import type { AppMenu } from "@/models/modelApp";

interface AppState {
	isSidebarOpen: boolean;
	setSidebarOpen: () => void;

	activeMenu: AppMenu;
	menuDirection: number;
	setActiveMenu: (activeMenu: AppMenu, menuDirection: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
	isSidebarOpen: false,
	setSidebarOpen: () =>
		set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

	activeMenu: null,
	menuDirection: 0,
	setActiveMenu: (activeMenu, menuDirection = 0) =>
		set({ activeMenu, menuDirection }),
}));
