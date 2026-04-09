import type { NextConfig } from "next";
// @ts-expect-error next-pwa has no types
import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lvwolzigguuuswwxjnvg.supabase.co",
      },
    ],
  },
};

export default pwaConfig(nextConfig);
