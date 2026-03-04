import { geolocation } from "@vercel/functions";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { DEFAULT_LOCATION, LOCATIONS, routing } from "@/i18n/routing";
import type { AppLocation } from "@/models/modelApp";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	let location = req.cookies.get("location")?.value as AppLocation | undefined;
	let shouldUpdateCookie = false;

	if (!location) {
		const { country } = geolocation(req);
		location =
			country && (LOCATIONS as string[]).includes(country)
				? (country as AppLocation)
				: DEFAULT_LOCATION;
		shouldUpdateCookie = true;
	}

	const segments = pathname.split("/").filter(Boolean);
	const languages = routing.locales as readonly string[];
	const languageFromUrl = segments[0];
	const locationFromUrl = segments[1] as AppLocation | undefined;

	const isValidLocationInUrl =
		locationFromUrl && (LOCATIONS as string[]).includes(locationFromUrl);

	if (isValidLocationInUrl) {
		if (location !== locationFromUrl) {
			location = locationFromUrl;
			shouldUpdateCookie = true;
		}
	}

	const response = intlMiddleware(req);
	const redirectLocation = response.headers.get("Location");

	let finalRes: NextResponse = response;

	if (redirectLocation) {
		const url = new URL(redirectLocation, req.url);
		const nextSegments = url.pathname.split("/").filter(Boolean);
		const nextLang = nextSegments[0];

		if (
			languages.includes(nextLang) &&
			!(LOCATIONS as readonly string[]).includes(nextSegments[1])
		) {
			const remainingPath = url.pathname.replace(`/${nextLang}`, "");
			const redirectUrl = req.nextUrl.clone();

			redirectUrl.pathname = `/${nextLang}/${location}${remainingPath}`;
			finalRes = NextResponse.redirect(redirectUrl);
		}
	} else if (languages.includes(languageFromUrl) && !isValidLocationInUrl) {
		const remainingPath = pathname.replace(`/${languageFromUrl}`, "");
		const redirectUrl = req.nextUrl.clone();

		redirectUrl.pathname = `/${languageFromUrl}/${location}${remainingPath}`;
		finalRes = NextResponse.redirect(redirectUrl);
	}

	if (shouldUpdateCookie && location) {
		finalRes.cookies.set("location", location, {
			maxAge: 60 * 60 * 24 * 365,
			path: "/",
		});
	}

	return finalRes;
}

export const config = {
	matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
