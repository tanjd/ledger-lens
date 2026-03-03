import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Docker image — generates .next/standalone + server.js
  output: "standalone",

  // Proxy all /api/* requests to the FastAPI backend.
  // BACKEND_URL is read at server startup (runtime env var, not baked at build time).
  // Default targets the Docker Compose service name; override for local dev via .env.local.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
