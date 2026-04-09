import type { NextConfig } from "next";

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

export default nextConfig;
