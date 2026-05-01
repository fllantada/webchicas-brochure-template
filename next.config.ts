import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      // Por default 1MB; subimos para soportar fotos reales (móvil, RAW).
      bodySizeLimit: "25mb",
    },
  },
};

export default withNextIntl(nextConfig);
