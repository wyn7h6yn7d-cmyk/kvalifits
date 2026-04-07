import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Ensures Next picks this repo root even if other lockfiles exist.
    root: __dirname,
  },
};

export default nextConfig;
