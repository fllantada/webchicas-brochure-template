import type { ObjectId } from "mongodb";

import type { LocalizedText } from "@/server/datasources/contact/domain/IContact";

/**
 * Categorías que agrupan tratamientos en la página de tarifas. Estables
 * para mantener URLs (`/servicios/{cat}`) y orden visual coherente.
 */
export const PRICE_CATEGORIES = [
  "facial",
  "corporal",
  "masaje",
  "manos-pies",
  "depilacion",
  "maquillaje",
  "bronceado",
  "otro",
] as const;
export type PriceCategory = (typeof PRICE_CATEGORIES)[number];

/** Item del listado de precios. Se renderiza en /tarifas y en cada /servicios/X. */
export interface IPrice {
  _id?: ObjectId;
  /** Categoría que agrupa el item en la UI. */
  category: PriceCategory;
  /** Nombre del tratamiento, bilingüe. */
  title: LocalizedText;
  /** Descripción opcional debajo del título, bilingüe. Vacío = no se muestra. */
  description?: LocalizedText;
  /** Importe numérico en EUR (sin símbolo). null = se muestra "—" (sin precio). */
  price: number | null;
  /**
   * Si `true`, el precio se muestra como "Desde X€" (ej. tratamientos con
   * precio variable según pieza/sesión). Default false → "X,XX€" exacto.
   */
  isFromPrice: boolean;
  /**
   * Texto override que reemplaza al precio numérico cuando hace falta. Ej:
   * "Bono 6 sesiones" o "Consultar". Bilingüe. Vacío = se usa price normal.
   */
  priceOverride?: LocalizedText;
  /** Duración en minutos. 0 o ausente = no se muestra. */
  durationMinutes?: number;
  /** Posición dentro de su categoría (asc). Define el orden en la UI. */
  order: number;
  /** Si `false`, no aparece en el sitio público. Visible siempre en admin. */
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Etiquetas legibles de cada categoría, bilingües, para mostrar en admin/sitio. */
export const PRICE_CATEGORY_LABELS: Record<PriceCategory, LocalizedText> = {
  facial: { es: "Facial", en: "Facial" },
  corporal: { es: "Corporal", en: "Body" },
  masaje: { es: "Masajes", en: "Massages" },
  "manos-pies": { es: "Manos y Pies", en: "Hands & Feet" },
  depilacion: { es: "Depilación", en: "Hair Removal" },
  maquillaje: { es: "Maquillaje", en: "Makeup" },
  bronceado: { es: "Bronceado", en: "Tanning" },
  otro: { es: "Otros", en: "Other" },
};
