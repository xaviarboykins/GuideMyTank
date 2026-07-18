import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/stocking",
        destination: "/aquarium-builder",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
