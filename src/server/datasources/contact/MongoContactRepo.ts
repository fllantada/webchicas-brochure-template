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
 */
export const getContact = cache(async (): Promise<IContact> => {
  const collection = await getCollection<IContact>(COLLECTION);
  const doc = await collection.findOne({ key: MAIN_KEY });
  return doc ?? { ...EMPTY_CONTACT };
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
