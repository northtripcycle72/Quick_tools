import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ['canvas'],
  turbopack: {},
};

export default nextConfig;
