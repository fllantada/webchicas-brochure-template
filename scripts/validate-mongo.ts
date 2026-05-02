/**
 * Validator de Mongo para Fase 3 del /migrate.
 *
 * Verifica que el contenido del cliente llegó a Mongo:
 * - getContact().phone no vacío
 * - Si industry=restaurante → menu collection con ≥1 item
 * - Si industry=estetica/peluqueria → prices collection con ≥1 item
 *
 * Lee la industria de migrations/capture/extracted/industry.json (output de
 * extract-from-capture.ts). Si extracted/ no existe, asume "general" y solo
 * valida contact.
 *
 * Exit:
 *   0  → todos los checks pasan
 *   ≠0 → al menos uno falló (n = cantidad de fails)
 *
 * Uso (típicamente invocado desde validate-clone.sh):
 *   npx tsx scripts/validate-mongo.ts
 */
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { getContact } from "../src/server/datasources/contact/MongoContactRepo";
import { hasAnyMenuItems } from "../src/server/datasources/menu/MongoMenuRepo";
import { hasAnyPrices } from "../src/server/datasources/prices/MongoPriceRepo";

const EXTRACTED = resolve(process.cwd(), "migrations/capture/extracted");

interface IndustryReport {
  industry: string;
}

function readIndustry(): string {
  const path = join(EXTRACTED, "industry.json");
  if (!existsSync(path)) return "general";
  const data = JSON.parse(readFileSync(path, "utf-8")) as IndustryReport;
  return data.industry ?? "general";
}

async function main(): Promise<void> {
  let fails = 0;
  const ok = (msg: string): void => {
    console.log(`  [OK  ] ${msg}`);
  };
  const err = (msg: string): void => {
    console.log(`  [FAIL] ${msg}`);
    fails++;
  };

  // contact
  const contact = await getContact();
  if (!contact.phone) err("Mongo contact sin phone — migrate-content no cargó contacto");
  else ok(`Mongo contact tiene phone (${contact.phone})`);

  // industry-specific
  const industry = readIndustry();
  if (industry === "restaurante") {
    if (await hasAnyMenuItems()) ok("Mongo menu tiene items");
    else err("Mongo menu vacío y industry=restaurante — migrate-content no cargó el menú");
  } else if (industry === "estetica" || industry === "peluqueria") {
    if (await hasAnyPrices()) ok(`Mongo prices tiene items (industry=${industry})`);
    else err(`Mongo prices vacío y industry=${industry} — migrate-content no cargó precios`);
  } else {
    ok(`industry=${industry} — sin módulo R3 esperado`);
  }

  process.exit(fails);
}

main().catch((e) => {
  console.error("[validate-mongo] error:", e);
  process.exit(1);
});
