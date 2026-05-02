import type { IMenuItem } from "@/server/datasources/menu/domain/IMenuItem";

/**
 * Versión serializable de IMenuItem para pasar de Server → Client Components.
 * Convierte ObjectId/Date a strings (lo que JSON.stringify produce).
 */
export type PlainMenuItem = Omit<IMenuItem, "_id" | "createdAt" | "updatedAt"> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

/** Payload que envía el cliente al guardar (sin meta-fields del repo). */
export type MenuItemPayload = Omit<IMenuItem, "_id" | "createdAt" | "updatedAt">;
