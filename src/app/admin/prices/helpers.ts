import type { Locale } from "@/i18n/locales";
import type { LocalizedText } from "@/server/datasources/contact/domain/IContact";

/**
 * Formatea un importe numérico al formato del sitio (ej. 70 → "70,00€").
 * Usado tanto en admin como en el sitio público para garantizar consistencia.
 */
export function formatEuro(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + "€";
}

interface FormatPriceInput {
  /** Importe numérico (null = solo se muestra override). */
  price: number | null;
  /** Si `true`, prefija "Desde " al importe. */
  isFromPrice?: boolean;
  /** Texto que reemplaza al importe ("Según zona", "Consultar"). */
  priceOverride?: LocalizedText;
  /** Locale activo (es | en) para resolver el override y el prefijo. */
  locale: Locale;
}

/**
 * Devuelve el string final a renderizar para un precio. Reglas:
 *   1. Si `priceOverride[locale]` no vacío, manda el override.
 *   2. Si price es null, devuelve "—".
 *   3. Si isFromPrice, prefija "Desde " (es) / "From " (en).
 *   4. Caso normal: importe formateado en EUR.
 */
export function formatPriceForLocale({
  price,
  isFromPrice,
  priceOverride,
  locale,
}: FormatPriceInput): string {
  const override = priceOverride?.[locale]?.trim();
  if (override) return override;

  if (price === null) return "—";

  const formatted = formatEuro(price);
  if (isFromPrice) {
    return locale === "en" ? `From ${formatted}` : `Desde ${formatted}`;
  }
  return formatted;
}
