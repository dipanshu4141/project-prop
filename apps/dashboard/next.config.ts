import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 🔁 Forward API requests to NestJS
        source: "/properties/:path*",
        destination: "http://localhost:3000/properties/:path*",
      },
    ];
  },
};

export default withPWA(nextConfig);