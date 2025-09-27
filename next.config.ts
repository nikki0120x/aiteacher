import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // SVG を React コンポーネントとして扱えるようにする
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

export default nextConfig;