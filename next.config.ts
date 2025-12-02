import type { NextConfig } from "next";

const isTauriBuild = process.env.TAURI_BUILD_MODE === "true";

const baseConfig: NextConfig = {
	images: {
		unoptimized: true,
	},
};

const tauriConfig: NextConfig = {
	...baseConfig,
	output: "export",
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

const finalConfig: NextConfig = {
	...(isTauriBuild ? tauriConfig : webConfig),
	turbopack: {},
};
export default finalConfig;
