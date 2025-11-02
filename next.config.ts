import type { NextConfig } from "next";

// 共通設定（必ず output: "export" を入れる）
const baseConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true, // /_next/image 404を回避
  },
};

// 環境変数 TAURI_BUILD_MODE が設定されているかチェック
const isTauriBuild = process.env.TAURI_BUILD_MODE === "true";

// --- Tauriビルド専用の設定 ---
const tauriConfig: NextConfig = {
  ...baseConfig,
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
  turbopack: {},
  experimental: {},
};

// --- Webアプリビルド専用の設定 ---
const webConfig: NextConfig = {
  ...baseConfig,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  env: {
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
};

// 💡 最終的に環境に応じて切り替え
const finalConfig: NextConfig = isTauriBuild ? tauriConfig : webConfig;

export default finalConfig;
