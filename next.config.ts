import type { NextConfig } from "next";

// 環境変数 TAURI_BUILD_MODE が設定されているかチェック
const isTauriBuild = process.env.TAURI_BUILD_MODE === "true";

// --- Tauriビルド専用の設定 ---
const tauriConfig: NextConfig = {
  output: "export", // 静的HTMLエクスポート
  images: {
    unoptimized: true, // サーバー依存の画像最適化を無効化
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  // ⚠️ ここでTauri用の環境変数を指定
  env: {
    NEXT_PUBLIC_GEMINI_API_URL: process.env.NEXT_PUBLIC_GEMINI_API_URL || "https://www.focalrina.com/api/gemini",
  },
  turbopack: {},
  experimental: {},
};

// --- Webアプリビルド専用の設定 ---
const webConfig: NextConfig = {
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
