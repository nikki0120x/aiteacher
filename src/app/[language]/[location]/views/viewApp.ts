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
		states: { activeNotificationTab, theme, app, chat, language, location },
		actions: {
			router,
			pathname,
			handleSidebarLinkClick,
			setActiveNotificationTab,
			handleThemeChange,
			handleLanguageChange,
			handleLocationChange,
			isPathActive,
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
		},
	};
};
