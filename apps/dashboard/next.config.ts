import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest:        "public",
  register:    true,
  skipWaiting: true,
  disable:     process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ];
  },

  webpack: (config) => {
    // Reduce file watching scope — prevents Turbopack from
    // watching node_modules and other large directories that
    // never change, which was causing constant CPU activity
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.next/**',
        '**/public/**',
      ],
    };
    return config;
  },
};

export default withPWA(nextConfig);