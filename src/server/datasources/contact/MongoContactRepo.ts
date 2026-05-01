import { cache } from "react";

import { getCollection } from "@/server/shared/MongoService";

import type { IContact } from "./domain/IContact";
import { EMPTY_CONTACT } from "./domain/IContact";

const COLLECTION = "contact";
const MAIN_KEY = "main" as const;

/**
 * Lee el documento único de contacto. Si no existe, devuelve un esqueleto vacío
 * (no lo escribe en Mongo — la primera escritura ocurre cuando el admin guarda
 * o el seed corre). Cacheado por request via React.cache — muchas pages SC
 * leen este doc en el mismo request (header, footer, jsonLd, contacto/page),
 * y no queremos N round-trips a Mongo.
 *
 * Hidrata defaults para campos nuevos del shape: si la DB tiene un doc creado
 * antes de que se agregaran campos (ej. social.tripadvisor en 2026-05-01), el
 * merge garantiza que el caller siempre reciba el shape completo. Sin esto,
 * `contact.social.tripadvisor` podría ser undefined y romper TS strict.
 */
export const getContact = cache(async (): Promise<IContact> => {
  const collection = await getCollection<IContact>(COLLECTION);
  const doc = await collection.findOne({ key: MAIN_KEY });
  if (!doc) return { ...EMPTY_CONTACT };
  return {
    ...EMPTY_CONTACT,
    ...doc,
    social: { ...EMPTY_CONTACT.social, ...(doc.social ?? {}) },
  };
});

/**
 * Upsert del documento de contacto. El admin manda el shape completo
 * — no hay merge parcial para evitar dejar campos viejos zombie.
 */
export async function updateContact(
  data: Omit<IContact, "_id" | "key" | "updatedAt">,
): Promise<IContact> {
  const collection = await getCollection<IContact>(COLLECTION);
  const now = new Date();
  await collection.findOneAndUpdate(
    { key: MAIN_KEY },
    { $set: { ...data, key: MAIN_KEY, updatedAt: now } },
    { upsert: true, returnDocument: "after" },
  );
  return { ...data, key: MAIN_KEY, updatedAt: now };
}
