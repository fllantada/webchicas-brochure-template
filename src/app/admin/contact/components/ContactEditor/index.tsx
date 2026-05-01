"use client";

import { useMemo, useState } from "react";

import type { IContact } from "@/server/datasources/contact/domain/IContact";

import { updateContactAction } from "../../actions";

import { BilingualInput } from "./components/BilingualInput";
import { ScheduleSection } from "./components/ScheduleSection";

interface Props {
  /** Estado inicial — viene del SC, ya plano (sin ObjectId ni Date). */
  initial: Omit<IContact, "_id" | "key" | "updatedAt">;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const inputClass =
  "w-full rounded-md border border-border bg-bg px-3 py-2.5 text-base text-ink placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

/**
 * Formulario completo de datos de contacto. Maneja todo el state localmente
 * y envía el payload limpio a la server action al guardar. Save sólo se
 * habilita si hay cambios (isDirty) — evita guardar por accidente y deja
 * claro al cliente cuándo aplicar el cambio.
 */
export function ContactEditor({ initial }: Props) {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const initialJson = useMemo(() => JSON.stringify(initial), [initial]);
  const isDirty = useMemo(
    () => JSON.stringify(data) !== initialJson,
    [data, initialJson],
  );

  async function onSave() {
    setStatus("saving");
    setError(null);

    const response = await updateContactAction(data);

    if (!response.success) {
      setError(response.error ?? "Error guardando");
      setStatus("error");
      return;
    }
    setStatus("saved");
    // El estado actual queda como el "nuevo initial" implícitamente al
    // recargar la página (el server revalidó); evitamos hacer reload aquí
    // para no perder scroll position.
  }

  function onDiscard() {
    setData(initial);
    setStatus("idle");
    setError(null);
  }

  return (
    <div className="space-y-10">
      {/* Sticky save bar */}
      <div className="sticky top-0 md:top-2 z-20 -mx-6 md:mx-0 px-6 md:px-4 py-3 bg-bg/95 backdrop-blur-sm border-b border-border md:rounded-xl md:border md:bg-surface/90 md:shadow-sm flex items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-muted hidden sm:inline">
          Estado:
        </span>
        <span
          className={`text-xs ${
            status === "saved"
              ? "text-emerald-700"
              : status === "error"
                ? "text-red-600"
                : isDirty
                  ? "text-amber-700"
                  : "text-muted"
          }`}
        >
          {status === "saving"
            ? "Guardando…"
            : status === "saved" && !isDirty
              ? "Guardado"
              : status === "error"
                ? `Error: ${error}`
                : isDirty
                  ? "Cambios sin guardar"
                  : "Sin cambios"}
        </span>
        <div className="flex-1" />
        {isDirty && (
          <button
            type="button"
            onClick={onDiscard}
            disabled={status === "saving"}
            className="text-sm text-muted hover:text-accent disabled:opacity-50"
          >
            Descartar
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || status === "saving"}
          className="inline-flex items-center gap-2 rounded-md bg-accent text-white text-sm font-medium px-5 py-2 hover:bg-accent-hover disabled:bg-accent/40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "saving" ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {/* Teléfono / email */}
      <Section title="Teléfono y email" hint="Aparecen en footer, navbar y página de contacto.">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Teléfono" hint="Ej. 971 728 253. Sin prefijo país (España +34).">
            <input
              type="text"
              value={data.phone}
              onChange={(e) => {
                const phone = e.target.value;
                const rawDigits = phone.replace(/[^\d]/g, "");
                // Si ya empieza con prefijo país (34, 1...) mantenemos.
                // Si no, asumimos España y prefijamos "34".
                const phoneRaw = rawDigits.startsWith("34")
                  ? rawDigits
                  : "34" + rawDigits;
                setData({ ...data, phone, phoneRaw });
              }}
              placeholder="971 728 253"
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              placeholder="hola@dominio.com"
              className={inputClass}
            />
          </Field>
          <Field label="WhatsApp" hint="Si es distinto al teléfono. Sin signos, con prefijo país.">
            <input
              type="text"
              inputMode="numeric"
              value={data.whatsapp}
              onChange={(e) => setData({ ...data, whatsapp: e.target.value.replace(/[^\d]/g, "") })}
              placeholder="34971728253"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* Dirección */}
      <Section title="Dirección" hint="Calle y ciudad. Bilingüe por si la traducción cambia.">
        <BilingualInput
          label="Calle y número"
          value={data.addressStreet}
          onChange={(v) => setData({ ...data, addressStreet: v })}
          placeholder={{ es: "C/ Rubí 8 bajos", en: "8 Rubí Street, ground floor" }}
        />
        <BilingualInput
          label="Ciudad"
          value={data.addressCity}
          onChange={(v) => setData({ ...data, addressCity: v })}
          placeholder={{ es: "07000 Ciudad", en: "07000 Ciudad" }}
        />
      </Section>

      {/* Mapa */}
      <Section
        title="Mapa"
        hint="Pegá la URL del embed de Google Maps (Compartir > Insertar mapa > copiar src del iframe)."
      >
        <Field
          label="URL embed"
          hint="Empieza con https://www.google.com/maps/embed?pb=…"
        >
          <textarea
            value={data.mapEmbedUrl}
            onChange={(e) => setData({ ...data, mapEmbedUrl: e.target.value })}
            rows={3}
            placeholder="https://www.google.com/maps/embed?pb=..."
            className={`${inputClass} font-mono text-sm`}
          />
        </Field>
        {data.mapEmbedUrl && (
          <div className="rounded-xl overflow-hidden border border-border">
            <iframe
              src={data.mapEmbedUrl}
              className="w-full h-64 border-0"
              loading="lazy"
              title="Vista previa del mapa"
            />
          </div>
        )}
      </Section>

      {/* Horario */}
      <Section
        title="Horario"
        hint="Items que aparecen en footer y página de contacto. Cada uno bilingüe."
      >
        <ScheduleSection
          items={data.schedule}
          onChange={(s) => setData({ ...data, schedule: s })}
        />
      </Section>

      {/* Redes */}
      <Section title="Redes sociales" hint="Vacío = no se muestra en el sitio.">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Facebook URL">
            <input
              type="url"
              value={data.social.facebook}
              onChange={(e) =>
                setData({ ...data, social: { ...data.social, facebook: e.target.value } })
              }
              placeholder="https://www.facebook.com/..."
              className={inputClass}
            />
          </Field>
          <Field label="Instagram URL">
            <input
              type="url"
              value={data.social.instagram}
              onChange={(e) =>
                setData({ ...data, social: { ...data.social, instagram: e.target.value } })
              }
              placeholder="https://www.instagram.com/..."
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* Booksy */}
      <Section title="Reservas (Booksy)" hint="URL del widget público de Booksy.">
        <Field label="Booksy URL">
          <input
            type="url"
            value={data.booksyUrl}
            onChange={(e) => setData({ ...data, booksyUrl: e.target.value })}
            placeholder="https://booksy.com/es-es/instant-experiences/widget/..."
            className={inputClass}
          />
        </Field>
      </Section>

      {/* Bottom save mirror — UX: que no haya que hacer scroll up para guardar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {isDirty && (
          <button
            type="button"
            onClick={onDiscard}
            disabled={status === "saving"}
            className="text-sm text-muted hover:text-accent"
          >
            Descartar
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || status === "saving"}
          className="inline-flex items-center gap-2 rounded-md bg-accent text-white text-sm font-medium px-6 py-2.5 hover:bg-accent-hover disabled:bg-accent/40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "saving" ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

interface SectionProps {
  /** Título de la sección. */
  title: string;
  /** Subtítulo / ayuda opcional. */
  hint?: string;
  children: React.ReactNode;
}

function Section({ title, hint, children }: SectionProps) {
  return (
    <section className="space-y-5">
      <header>
        <h2 className="font-heading text-xl text-ink">{title}</h2>
        {hint && <p className="text-sm text-muted mt-1">{hint}</p>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <label className="text-xs uppercase tracking-widest text-muted">
          {label}
        </label>
        {hint && <span className="text-xs text-subtle">— {hint}</span>}
      </div>
      {children}
    </div>
  );
}
