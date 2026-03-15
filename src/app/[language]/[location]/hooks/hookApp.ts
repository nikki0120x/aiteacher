import { useRouter as useNextRouter, useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import {
	DEFAULT_LOCATION,
	LOCATION_REGEX,
	usePathname,
	useRouter,
} from "@/i18n/routing";
import {
	APP_MENU_MAP,
	type APP_NOTIFICATION_MAP,
	type AppLocation,
} from "@/models/modelApp";
import { useAppStore } from "@/stores/storeApp";

//  ================================================================
//      Header
//  ================================================================

export const useHeader = () => {
	const {
		isSidebarOpen,
		setSidebarOpen,
		activeMenu,
		menuDirection,
		setActiveMenu,
		triggerChatReset,
	} = useAppStore();

	const router = useRouter();
	const MENU_ORDER = useMemo(
		() => Object.keys(APP_MENU_MAP) as (keyof typeof APP_MENU_MAP)[],
		[],
	);

	//  メニュー切替
	const handleMenuToggle = useCallback(
		(menu: keyof typeof APP_MENU_MAP) => {
			if (activeMenu === menu) {
				setActiveMenu(null, 0);

				return;
			}

			let newDirection = 0;

			if (activeMenu && menu) {
				const prevIndex = MENU_ORDER.indexOf(activeMenu);
				const nextIndex = MENU_ORDER.indexOf(menu);

				newDirection = nextIndex > prevIndex ? 1 : -1;
			}

			setActiveMenu(menu, newDirection);
		},
		[activeMenu, setActiveMenu, MENU_ORDER],
	);

	const actions = useMemo(
		() => ({
			router,
			setSidebarOpen,
			setActiveMenu,
			handleMenuToggle,
			triggerChatReset,
		}),
		[router, setSidebarOpen, setActiveMenu, handleMenuToggle, triggerChatReset],
	);

	return {
		states: {
			isSidebarOpen,
			activeMenu,
			menuDirection,
		},
		actions,
	};
};

//  ================================================================
//      Sidebar
//  ================================================================

export const useSidebar = () => {
	const { isSidebarOpen, setSidebarOpen } = useAppStore();

	//	サイドバーリンククリック
	const handleSidebarLinkClick = useCallback(() => {
		if (typeof window !== "undefined" && window.innerWidth < 1024) {
			if (isSidebarOpen) {
				setTimeout(() => {
					setSidebarOpen();
				}, 100);
			}
		}
	}, [isSidebarOpen, setSidebarOpen]);

	const [activeNotificationTab, setActiveNotificationTab] =
		useState<keyof typeof APP_NOTIFICATION_MAP>("all");

	const { theme, setTheme } = useTheme();

	//  テーマ変更
	const handleThemeChange = useCallback(
		(themeId: string) => {
			setTheme(themeId);
		},
		[setTheme],
	);

	const app = useTranslations("app");
	const language = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const nextRouter = useNextRouter();
	const [_isTransition, setTransiton] = useTransition();

	//  言語変更
	const handleLanguageChange = useCallback(
		(languageId: string) => {
			setTransiton(() => {
				router.push(pathname, { locale: languageId });
				nextRouter.refresh();
			});
		},
		[router, pathname, nextRouter],
	);

	const params = useParams();
	const currentLocation = (params?.location as AppLocation) || DEFAULT_LOCATION;
	const [location, setLocation] = useState<AppLocation>(currentLocation);

	//  地域変更
	const handleLocationChange = useCallback(
		(locationId: AppLocation) => {
			setLocation(locationId);
			setTransiton(() => {
				const newPathname = pathname.replace(LOCATION_REGEX, `/${locationId}`);

				router.push(newPathname);
				nextRouter.refresh();
			});
		},
		[pathname, router, nextRouter],
	);

	useEffect(() => {
		if (params?.location) {
			setLocation(params.location as AppLocation);
		}
	}, [params?.location]);

	const isPathActive = useCallback(
		(path: string) => {
			const regex = new RegExp(`/${path.replace(/^\//, "")}(/|$)`);

			return regex.test(pathname);
		},
		[pathname],
	);

	const actions = useMemo(
		() => ({
			router,
			pathname,
			handleSidebarLinkClick,
			setActiveNotificationTab,
			handleThemeChange,
			handleLanguageChange,
			handleLocationChange,
			isPathActive,
		}),
		[
			handleSidebarLinkClick,
			setActiveNotificationTab,
			handleThemeChange,
			handleLanguageChange,
			handleLocationChange,
			isPathActive,
		],
	);

	return {
		states: {
			activeNotificationTab,
			theme,
			app,
			language,
			location,
		},
		actions,
	};
};
