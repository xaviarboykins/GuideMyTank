import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, noarchive" }],
      },
      {
        source: "/care-guides/:slug/pdf",
        headers: [{ key: "X-Robots-Tag", value: "noindex, noarchive" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "guidemytank.com" }],
        destination: "https://www.guidemytank.com/:path*",
        permanent: true,
      },
      {
        source: "/piscidex/:slug",
        destination: "/species/:slug",
        permanent: true,
      },
      {
        source: "/stocking",
        destination: "/aquarium-builder",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
