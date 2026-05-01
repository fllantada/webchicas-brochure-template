/**
 * Seed inicial del admin user — toma datos de env vars.
 * Ejemplos:
 *   ADMIN_EMAIL=cliente@dominio.com ADMIN_NAME="Nombre Cliente" npx tsx scripts/seed-admin.ts
 */
import { getCollection } from "@/server/shared/MongoService";

import type { IUser } from "./domain/IUser";

const COLLECTION = "users";

export async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email) {
    throw new Error("ADMIN_EMAIL no configurado");
  }

  const collection = await getCollection<IUser>(COLLECTION);
  const existing = await collection.findOne({ email });
  if (existing) {
    console.log(`[seed-admin] ${email} ya existe — skip`);
    return;
  }

  const now = new Date();
  await collection.insertOne({
    email,
    name,
    role: "admin",
    active: true,
    createdAt: now,
  });
  console.log(`[seed-admin] creado admin ${email}`);
}
