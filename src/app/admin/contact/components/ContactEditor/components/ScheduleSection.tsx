"use client";

import { randomUUID } from "@/lib/uuid";
import type { ScheduleItem } from "@/server/datasources/contact/domain/IContact";

import { BilingualInput } from "./BilingualInput";

interface Props {
  /** Items actuales del horario, ordenados como aparecen en el sitio. */
  items: ScheduleItem[];
  /** Setter — recibe el array completo actualizado. */
  onChange: (next: ScheduleItem[]) => void;
}

const EMPTY_ITEM = (): ScheduleItem => ({
  id: randomUUID(),
  label: { es: "", en: "" },
  hours: { es: "", en: "" },
});

/**
 * Lista repetible de items de horario. Cada item es bilingüe (label + hours)
 * y se puede mover, eliminar o agregar uno nuevo. El orden importa porque
 * es el que verán los usuarios en el footer y la página de contacto.
 */
export function ScheduleSection({ items, onChange }: Props) {
  function update(idx: number, patch: Partial<ScheduleItem>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function add() {
    onChange([...items, EMPTY_ITEM()]);
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="rounded-xl border border-border bg-surface p-4 md:p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-widest text-muted">
              Día {idx + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                aria-label="Mover arriba"
                className="p-1.5 text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === items.length - 1}
                aria-label="Mover abajo"
                className="p-1.5 text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label="Eliminar día"
                className="p-1.5 text-muted hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <BilingualInput
            label="Día / días"
            value={item.label}
            onChange={(v) => update(idx, { label: v })}
            placeholder={{ es: "Lunes", en: "Monday" }}
          />
          <BilingualInput
            label="Horario"
            value={item.hours}
            onChange={(v) => update(idx, { hours: v })}
            placeholder={{ es: "9:30 — 17:30 / Cerrado", en: "9:30 — 17:30 / Closed" }}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-xl border border-dashed border-border bg-bg/50 hover:border-accent hover:text-accent text-sm text-muted py-3 transition-colors"
      >
        + Agregar día
      </button>
    </div>
  );
}
