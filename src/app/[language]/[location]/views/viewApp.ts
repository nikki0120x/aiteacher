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
		actions: { setSidebarOpen, setActiveMenu, handleMenuToggle },
	} = useHeader();

	//  ================================================================
	//      Sidebar
	//  ================================================================

	const {
		states: { activeNotificationTab, theme, app, language, location },
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
			language,
			location,
		},
		actions: {
			setSidebarOpen,
			setActiveMenu,
			handleMenuToggle,
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
