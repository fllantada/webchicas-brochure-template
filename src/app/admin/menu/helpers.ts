import type { Locale } from "@/i18n/locales";
import type { LocalizedText } from "@/server/datasources/contact/domain/IContact";

/**
 * Formatea un importe numérico al formato del sitio (ej. 12 → "12,00€").
 * Reusable entre admin y `/carta` para garantizar consistencia.
 */
export function formatEuro(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + "€";
}

interface FormatMenuPriceInput {
  /** Importe numérico (null = solo se muestra override o "—"). */
  price: number | null;
  /** Texto que reemplaza al importe ("Mercado", "Consultar"). */
  priceOverride?: LocalizedText;
  /** Locale activo (es | en) para resolver el override. */
  locale: Locale;
}

/**
 * Devuelve el string final del precio de un item de menú. Reglas:
 *   1. Si `priceOverride[locale]` no vacío, manda el override.
 *   2. Si price es null, devuelve "—".
 *   3. Caso normal: importe formateado en EUR.
 *
 * El priceNote ("por persona", "(2 pers.)") NO se incluye acá — se renderiza
 * aparte como sufijo del precio para que la UI lo muestre con estilo distinto.
 */
export function formatMenuPriceForLocale({
  price,
  priceOverride,
  locale,
}: FormatMenuPriceInput): string {
  const override = priceOverride?.[locale]?.trim();
  if (override) return override;
  if (price === null) return "—";
  return formatEuro(price);
}
