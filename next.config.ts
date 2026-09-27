import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [
        "89.168.121.252.sslip.io",
        "*.89.168.121.252.sslip.io",
        "logobook.sk",
        "*.logobook.sk",
        "localhost:3000",
      ],
    },
  },
  async redirects() {
    return [
      { source: "/auth/login", destination: "/login", permanent: true },
      { source: "/auth/register", destination: "/register", permanent: true },
      { source: "/auth/reset-password", destination: "/reset-password", permanent: true },
    ];
  },
};

export default nextConfig;
