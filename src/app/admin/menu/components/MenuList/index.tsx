"use client";

import { useMemo, useState, useTransition } from "react";

import {
  MENU_CATEGORIES,
  MENU_CATEGORY_LABELS,
  type MenuCategory,
} from "@/server/datasources/menu/domain/IMenuItem";

import { deleteMenuItemAction, updateMenuItemAction } from "../../actions";
import { formatMenuPriceForLocale } from "../../helpers";
import type { PlainMenuItem } from "../../types";

interface Props {
  /** Lista completa de items (incluye inactivos). Vienen pre-ordenados. */
  items: PlainMenuItem[];
}

/**
 * Lista master de items del menú — agrupada por categoría. Permite editar (link
 * a página de detalle), borrar, activar/desactivar inline. Para crear nuevos
 * usar el CTA "+ Nuevo plato" del header parent o el "+ Agregar" por categoría.
 */
export function MenuList({ items }: Props) {
  const [list, setList] = useState(items);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<MenuCategory, PlainMenuItem[]> = {
      tapas: [],
      ensaladas: [],
      entrantes: [],
      pescados: [],
      carnes: [],
      pastas: [],
      arroces: [],
      postres: [],
      "bebidas-cerveza": [],
      "bebidas-vino": [],
      "bebidas-cocteles": [],
      "bebidas-refrescos": [],
      "bebidas-cafe": [],
      "menu-ninos": [],
      "menu-degustacion": [],
      otro: [],
    };
    for (const it of list) map[it.category].push(it);
    return map;
  }, [list]);

  function toggleActive(item: PlainMenuItem) {
    setBusyId(item._id);
    startTransition(async () => {
      const next = !item.active;
      const response = await updateMenuItemAction(item._id, {
        category: item.category,
        title: item.title,
        description: item.description,
        price: item.price,
        priceNote: item.priceNote,
        priceOverride: item.priceOverride,
        order: item.order,
        active: next,
      });
      setBusyId(null);
      if (!response.success) {
        alert(response.error ?? "Error");
        return;
      }
      setList((prev) =>
        prev.map((p) => (p._id === item._id ? { ...p, active: next } : p)),
      );
    });
  }

  function onDelete(item: PlainMenuItem) {
    if (!confirm(`¿Borrar "${item.title.es}"? No se puede deshacer.`)) return;
    setBusyId(item._id);
    startTransition(async () => {
      const response = await deleteMenuItemAction(item._id);
      setBusyId(null);
      if (!response.success) {
        alert(response.error ?? "Error");
        return;
      }
      setList((prev) => prev.filter((p) => p._id !== item._id));
    });
  }

  return (
    <div className="space-y-12">
      {MENU_CATEGORIES.map((cat) => {
        const itemsInCat = grouped[cat];
        if (itemsInCat.length === 0) return null;

        const visibleCount = itemsInCat.filter((i) => i.active).length;

        return (
          <section key={cat}>
            <header className="flex items-end justify-between border-b border-border pb-3 mb-4 gap-4">
              <div>
                <h2 className="font-heading text-2xl text-ink">
                  {MENU_CATEGORY_LABELS[cat].es}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {visibleCount} visibles · {itemsInCat.length} total
                </p>
              </div>
              <a
                href={`/admin/menu/new?category=${cat}`}
                className="text-xs text-accent hover:text-accent-hover uppercase tracking-widest"
              >
                + Agregar
              </a>
            </header>

            <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
              {itemsInCat.map((item) => (
                <li
                  key={item._id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    item.active ? "" : "opacity-60 bg-bg/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    disabled={busyId === item._id || pending}
                    className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                      item.active ? "bg-accent" : "bg-border"
                    } disabled:opacity-50`}
                    aria-label={item.active ? "Desactivar" : "Activar"}
                    title={item.active ? "Visible en el sitio" : "Oculto en el sitio"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        item.active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{item.title.es}</p>
                    {item.title.en && (
                      <p className="text-xs text-muted truncate">{item.title.en}</p>
                    )}
                  </div>

                  <span className="font-heading text-base text-accent shrink-0">
                    {formatMenuPriceForLocale({
                      price: item.price,
                      priceOverride: item.priceOverride,
                      locale: "es",
                    })}
                  </span>

                  <a
                    href={`/admin/menu/${item._id}`}
                    className="shrink-0 text-xs text-muted hover:text-accent uppercase tracking-widest px-2"
                  >
                    Editar
                  </a>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    disabled={busyId === item._id || pending}
                    className="shrink-0 text-xs text-muted hover:text-red-600 px-2 disabled:opacity-50"
                    aria-label="Borrar"
                    title="Borrar definitivamente"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
