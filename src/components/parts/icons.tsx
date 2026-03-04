import DarkThemeLarge from "@/assets/icons/dark-theme-large.svg";
import DarkThemeSmall from "@/assets/icons/dark-theme-small.svg";
import LightThemeLarge from "@/assets/icons/light-theme-large.svg";
import LightThemeSmall from "@/assets/icons/light-theme-small.svg";
import SystemThemeLarge from "@/assets/icons/system-theme-large.svg";
import SystemThemeSmall from "@/assets/icons/system-theme-small.svg";

export const Icons = {
	SystemThemeLarge: (props: React.SVGProps<SVGSVGElement>) => (
		<SystemThemeLarge {...props} />
	),
	LightThemeLarge: (props: React.SVGProps<SVGSVGElement>) => (
		<LightThemeLarge {...props} />
	),
	DarkThemeLarge: (props: React.SVGProps<SVGSVGElement>) => (
		<DarkThemeLarge {...props} />
	),
	SystemThemeSmall: (props: React.SVGProps<SVGSVGElement>) => (
		<SystemThemeSmall {...props} />
	),
	LightThemeSmall: (props: React.SVGProps<SVGSVGElement>) => (
		<LightThemeSmall {...props} />
	),
	DarkThemeSmall: (props: React.SVGProps<SVGSVGElement>) => (
		<DarkThemeSmall {...props} />
	),
} as const;

export type Icons = keyof typeof Icons;
