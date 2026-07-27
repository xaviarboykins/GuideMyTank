import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: isProduction ? "tsconfig.build.json" : "tsconfig.json",
  },
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
