import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Docker image — generates .next/standalone + server.js
  output: "standalone",
  // API proxy is handled by src/app/api/[...path]/route.ts so that
  // BACKEND_URL is read at request time (runtime), not baked at build time.
};

export default nextConfig;
