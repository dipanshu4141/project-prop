import type { NextConfig } from "next";

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

export default nextConfig;
