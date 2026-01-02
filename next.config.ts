import type { NextConfig } from "next";

const baseConfig: NextConfig = {
	images: { unoptimized: true },
	trailingSlash: true,
};

// ================================================================
//     Web (Vercel / Docker)
// ================================================================

const webConfig: NextConfig = {
	...baseConfig,
	output: "standalone",
	webpack(config) {
		config.module.rules.push({
			test: /\.svg$/,
			use: ["@svgr/webpack"],
		});
		return config;
	},
	experimental: {
		serverActions: {
			bodySizeLimit: "4.5mb",
		},
	},
	env: {
		GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
	},
};

// ================================================================
//     Tauri (Desktop App)
// ================================================================

const tauriConfig: NextConfig = {
	...baseConfig,
	output: "export",
	typescript: { ignoreBuildErrors: true },

	webpack(config) {
		config.module.rules.push({
			test: /\.svg$/,
			use: ["@svgr/webpack"],
		});
		return config;
	},
	env: {
		NEXT_PUBLIC_GEMINI_API_URL:
			process.env.NEXT_PUBLIC_GEMINI_API_URL ||
			"https://www.focalrina.com/api/gemini",
	},
};

const isTauriBuild = process.env.TAURI_BUILD_MODE === "true";

const finalConfig: NextConfig = {
	...(isTauriBuild ? tauriConfig : webConfig),
	...(isTauriBuild ? {
		bundlePagesRouterDependencies: false,
	} : {}),
	turbopack: {},
};

export default finalConfig;