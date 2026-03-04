import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const withPWA = withPWAInit({
	dest: "public",
	disable: process.env.NODE_ENV === "development",

	register: true,
	sw: "sw.js",

	cacheOnFrontEndNav: true,
	aggressiveFrontEndNavCaching: true,
	reloadOnOnline: true,

	workboxOptions: {
		skipWaiting: true,
		clientsClaim: true,
	},
});

const nextConfig: NextConfig = {
	output: "standalone",
	experimental: {
		serverActions: {
			bodySizeLimit: "4.5mb",
		},
	},
	env: {
		GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
	},
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
	},
};

export default process.env.NODE_ENV === "development"
	? withNextIntl(nextConfig)
	: withPWA(withNextIntl(nextConfig));
