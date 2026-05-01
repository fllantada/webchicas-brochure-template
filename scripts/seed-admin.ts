/**
 * Seed inicial del admin user. Lee ADMIN_EMAIL y ADMIN_NAME de env.
 *
 * Uso:
 *   ADMIN_EMAIL=cliente@dominio.com ADMIN_NAME="Cliente" npx tsx scripts/seed-admin.ts
 *
 * Idempotente — si el email ya existe en la colección users, no hace nada.
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { seedAdminUser } from "../src/server/datasources/auth/seed";

seedAdminUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed-admin] error:", err.message);
    process.exit(1);
  });
