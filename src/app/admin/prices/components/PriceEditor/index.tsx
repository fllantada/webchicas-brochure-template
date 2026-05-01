"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  PRICE_CATEGORIES,
  PRICE_CATEGORY_LABELS,
  type PriceCategory,
} from "@/server/datasources/prices/domain/IPrice";
import { BilingualInput } from "@/app/admin/contact/components/ContactEditor/components/BilingualInput";

import {
  createPriceAction,
  deletePriceAction,
  updatePriceAction,
} from "../../actions";
import { formatPriceForLocale } from "../../helpers";
import type { PricePayload } from "../../types";

interface Props {
  /** ID si estamos editando, null si es creación. */
  id: string | null;
  /** Estado inicial del form. Para nuevo precio, usar defaults vacíos. */
  initial: PricePayload;
}

const inputClass =
  "w-full rounded-md border border-border bg-bg px-3 py-2.5 text-base text-ink placeholder:text-subtle focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus:ring-1 focus:ring-accent transition-colors";

/** Form completo de un precio (crear y editar usan el mismo). */
export function PriceEditor({ id, initial }: Props) {
  const router = useRouter();
  const [data, setData] = useState<PricePayload>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const initialJson = useMemo(() => JSON.stringify(initial), [initial]);
  const isDirty = useMemo(
    () => JSON.stringify(data) !== initialJson,
    [data, initialJson],
  );
  const canSave = isDirty && data.title.es.trim().length > 0;

  async function onSave() {
    setStatus("saving");
    setError(null);

    const response = id
      ? await updatePriceAction(id, data)
      : await createPriceAction(data);

    if (!response.success) {
      setError(response.error ?? "Error guardando");
      setStatus("error");
      return;
    }
    setStatus("idle");
    router.push("/admin/prices");
  }

  async function onDelete() {
    if (!id) return;
    if (!confirm(`¿Borrar "${data.title.es}"? No se puede deshacer.`)) return;
    setStatus("saving");
    const response = await deletePriceAction(id);
    if (!response.success) {
      setError(response.error ?? "Error");
      setStatus("error");
      return;
    }
    router.push("/admin/prices");
  }

  return (
    <div className="space-y-8">
      {/* Sticky save bar */}
      <div className="sticky top-0 md:top-2 z-20 -mx-6 md:mx-0 px-6 md:px-4 py-3 bg-bg/95 backdrop-blur-sm border-b border-border md:rounded-xl md:border md:bg-surface/90 md:shadow-sm flex items-center gap-3">
        <span
          className={`text-xs ${
            status === "error"
              ? "text-red-600"
              : isDirty
                ? "text-amber-700"
                : "text-muted"
          }`}
        >
          {status === "saving"
            ? "Guardando…"
            : status === "error"
              ? `Error: ${error}`
              : isDirty
                ? "Cambios sin guardar"
                : "Sin cambios"}
        </span>
        <div className="flex-1" />
        {id && (
          <button
            type="button"
            onClick={onDelete}
            disabled={status === "saving"}
            className="text-sm text-muted hover:text-red-600 disabled:opacity-50"
          >
            Borrar
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || status === "saving"}
          className="rounded-md bg-accent text-white text-sm font-medium px-5 py-2 hover:bg-accent-hover disabled:bg-accent/40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "saving" ? "Guardando…" : id ? "Guardar" : "Crear"}
        </button>
      </div>

      {/* Vista previa — espejo del item tal como aparece en /tarifas */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-accent font-medium">
            👁 Vista previa — así se verá en la web
          </span>
        </div>
        <div className="bg-bg rounded-lg px-4 py-3 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-muted mb-1">
            Sección: {PRICE_CATEGORY_LABELS[data.category].es}
          </p>
          <div className="flex justify-between items-baseline gap-6 py-2 border-t border-border">
            <div className="min-w-0">
              <p className="text-ink text-sm">
                {data.title.es || (
                  <span className="text-subtle italic">(escribí un nombre)</span>
                )}
              </p>
              {data.description?.es && (
                <p className="text-xs text-subtle mt-0.5">{data.description.es}</p>
              )}
            </div>
            <span className="font-heading text-lg text-accent shrink-0">
              {formatPriceForLocale({
                price: data.price,
                isFromPrice: data.isFromPrice,
                priceOverride: data.priceOverride,
                locale: "es",
              })}
            </span>
          </div>
          {!data.active && (
            <p className="mt-2 text-[11px] text-amber-700">
              ⚠ Está oculto — no lo verán tus clientes hasta que lo actives.
            </p>
          )}
        </div>
      </div>

      {/* Visibilidad + Sección */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted mb-2">
            Sección donde aparece
          </label>
          <select
            value={data.category}
            onChange={(e) =>
              setData({ ...data, category: e.target.value as PriceCategory })
            }
            className={inputClass}
          >
            {PRICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {PRICE_CATEGORY_LABELS[cat].es}
              </option>
            ))}
          </select>
          <p className="text-xs text-subtle mt-1">
            Agrupa el precio dentro de esta sección en /tarifas.
          </p>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted mb-2">
            Visibilidad
          </label>
          <div className="flex items-center gap-3 h-[42px]">
            <button
              type="button"
              onClick={() => setData({ ...data, active: !data.active })}
              className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${
                data.active ? "bg-accent" : "bg-border"
              }`}
              aria-label={data.active ? "Visible" : "Oculto"}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  data.active ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-ink">
              {data.active ? "Visible en el sitio" : "Oculto"}
            </span>
          </div>
        </div>
      </div>

      {/* Nombre */}
      <BilingualInput
        label="Nombre del tratamiento"
        hint="Lo que verá el cliente en /tarifas"
        value={data.title}
        onChange={(v) => setData({ ...data, title: v })}
        placeholder={{ es: "Tratamiento facial básico", en: "Basic facial treatment" }}
      />

      {/* Descripción opcional */}
      <BilingualInput
        label="Detalle opcional"
        hint="Texto pequeño debajo del nombre (vacío = no se muestra)"
        value={
          data.description ?? { es: "", en: "" }
        }
        onChange={(v) => setData({ ...data, description: v })}
        multiline
      />

      {/* Precio */}
      <fieldset className="grid md:grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-4 md:p-5">
        <legend className="px-2 text-xs uppercase tracking-widest text-muted">
          Precio
        </legend>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-subtle mb-1">
            Importe (€)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={data.price ?? ""}
            onChange={(e) =>
              setData({
                ...data,
                price: e.target.value === "" ? null : parseFloat(e.target.value),
              })
            }
            placeholder="—"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-subtle mb-1">
            Mostrar como “Desde”
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setData({ ...data, isFromPrice: !data.isFromPrice })}
              className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${
                data.isFromPrice ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  data.isFromPrice ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs text-subtle">
              Ej. “Desde 70€” en lugar del importe exacto.
            </span>
          </div>
        </div>
      </fieldset>

      {/* Override de texto (cuando price no aplica) */}
      <BilingualInput
        label="Texto en lugar del precio"
        hint="Para items tipo “Según zona” o “Consultar”. Vacío = se muestra el importe normal."
        value={data.priceOverride ?? { es: "", en: "" }}
        onChange={(v) => setData({ ...data, priceOverride: v })}
      />
    </div>
  );
}
