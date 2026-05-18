import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No rewrites needed — browser goes direct to Railway
  // Server components use BACKEND_URL directly
};
export default nextConfig;


// const nextConfig: NextConfig = {
//   async rewrites() {
//     return [
//       {
//         source: "/api/:path*",
//         destination: `${process.env.BACKEND_URL}/api/:path*`,
//       },
//     ];
//   },
// };

// export default nextConfig;

