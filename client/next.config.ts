import type { NextConfig } from "next";

<<<<<<< HEAD
const server_url = process.env.NEXT_PUBLIC_SERVER!;
if (!server_url) throw new Error("NEXT_PUBLIC_SERVER is missing from your .env.local file");

=======
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
<<<<<<< HEAD
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
=======
  } /* config options here */,
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
};

export default nextConfig;
