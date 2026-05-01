"use server";

import { revalidatePath } from "next/cache";

import { getAdminUser } from "@/lib/auth";
import { updateContact } from "@/server/datasources/contact/MongoContactRepo";
import type { IContact } from "@/server/datasources/contact/domain/IContact";

interface ActionResult {
  success: boolean;
  error?: string;
}

type ContactPayload = Omit<IContact, "_id" | "key" | "updatedAt">;

/**
 * Permite la URL solo si arranca con http(s):// — evita javascript:/data:/etc
 * que serían vector XSS al renderizarse en `href` o `src` de iframe.
 */
function isSafeHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

/** Email permisivo — sí permite vacío (campo opcional). */
function isSafeEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value === "") return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Sanitiza el payload del admin antes de persistirlo. Bloquea XSS via stored
 * data (URLs `javascript:`, iframe arbitrario en mapEmbedUrl, etc). Devuelve
 * un error legible si algo no pasa.
 */
function sanitize(payload: ContactPayload): { ok: true; data: ContactPayload } | { ok: false; error: string } {
  if (typeof payload.phone !== "string") return { ok: false, error: "Teléfono inválido" };
  if (typeof payload.phoneRaw !== "string" || !/^\d*$/.test(payload.phoneRaw)) {
    return { ok: false, error: "Teléfono (formato técnico) inválido" };
  }
  if (typeof payload.whatsapp !== "string" || !/^\d*$/.test(payload.whatsapp)) {
    return { ok: false, error: "WhatsApp inválido" };
  }
  if (!isSafeEmail(payload.email)) return { ok: false, error: "Email inválido" };

  // Map embed: solo permitir el iframe oficial de Google Maps. Cierra el riesgo
  // de iframe arbitrario (phishing, clickjacking).
  if (
    payload.mapEmbedUrl !== "" &&
    !payload.mapEmbedUrl.startsWith("https://www.google.com/maps/embed")
  ) {
    return {
      ok: false,
      error: "URL del mapa: solo se acepta el embed de Google Maps (https://www.google.com/maps/embed...)",
    };
  }

  // Social URLs y Booksy: solo http(s).
  for (const key of ["facebook", "instagram"] as const) {
    const v = payload.social?.[key];
    if (v !== "" && !isSafeHttpUrl(v)) {
      return { ok: false, error: `URL de ${key} inválida (debe empezar con https://)` };
    }
  }
  if (payload.booksyUrl !== "" && !isSafeHttpUrl(payload.booksyUrl)) {
    return { ok: false, error: "URL de Booksy inválida" };
  }

  // Schedule: cada item debe tener el shape correcto.
  if (!Array.isArray(payload.schedule)) return { ok: false, error: "Schedule inválido" };
  for (const item of payload.schedule) {
    if (
      typeof item?.id !== "string" ||
      typeof item?.label?.es !== "string" ||
      typeof item?.label?.en !== "string" ||
      typeof item?.hours?.es !== "string" ||
      typeof item?.hours?.en !== "string"
    ) {
      return { ok: false, error: "Item de horario malformado" };
    }
  }

  // Direcciones bilingües: ambos idiomas como string.
  for (const key of ["addressStreet", "addressCity"] as const) {
    if (typeof payload[key]?.es !== "string" || typeof payload[key]?.en !== "string") {
      return { ok: false, error: `Dirección (${key}) inválida` };
    }
  }

  return { ok: true, data: payload };
}

/**
 * Guarda el documento de contacto completo. Valida + sanitiza para evitar
 * XSS via stored data antes de persistir.
 */
export async function updateContactAction(
  payload: ContactPayload,
): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user || !["admin", "editor"].includes(user.role)) {
    return { success: false, error: "No autorizado" };
  }

  const result = sanitize(payload);
  if (!result.ok) return { success: false, error: result.error };

  try {
    await updateContact(result.data);
    // Revalida todo el sitio público — contact aparece en footer/header de
    // toda la web, además de la página de contacto en sí.
    revalidatePath("/", "layout");
    revalidatePath("/admin/contact");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error guardando contacto",
    };
  }
}
