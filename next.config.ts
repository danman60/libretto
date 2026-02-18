import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn1.suno.ai',
      },
      {
        protocol: 'https',
        hostname: 'cdn2.suno.ai',
      },
      {
        protocol: 'https',
        hostname: '*.suno.ai',
      },
    ],
  },
};

export default nextConfig;
