import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";
import {
	APP_LANGUAGE_MAP,
	APP_LOCATION_MAP,
	type AppLanguage,
	AppLanguageSchema,
	type AppLocation,
	AppLocationSchema,
} from "@/models/modelApp";

export const LOCATIONS = Object.keys(APP_LOCATION_MAP) as AppLocation[];
export const DEFAULT_LOCATION: AppLocation =
	AppLocationSchema.createDefault() as AppLocation;
export const LOCATION_REGEX = new RegExp(`^/(${LOCATIONS.join("|")})`);
const locales = Object.keys(APP_LANGUAGE_MAP) as AppLanguage[];

export const routing = defineRouting({
	locales: locales,
	defaultLocale: AppLanguageSchema.createDefault() as AppLanguage,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
	createNavigation(routing);
