import type { ObjectId } from "mongodb";

export type ImageVariantKey = "thumb" | "card" | "hero" | "og";
export type ImageFormat = "webp" | "jpg";
export type MediaCategory =
  | "hero"
  | "service"
  | "gallery"
  | "about"
  | "og"
  | "other";

/**
 * Nivel de calidad para procesamiento.
 * - `standard` (default): web optimized, balance peso/calidad. Para listas, cards, gallery.
 * - `high`: para imágenes destacadas (hero, fotos de marca). 2.5× peso.
 * - `max`: máxima calidad. Solo para fotos premium donde el detalle importa. 5× peso.
 */
export type ImageQuality = "standard" | "high" | "max";

/** Imagen editable del sitio. Variantes pre-procesadas en Vercel Blob. */
export interface IMedia {
  _id?: ObjectId;
  /** Slug técnico estable (ej: "hero-main"). Identifica el slot en el código. */
  key: string;
  /** Nombre amigable que ve el cliente final en el admin (ej: "Foto principal"). */
  label: string;
  /** Texto alt bilingüe — accesibilidad + SEO. */
  alt: { es: string; en: string };
  /** Categoría para filtrar/agrupar en el admin. */
  category: MediaCategory;
  /** Nivel de calidad usado al procesar. Default: "standard". */
  quality: ImageQuality;
  /** URLs de las 8 variantes (4 widths × 2 formats) en Vercel Blob. */
  variants: Record<ImageFormat, Record<ImageVariantKey, string>>;
  /** Dimensiones originales (para aspect ratio en next/image). */
  width: number;
  height: number;
  /** Ej: "1600/900". */
  aspectRatio: string;
  /** Base64 10×10 para `placeholder="blur"`. Cero CLS. */
  blurDataURL?: string;
  /** Paths donde aparece (auditoría: "no borrar si está en uso"). */
  usedIn: string[];
  uploadedAt: Date;
  updatedAt: Date;
}
