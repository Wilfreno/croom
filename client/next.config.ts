import type { NextConfig } from "next";

const server_url = process.env.NEXT_PUBLIC_SERVER!;
if (!server_url) throw new Error("NEXT_PUBLIC_SERVER is missing from your .env.local file");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: server_url + "/:path*",
      },
    ];
  },
  //   async headers() {
  //     return [
  //       {
  //         source:  ,
  //         headers: [
  //           {
  //             key: "Access-Control-Allow-Origin",
  //             value: "*",
  //           },
  //         ],
  //       },
  //     ];
  //   },
};

export default nextConfig;
