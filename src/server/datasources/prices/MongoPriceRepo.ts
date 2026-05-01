import { ObjectId } from "mongodb";
import { cache } from "react";

import { getCollection } from "@/server/shared/MongoService";

import type { IPrice, PriceCategory } from "./domain/IPrice";

const COLLECTION = "prices";

/**
 * Lista los precios activos del sitio público — cacheado por request.
 * Para admin (que necesita inactivos también) usar `listAllPricesForAdmin`.
 */
export const listActivePrices = cache(async (): Promise<IPrice[]> => {
  const collection = await getCollection<IPrice>(COLLECTION);
  return collection
    .find({ active: true })
    .sort({ category: 1, order: 1 })
    .toArray();
});

/** Lista todos los precios incluyendo inactivos. Solo para admin. */
export async function listPrices(opts?: {
  /** Si `true`, incluye items con active=false (admin). Default false. */
  includeInactive?: boolean;
}): Promise<IPrice[]> {
  const collection = await getCollection<IPrice>(COLLECTION);
  const filter = opts?.includeInactive ? {} : { active: true };
  return collection
    .find(filter)
    .sort({ category: 1, order: 1 })
    .toArray();
}

/** Lee un precio por su _id (string). Devuelve null si no existe. */
export async function getPriceById(id: string): Promise<IPrice | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCollection<IPrice>(COLLECTION);
  return collection.findOne({ _id: new ObjectId(id) });
}

interface CreatePriceInput {
  category: PriceCategory;
  title: IPrice["title"];
  description?: IPrice["description"];
  price: IPrice["price"];
  isFromPrice: boolean;
  priceOverride?: IPrice["priceOverride"];
  durationMinutes?: number;
  order: number;
  active: boolean;
}

/** Crea un precio nuevo. Devuelve el doc con _id asignado. */
export async function createPrice(data: CreatePriceInput): Promise<IPrice> {
  const collection = await getCollection<IPrice>(COLLECTION);
  const now = new Date();
  const doc: Omit<IPrice, "_id"> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc as IPrice);
  return { ...doc, _id: result.insertedId };
}

/** Edita un precio existente. Acepta patch parcial. */
export async function updatePrice(
  id: string,
  patch: Partial<CreatePriceInput>,
): Promise<IPrice | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCollection<IPrice>(COLLECTION);
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result as IPrice | null;
}

/** Borra un precio. Sin soft-delete — para ocultar usar `active=false`. */
export async function deletePrice(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getCollection<IPrice>(COLLECTION);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

/**
 * Devuelve `true` si hay al menos 1 precio en la colección. Útil para que el
 * sidebar admin muestre el link "Precios" solo si el cliente lo está usando
 * (template polirrubrico — no todos los clientes son estética/peluquería).
 *
 * Mismo patrón que `hasAnyMenuItems()` en MongoMenuRepo. Ver IA-docs admin
 * regla #6 (polirrubrismo).
 */
export async function hasAnyPrices(): Promise<boolean> {
  const collection = await getCollection<IPrice>(COLLECTION);
  const count = await collection.countDocuments({}, { limit: 1 });
  return count > 0;
}
