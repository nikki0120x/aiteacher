import { create } from "zustand";
import type { AppMenu } from "@/models/modelApp";
import type { MODEL_STATUS_MAP } from "@/models/modelChat";

export interface ChatNotification {
	id: string;
	title: string;
	status: keyof typeof MODEL_STATUS_MAP;
	updatedAt: number;
	isRead: boolean;
}

interface AppState {
	isSidebarOpen: boolean;
	setSidebarOpen: () => void;

	activeMenu: AppMenu;
	menuDirection: number;
	setActiveMenu: (activeMenu: AppMenu, menuDirection: number) => void;

	chatResetSignal: number;
	triggerChatReset: () => void;

	chatNotifications: ChatNotification[];
	upsertChatNotification: (
		notification: Omit<ChatNotification, "isRead">,
	) => void;
	markChatNotificationAsRead: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
	isSidebarOpen: false,
	setSidebarOpen: () =>
		set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

	activeMenu: null,
	menuDirection: 0,
	setActiveMenu: (activeMenu, menuDirection = 0) =>
		set({ activeMenu, menuDirection }),

	chatResetSignal: 0,
	triggerChatReset: () =>
		set((state) => ({ chatResetSignal: state.chatResetSignal + 1 })),

	chatNotifications: [],
	upsertChatNotification: (newNotif) =>
		set((state) => {
			const existingIndex = state.chatNotifications.findIndex(
				(n) => n.id === newNotif.id,
			);
			if (existingIndex !== -1) {
				const updated = [...state.chatNotifications];
				updated[existingIndex] = {
					...updated[existingIndex],
					...newNotif,
					isRead: false,
				};
				return { chatNotifications: updated };
			}
			return {
				chatNotifications: [
					{ ...newNotif, isRead: false },
					...state.chatNotifications,
				],
			};
		}),
	markChatNotificationAsRead: (id) =>
		set((state) => ({
			chatNotifications: state.chatNotifications.map((n) =>
				n.id === id ? { ...n, isRead: true } : n,
			),
		})),
}));
