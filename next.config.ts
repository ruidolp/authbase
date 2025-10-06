import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // para avatares de Google
      },
      {
        protocol: "https",
        hostname: "img.youtube.com", // ✅ para miniaturas de YouTube
      },
    ],
  },
};

export default nextConfig;
