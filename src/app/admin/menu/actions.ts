"use server";

import { revalidatePath } from "next/cache";

import { getAdminUser } from "@/lib/auth";
import {
  createMenuItem,
  deleteMenuItem,
  updateMenuItem,
} from "@/server/datasources/menu/MongoMenuRepo";
import type { IMenuItem } from "@/server/datasources/menu/domain/IMenuItem";
import { MENU_CATEGORIES } from "@/server/datasources/menu/domain/IMenuItem";

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

/** Verifica que haya sesión válida con rol admin o editor. */
async function isAuthorized(): Promise<boolean> {
  const user = await getAdminUser();
  return Boolean(user && ["admin", "editor"].includes(user.role));
}

/** Revalida las rutas que renderean menu (carta + layout). */
function revalidateMenuRoutes(): void {
  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
}

type MenuItemPayload = Omit<IMenuItem, "_id" | "createdAt" | "updatedAt">;

/**
 * Valida y sanitiza el payload. Bloquea XSS via stored data y previene shapes
 * malformados. Devuelve mensaje de error legible o null si todo OK.
 */
function validate(payload: MenuItemPayload): string | null {
  if (!MENU_CATEGORIES.includes(payload.category)) {
    return "Categoría inválida";
  }

  if (typeof payload.title?.es !== "string" || typeof payload.title?.en !== "string") {
    return "Título malformado";
  }
  if (!payload.title.es.trim()) {
    return "El título en español es obligatorio";
  }

  if (payload.description !== undefined && payload.description !== null) {
    if (typeof payload.description.es !== "string" || typeof payload.description.en !== "string") {
      return "Descripción malformada";
    }
  }
  if (payload.priceNote !== undefined && payload.priceNote !== null) {
    if (typeof payload.priceNote.es !== "string" || typeof payload.priceNote.en !== "string") {
      return "Nota de precio malformada";
    }
  }
  if (payload.priceOverride !== undefined && payload.priceOverride !== null) {
    if (typeof payload.priceOverride.es !== "string" || typeof payload.priceOverride.en !== "string") {
      return "Texto en lugar del precio malformado";
    }
  }

  if (payload.price !== null && (typeof payload.price !== "number" || payload.price < 0)) {
    return "El precio debe ser un número positivo o null";
  }

  if (typeof payload.active !== "boolean") return "active inválido";

  if (typeof payload.order !== "number" || !Number.isFinite(payload.order)) {
    return "order inválido";
  }

  return null;
}

/** Crea un item de menú nuevo. */
export async function createMenuItemAction(
  payload: MenuItemPayload,
): Promise<ActionResult<{ id: string }>> {
  if (!(await isAuthorized())) return { success: false, error: "No autorizado" };
  const err = validate(payload);
  if (err) return { success: false, error: err };

  try {
    const created = await createMenuItem(payload);
    revalidateMenuRoutes();
    return { success: true, data: { id: created._id!.toString() } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error creando item",
    };
  }
}

/** Actualiza un item de menú existente. */
export async function updateMenuItemAction(
  id: string,
  payload: MenuItemPayload,
): Promise<ActionResult> {
  if (!(await isAuthorized())) return { success: false, error: "No autorizado" };
  const err = validate(payload);
  if (err) return { success: false, error: err };

  try {
    const updated = await updateMenuItem(id, payload);
    if (!updated) return { success: false, error: "Item no encontrado" };
    revalidateMenuRoutes();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error guardando item",
    };
  }
}

/** Borra definitivamente un item. Para ocultarlo usar `active=false` en su lugar. */
export async function deleteMenuItemAction(id: string): Promise<ActionResult> {
  if (!(await isAuthorized())) return { success: false, error: "No autorizado" };

  try {
    const ok = await deleteMenuItem(id);
    if (!ok) return { success: false, error: "Item no encontrado" };
    revalidateMenuRoutes();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error borrando item",
    };
  }
}
