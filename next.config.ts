import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // A stray package-lock.json in the home directory makes Next.js infer the
    // wrong workspace root — pin it to this project explicitly.
    root: __dirname,
  },
};

export default nextConfig;
