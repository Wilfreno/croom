import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH=/croom at build time to serve the app under
// /croom; unset, it serves from the root as in development.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
  typescript: {
    // Production builds skip the vitest suite; `check-types` still covers it.
    tsconfigPath: "./tsconfig.build.json",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
