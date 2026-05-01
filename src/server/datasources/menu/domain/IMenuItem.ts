import type { ObjectId } from "mongodb";

import type { LocalizedText } from "@/server/datasources/contact/domain/IContact";

/**
 * Categorías genéricas para menú gastronómico (restaurante / bar / café).
 *
 * Por qué hardcodeadas y no editables: el cliente cambia platos, no
 * categorías — y mantenerlas estables permite que la UI tenga orden visual
 * coherente y i18n confiable. Si un cliente necesita una categoría distinta
 * (ej. "tapas frías"), agregar acá y al label map de abajo.
 */
export const MENU_CATEGORIES = [
  "tapas",
  "ensaladas",
  "entrantes",
  "pescados",
  "carnes",
  "pastas",
  "arroces",
  "postres",
  "bebidas-cerveza",
  "bebidas-vino",
  "bebidas-cocteles",
  "bebidas-refrescos",
  "bebidas-cafe",
  "menu-ninos",
  "menu-degustacion",
  "otro",
] as const;
export type MenuCategory = (typeof MENU_CATEGORIES)[number];

/**
 * Plato/bebida del menú gastronómico. Se renderiza en `/carta` agrupado por
 * `category`, ordenado por `order` ascendente dentro de cada categoría.
 *
 * Diseño separado de IPrice (lista de precios) porque:
 * - Categorías son distintas (gastronomía vs estética/servicios)
 * - Un plato puede no tener precio (degustación variable, "consultar")
 * - El priceNote textual ("por persona", "(2 pers.)") es específico de gastronomía
 * - Algunos clientes querrán foto por plato (futuro: campo imageKey opcional)
 */
export interface IMenuItem {
  _id?: ObjectId;
  /** Categoría que agrupa el item en la UI. */
  category: MenuCategory;
  /** Nombre del plato/bebida, bilingüe. Ej: "Patatas bravas", "Tortilla española". */
  title: LocalizedText;
  /**
   * Descripción opcional debajo del título, bilingüe. Ingredientes,
   * preparación, alergenos. Vacío = no se muestra.
   * Ej: "(jamón, espinacas y/o sepia)", "Brasa, horno y sabor de toda la vida".
   */
  description?: LocalizedText;
  /**
   * Importe numérico en EUR (sin símbolo). null = se muestra "—" (sin precio
   * fijo, ej. "consultar precio del día").
   */
  price: number | null;
  /**
   * Texto que acompaña al precio (no lo reemplaza). Bilingüe.
   * Ej: "por persona", "(2 personas)", "(mín. 2 pers.)". Vacío = sin nota.
   */
  priceNote?: LocalizedText;
  /**
   * Texto override que reemplaza completamente al precio numérico cuando hace
   * falta. Bilingüe. Ej: "Consultar", "Mercado". Vacío = se usa price normal.
   */
  priceOverride?: LocalizedText;
  /**
   * Key opcional de imagen del plato (foto del admin/media). Vacío = sin foto,
   * solo texto. Útil cuando el cliente quiere mostrar fotos de platos estrella.
   */
  imageKey?: string;
  /**
   * Tags opcionales para filtros visuales: "vegetariano", "sin-gluten",
   * "picante", "del-dia". Bilingüe NO aplicable (son keywords técnicos).
   */
  tags?: string[];
  /** Posición dentro de su categoría (asc). Define el orden en la UI. */
  order: number;
  /**
   * Si `false`, no aparece en el sitio público. Visible siempre en admin.
   * Útil para platos de temporada que se desactivan en lugar de borrar.
   */
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Etiquetas legibles de cada categoría, bilingües, para mostrar en admin/sitio. */
export const MENU_CATEGORY_LABELS: Record<MenuCategory, LocalizedText> = {
  tapas: { es: "Tapas", en: "Tapas" },
  ensaladas: { es: "Ensaladas", en: "Salads" },
  entrantes: { es: "Entrantes", en: "Starters" },
  pescados: { es: "Pescados y mariscos", en: "Seafood" },
  carnes: { es: "Carnes", en: "Meat" },
  pastas: { es: "Pastas", en: "Pasta" },
  arroces: { es: "Arroces y paellas", en: "Rice & Paella" },
  postres: { es: "Postres", en: "Desserts" },
  "bebidas-cerveza": { es: "Cervezas", en: "Beers" },
  "bebidas-vino": { es: "Vinos", en: "Wines" },
  "bebidas-cocteles": { es: "Cócteles", en: "Cocktails" },
  "bebidas-refrescos": { es: "Refrescos y aguas", en: "Soft drinks & water" },
  "bebidas-cafe": { es: "Café e infusiones", en: "Coffee & Tea" },
  "menu-ninos": { es: "Menú niños", en: "Kids menu" },
  "menu-degustacion": { es: "Menús degustación", en: "Tasting menus" },
  otro: { es: "Otros", en: "Other" },
};
