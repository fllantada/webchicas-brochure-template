import { routing } from "./routing";

/** Idiomas soportados por el sitio. Single source of truth. */
export const LOCALES = routing.locales;
export type Locale = (typeof LOCALES)[number];

/** Locale por default cuando no hay match. */
export const DEFAULT_LOCALE = routing.defaultLocale;

/**
 * Devuelve el valor de un campo bilingüe en el locale pedido. Si está vacío,
 * cae al default. Útil para renderizar campos `LocalizedText` sin tener que
 * repetir el fallback en cada componente.
 */
export function pickLocale<T extends Record<Locale, string>>(
  field: T,
  locale: string,
): string {
  const safe = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
  return field[safe] || field[DEFAULT_LOCALE] || "";
}
