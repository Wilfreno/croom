/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/@me",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
