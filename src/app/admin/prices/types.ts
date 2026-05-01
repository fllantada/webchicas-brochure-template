import type { IPrice } from "@/server/datasources/prices/domain/IPrice";

/**
 * Versión serializable de IPrice para pasar de Server → Client Components.
 * Convierte ObjectId/Date a strings (lo que JSON.stringify produce).
 */
export type PlainPrice = Omit<IPrice, "_id" | "createdAt" | "updatedAt"> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

/** Payload que envía el cliente al guardar (sin meta-fields del repo). */
export type PricePayload = Omit<IPrice, "_id" | "createdAt" | "updatedAt">;
