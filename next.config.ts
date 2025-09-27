import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // Webpack で SVG を React コンポーネントとして扱う
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
};

export default nextConfig;