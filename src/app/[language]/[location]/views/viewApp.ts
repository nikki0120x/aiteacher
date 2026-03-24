import {
	useHeader,
	useSidebar,
} from "@/app/[language]/[location]/hooks/hookApp";

export const useAppView = () => {
	//  ================================================================
	//      Header
	//  ================================================================

	const {
		states: { activeMenu, isSidebarOpen, menuDirection },
		actions: {
			setSidebarOpen,
			setActiveMenu,
			handleMenuToggle,
			triggerChatReset,
		},
	} = useHeader();

	//  ================================================================
	//      Sidebar
	//  ================================================================

	const {
		states: {
			activeNotificationTab,
			theme,
			app,
			chat,
			language,
			location,
			chatNotifications,
		},
		actions: {
			router,
			pathname,
			handleSidebarLinkClick,
			setActiveNotificationTab,
			handleThemeChange,
			handleLanguageChange,
			handleLocationChange,
			isPathActive,
			markChatNotificationAsRead,
		},
	} = useSidebar();

	return {
		states: {
			activeMenu,
			isSidebarOpen,
			menuDirection,
			activeNotificationTab,
			theme,
			app,
			chat,
			language,
			location,
			chatNotifications,
		},
		actions: {
			setSidebarOpen,
			setActiveMenu,
			handleMenuToggle,
			triggerChatReset,
			router,
			pathname,
			handleSidebarLinkClick,
			setActiveNotificationTab,
			handleThemeChange,
			handleLanguageChange,
			handleLocationChange,
			isPathActive,
			markChatNotificationAsRead,
		},
	};
};
