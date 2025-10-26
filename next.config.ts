import type { NextConfig } from "next";

// 💡 環境変数 TAURI_BUILD_MODE が設定されているかチェック
const isTauriBuild = process.env.TAURI_BUILD_MODE === 'true';

// --- Tauriビルド専用の設定 ---
const tauriConfig: NextConfig = {
  // 必須: 静的エクスポートを有効にする
  output: "export",
  
  // 必須: サーバー依存の画像最適化機能を無効化
  images: {
    unoptimized: true,
  },

  // Webpack設定は両方で共通またはTauriビルドで必要なものを定義
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  
  // ⚠️ Tauriビルド時には、その他の設定は適用されない（または空にする）
  turbopack: {},
  experimental: {},
  env: {},
};

// --- Webアプリビルド専用の設定 (ユーザーの既存設定を反映) ---
const webConfig: NextConfig = {
  // サーバー機能を利用するため 'export' は設定しない (または 'standalone' など)
  // images設定はそのまま
  // ...

  // 既存設定
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


// 💡 最終的なエクスポート: 環境変数に応じて設定を切り替える
const finalConfig: NextConfig = isTauriBuild ? tauriConfig : webConfig;

export default finalConfig;
