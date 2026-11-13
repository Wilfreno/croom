import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
