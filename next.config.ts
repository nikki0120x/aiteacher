import type { NextConfig } from "next";

const isTauriBuild = process.env.TAURI_BUILD_MODE === "true";

// --- 共通設定 ---
const baseConfig: NextConfig = {
  images: {
    unoptimized: true, // /_next/image の404回避
  },
};

// --- Tauriビルド専用 ---
const tauriConfig: NextConfig = {
  ...baseConfig,
  output: "export", // ← ここ重要！
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

// --- Webビルド専用 ---
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
      bodySizeLimit: "4mb",
    },
  },
  env: {
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
};

// --- 最終設定 ---
const finalConfig: NextConfig = {
  ...(isTauriBuild ? tauriConfig : webConfig),
  turbopack: {}, // ← これを追加
};
export default finalConfig;
