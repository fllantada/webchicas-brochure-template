"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  copyMediaFromKey,
  getMediaByKey,
  reprocessMediaQuality,
  uploadMedia,
  updateMediaMeta,
} from "@/server/datasources/media/MediaApi";
import type {
  ImageQuality,
  MediaCategory,
} from "@/server/datasources/media/domain/IMedia";

const VALID_QUALITIES: ImageQuality[] = ["standard", "high", "max"];

function parseQuality(raw: unknown): ImageQuality {
  return VALID_QUALITIES.includes(raw as ImageQuality)
    ? (raw as ImageQuality)
    : "standard";
}
import { withRole } from "@/server/shared/auth";

interface ActionResult {
  success: boolean;
  error?: string;
}

/** Verifica que el request tenga JWT firmado y rol admin o editor. */
async function ensureAuth(): Promise<void> {
  const headerList = await headers();
  const cookie = headerList.get("cookie") ?? "";
  withRole(new Request("http://x", { headers: { cookie } }), [
    "admin",
    "editor",
  ]);
}

/** Reemplaza la imagen de un slot existente. Re-procesa todas las variantes. */
export async function replaceImageAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    await ensureAuth();
  } catch {
    return { success: false, error: "No autorizado" };
  }

  const file = formData.get("file") as File | null;
  const key = formData.get("key") as string | null;
  const altEs = (formData.get("altEs") as string | null) ?? "";
  const altEn = (formData.get("altEn") as string | null) ?? "";
  const category = formData.get("category") as MediaCategory | null;
  const quality = parseQuality(formData.get("quality"));

  if (!file || !key || !category) {
    return { success: false, error: "Faltan campos requeridos" };
  }
  if (file.size === 0) {
    return { success: false, error: "Archivo vacío" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const existing = await getMediaByKey(key);
    const label = existing?.label ?? key;
    const usedIn = existing?.usedIn ?? [];
    await uploadMedia({
      file: buffer,
      key,
      label,
      alt: { es: altEs, en: altEn },
      category,
      quality,
      usedIn,
    });
    revalidatePath("/", "layout");
    revalidatePath("/admin/media");
    revalidatePath(`/admin/media/${key}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error procesando imagen",
    };
  }
}

/**
 * Reemplaza la imagen del slot con UNA EXISTENTE en la biblioteca.
 * Copia el archivo (cada slot es independiente — editar el source no afecta).
 */
export async function replaceFromExistingAction(
  destKey: string,
  sourceKey: string,
  qualityRaw?: string,
): Promise<ActionResult> {
  try {
    await ensureAuth();
  } catch {
    return { success: false, error: "No autorizado" };
  }

  if (destKey === sourceKey) {
    return { success: false, error: "No podés reemplazarla por sí misma" };
  }

  try {
    const dest = await getMediaByKey(destKey);
    if (!dest) return { success: false, error: "Slot destino no existe" };

    await copyMediaFromKey({
      destKey,
      destLabel: dest.label,
      sourceKey,
      alt: dest.alt,
      category: dest.category,
      quality: parseQuality(qualityRaw ?? dest.quality),
      usedIn: dest.usedIn,
    });
    revalidatePath("/", "layout");
    revalidatePath("/admin/media");
    revalidatePath(`/admin/media/${destKey}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error",
    };
  }
}

/**
 * Reprocesa la imagen actual del slot con un nuevo nivel de calidad. Útil cuando
 * el cliente quiere subir/bajar calidad sin re-uploadear el archivo.
 */
export async function reprocessQualityAction(
  key: string,
  qualityRaw: string,
): Promise<ActionResult> {
  try {
    await ensureAuth();
  } catch {
    return { success: false, error: "No autorizado" };
  }

  try {
    await reprocessMediaQuality(key, parseQuality(qualityRaw));
    revalidatePath("/", "layout");
    revalidatePath("/admin/media");
    revalidatePath(`/admin/media/${key}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error",
    };
  }
}

/** Actualiza solo metadata (alt es/en, categoría). NO reprocesa. */
export async function updateMetaAction(
  key: string,
  data: { altEs: string; altEn: string; category: MediaCategory },
): Promise<ActionResult> {
  try {
    await ensureAuth();
  } catch {
    return { success: false, error: "No autorizado" };
  }

  try {
    await updateMediaMeta(key, {
      alt: { es: data.altEs, en: data.altEn },
      category: data.category,
    });
    revalidatePath("/", "layout");
    revalidatePath("/admin/media");
    revalidatePath(`/admin/media/${key}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error",
    };
  }
}
