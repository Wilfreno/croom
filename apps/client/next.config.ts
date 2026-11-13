import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH=/croom at build time to serve the app under
// /croom; unset, it serves from the root as in development.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
  async redirects() {
    if (!basePath) return [];
    return [
      {
        // The bare domain root would 404 once everything lives under the
        // base path, so send it there. basePath: false matches the real "/".
        source: "/",
        destination: basePath,
        basePath: false,
        permanent: false,
      },
    ];
  },
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
