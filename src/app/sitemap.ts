import type { MetadataRoute } from "next";

/**
 * Sitemap dinámico — usa NEXT_PUBLIC_FRONTEND_URL como base.
 * Cuando el cliente agregue páginas de servicios/galería/etc, sumarlas acá.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE_URL}/contacto`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE_URL}/rgpd`, lastModified: new Date(), priority: 0.2 },
    { url: `${BASE_URL}/cookies`, lastModified: new Date(), priority: 0.2 },
  ];
}
