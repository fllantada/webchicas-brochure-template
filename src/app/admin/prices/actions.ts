"use server";

import { revalidatePath } from "next/cache";

import { getAdminUser } from "@/lib/auth";
import {
  createPrice,
  deletePrice,
  updatePrice,
} from "@/server/datasources/prices/MongoPriceRepo";
import type { IPrice } from "@/server/datasources/prices/domain/IPrice";
import { PRICE_CATEGORIES } from "@/server/datasources/prices/domain/IPrice";

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

/** Revalida todas las rutas que renderean precios (tarifas + servicios + layout). */
function revalidatePriceRoutes(): void {
  revalidatePath("/", "layout");
  revalidatePath("/admin/prices");
}

type PricePayload = Omit<IPrice, "_id" | "createdAt" | "updatedAt">;

/**
 * Valida y sanitiza el payload. Bloquea XSS via stored data y previene shapes
 * malformados. Devuelve mensaje de error legible o null si todo OK.
 */
function validate(payload: PricePayload): string | null {
  if (!PRICE_CATEGORIES.includes(payload.category)) {
    return "Categoría inválida";
  }

  // Title bilingüe — strings, ES obligatorio.
  if (typeof payload.title?.es !== "string" || typeof payload.title?.en !== "string") {
    return "Título malformado";
  }
  if (!payload.title.es.trim()) {
    return "El título en español es obligatorio";
  }

  // Description y priceOverride opcionales — si vienen, validar shape.
  if (payload.description !== undefined && payload.description !== null) {
    if (typeof payload.description.es !== "string" || typeof payload.description.en !== "string") {
      return "Descripción malformada";
    }
  }
  if (payload.priceOverride !== undefined && payload.priceOverride !== null) {
    if (typeof payload.priceOverride.es !== "string" || typeof payload.priceOverride.en !== "string") {
      return "Texto en lugar del precio malformado";
    }
  }

  // Precio numérico positivo o null.
  if (payload.price !== null && (typeof payload.price !== "number" || payload.price < 0)) {
    return "El precio debe ser un número positivo o null";
  }

  // Booleanos.
  if (typeof payload.isFromPrice !== "boolean") return "isFromPrice inválido";
  if (typeof payload.active !== "boolean") return "active inválido";

  // Order numérico finito.
  if (typeof payload.order !== "number" || !Number.isFinite(payload.order)) {
    return "order inválido";
  }

  return null;
}

/** Crea un precio nuevo. */
export async function createPriceAction(
  payload: PricePayload,
): Promise<ActionResult<{ id: string }>> {
  if (!(await isAuthorized())) return { success: false, error: "No autorizado" };
  const err = validate(payload);
  if (err) return { success: false, error: err };

  try {
    const created = await createPrice(payload);
    revalidatePriceRoutes();
    return { success: true, data: { id: created._id!.toString() } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error creando precio",
    };
  }
}

/** Actualiza un precio existente. */
export async function updatePriceAction(
  id: string,
  payload: PricePayload,
): Promise<ActionResult> {
  if (!(await isAuthorized())) return { success: false, error: "No autorizado" };
  const err = validate(payload);
  if (err) return { success: false, error: err };

  try {
    const updated = await updatePrice(id, payload);
    if (!updated) return { success: false, error: "Precio no encontrado" };
    revalidatePriceRoutes();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error guardando precio",
    };
  }
}

/** Borra definitivamente un precio. Para ocultar usar `active=false` en su lugar. */
export async function deletePriceAction(id: string): Promise<ActionResult> {
  if (!(await isAuthorized())) return { success: false, error: "No autorizado" };

  try {
    const ok = await deletePrice(id);
    if (!ok) return { success: false, error: "Precio no encontrado" };
    revalidatePriceRoutes();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error borrando precio",
    };
  }
}
