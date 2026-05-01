import { ObjectId } from "mongodb";
import { cache } from "react";

import { getCollection } from "@/server/shared/MongoService";

import type { IMenuItem, MenuCategory } from "./domain/IMenuItem";

const COLLECTION = "menu_items";

/**
 * Lista los items del menú activos para el sitio público — cacheado por
 * request (React.cache). Usar este en SC de páginas como `/carta`.
 *
 * Para admin (que necesita ver inactivos) usar `listMenuItems({includeInactive:true})`.
 */
export const listActiveMenuItems = cache(async (): Promise<IMenuItem[]> => {
  const collection = await getCollection<IMenuItem>(COLLECTION);
  return collection
    .find({ active: true })
    .sort({ category: 1, order: 1 })
    .toArray();
});

/** Lista todos los items incluyendo inactivos. Solo para admin. */
export async function listMenuItems(opts?: {
  /** Si `true`, incluye items con active=false (admin). Default false. */
  includeInactive?: boolean;
}): Promise<IMenuItem[]> {
  const collection = await getCollection<IMenuItem>(COLLECTION);
  const filter = opts?.includeInactive ? {} : { active: true };
  return collection.find(filter).sort({ category: 1, order: 1 }).toArray();
}

/** Lee un item por su _id (string). Devuelve null si no existe o id inválido. */
export async function getMenuItemById(
  id: string,
): Promise<IMenuItem | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCollection<IMenuItem>(COLLECTION);
  return collection.findOne({ _id: new ObjectId(id) });
}

interface CreateMenuItemInput {
  /** Categoría que agrupa el item en la UI. */
  category: MenuCategory;
  /** Nombre del plato/bebida. */
  title: IMenuItem["title"];
  /** Descripción opcional (ingredientes, alergenos, preparación). */
  description?: IMenuItem["description"];
  /** Importe EUR sin símbolo. null = sin precio fijo. */
  price: IMenuItem["price"];
  /** Nota textual junto al precio ("por persona", "(2 pers.)"). */
  priceNote?: IMenuItem["priceNote"];
  /** Override del precio numérico ("Consultar", "Mercado"). */
  priceOverride?: IMenuItem["priceOverride"];
  /** Key opcional de imagen del admin/media. */
  imageKey?: string;
  /** Tags para filtros (vegetariano, sin-gluten, picante...). */
  tags?: string[];
  /** Posición dentro de la categoría (asc). */
  order: number;
  /** Si false, no aparece en sitio público. */
  active: boolean;
}

/** Crea un item nuevo. Devuelve el doc con _id asignado. */
export async function createMenuItem(
  data: CreateMenuItemInput,
): Promise<IMenuItem> {
  const collection = await getCollection<IMenuItem>(COLLECTION);
  const now = new Date();
  const doc: Omit<IMenuItem, "_id"> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc as IMenuItem);
  return { ...doc, _id: result.insertedId };
}

/** Edita un item existente. Acepta patch parcial. */
export async function updateMenuItem(
  id: string,
  patch: Partial<CreateMenuItemInput>,
): Promise<IMenuItem | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCollection<IMenuItem>(COLLECTION);
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result as IMenuItem | null;
}

/** Borra un item. Sin soft-delete — para ocultar usar `active=false`. */
export async function deleteMenuItem(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getCollection<IMenuItem>(COLLECTION);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

/**
 * Devuelve `true` si hay al menos 1 item en la colección. Útil para que el
 * sidebar admin muestre el link "Menú" solo si el cliente lo está usando
 * (template polirubrico — no todos los clientes son restaurantes).
 */
export async function hasAnyMenuItems(): Promise<boolean> {
  const collection = await getCollection<IMenuItem>(COLLECTION);
  const count = await collection.countDocuments({}, { limit: 1 });
  return count > 0;
}
