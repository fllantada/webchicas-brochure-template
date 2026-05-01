"use client";

import type { Locale } from "@/i18n/locales";
import type { LocalizedText } from "@/server/datasources/contact/domain/IContact";

interface Props {
  /** Etiqueta visible (ej "Calle"). */
  label: string;
  /** Valor actual del campo bilingüe. */
  value: LocalizedText;
  /** Setter — recibe el objeto completo actualizado. */
  onChange: (next: LocalizedText) => void;
  /** Placeholder por idioma (opcional). */
  placeholder?: Partial<Record<Locale, string>>;
  /** Si `true`, renderiza textarea (multi-línea) en vez de input. */
  multiline?: boolean;
  /** Hint debajo del label. Ayuda contextual breve. */
  hint?: string;
}

/**
 * Renderiza un campo bilingüe ES/EN como dos inputs lado a lado.
 * Patrón consistente para todos los campos traducibles del admin.
 */
export function BilingualInput({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  hint,
}: Props) {
  const Tag = multiline ? "textarea" : "input";
  const baseClass =
    "w-full rounded-md border border-border bg-bg px-3 py-2.5 text-base text-ink placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <label className="text-xs uppercase tracking-widest text-muted">
          {label}
        </label>
        {hint && <span className="text-xs text-subtle">— {hint}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-subtle mb-1">
            Español
          </span>
          <Tag
            value={value.es}
            onChange={(e) => onChange({ ...value, es: e.target.value })}
            placeholder={placeholder?.es}
            rows={multiline ? 2 : undefined}
            className={baseClass}
          />
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-subtle mb-1">
            English
          </span>
          <Tag
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            placeholder={placeholder?.en}
            rows={multiline ? 2 : undefined}
            className={baseClass}
          />
        </div>
      </div>
    </div>
  );
}
