import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Ensure JSZip is properly bundled
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, // JSZip might try to use fs in browser
        path: false,
        stream: false,
      };
    }
    return config;
  },
};

export default nextConfig;
