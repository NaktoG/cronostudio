import type { NextConfig } from "next";

const imageHosts = process.env.NEXT_PUBLIC_IMAGE_HOSTS
  ? process.env.NEXT_PUBLIC_IMAGE_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
  : [];

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(imageHosts.length
    ? {
        images: {
          remotePatterns: imageHosts.map((hostname) => ({
            protocol: 'https',
            hostname,
          })),
        },
      }
    : {}),
};

export default nextConfig;
