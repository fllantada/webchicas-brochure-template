/**
 * Migra el contenido extraído de la captura → estructuras del cliente.
 *
 * Lee `migrations/capture/extracted/` (output de `extract-from-capture.ts`)
 * y aplica:
 *
 * 1. Override `src/messages/{es,en}.json` con el copy del cliente (solo si
 *    los valores actuales son los defaults del template — "Bienvenidos" etc.).
 * 2. `updateContact()` con el shape de IContact derivado de contact.json.
 * 3. `createMenuItem()` por cada item del menu.json (si industria=restaurante
 *    Y la collection Mongo está vacía).
 * 4. `createPrice()` por cada item de prices.json (si industria=estetica/peluqueria
 *    Y la collection Mongo está vacía).
 *
 * Idempotente:
 * - messages.json: solo escribe sobre defaults conocidos del template
 *   (`hero_title === "Bienvenidos"`, etc.) — si el cliente ya editó, skip.
 * - Mongo collections: chequea `hasAnyMenuItems()` / `hasAnyPrices()` antes
 *   de seedear. Re-correr es no-op si ya hay datos.
 * - Contact: chequea `getContact().phone` no vacío → skip.
 *
 * Uso:
 *   npx tsx scripts/migrate-content.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  getContact,
  updateContact,
} from "../src/server/datasources/contact/MongoContactRepo";
import type { IContact } from "../src/server/datasources/contact/domain/IContact";
import {
  createMenuItem,
  hasAnyMenuItems,
} from "../src/server/datasources/menu/MongoMenuRepo";
import { MENU_CATEGORIES, type MenuCategory } from "../src/server/datasources/menu/domain/IMenuItem";
import {
  createPrice,
  hasAnyPrices,
} from "../src/server/datasources/prices/MongoPriceRepo";
import { PRICE_CATEGORIES, type PriceCategory } from "../src/server/datasources/prices/domain/IPrice";

const CWD = process.cwd();
const EXTRACTED = join(CWD, "migrations/capture/extracted");
const MESSAGES_DIR = join(CWD, "src/messages");

interface IndustryReport {
  industry: "restaurante" | "estetica" | "peluqueria" | "construccion" | "fotografia" | "consultoria" | "general";
  scores: Record<string, number>;
  reason: string;
}

interface ExtractedSections {
  hero: { title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  brandIntro: string;
  sections: Array<{ id: string; title: string; body: string; ctas: string[] }>;
}

interface MenuItemDraft {
  category: string;
  title: string;
  description: string;
  price: number | null;
  priceNote: string;
}

interface PriceItemDraft {
  category: string;
  title: string;
  description: string;
  price: number | null;
  durationMinutes: number | null;
}

interface CapturedContact {
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: { street?: string; postalCode?: string; city?: string; raw?: string };
  social?: { facebook?: string; instagram?: string; tripadvisor?: string };
  mapEmbed?: string;
  businessSince?: string;
  note?: string;
}

function readJsonOrNull<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function inferBusinessName(): string {
  const seoPath = join(CWD, "migrations/capture/seo/metadata.json");
  const seo = readJsonOrNull<{ pages?: Record<string, { title?: string }> }>(seoPath);
  const homeTitle = seo?.pages?.index?.title ?? "";
  // Title típicamente "El Cuerno Tapas | restaurante en Palma" → tomar antes de pipe/dash
  const name = homeTitle.split(/[|·\-—]/)[0].trim();
  return name || "";
}

/**
 * Defaults conocidos del template, por dotPath y locale. Si el valor actual del
 * cliente coincide con uno de estos, es seguro sobrescribirlo. Si difiere
 * (cliente ya editó), skip respetando lo del cliente.
 *
 * Lista TODOS los locales soportados por el template — agregar acá si se
 * agregan más idiomas al template upstream.
 */
const TEMPLATE_DEFAULTS: Record<string, string[]> = {
  "layout.title_default": ["Bienvenidos", "Welcome"],
  "layout.description": ["Sitio web del cliente", "Client website"],
  "layout.og_site_name": ["Sitio", "Site"],
  "layout.og_title": ["Bienvenidos", "Welcome"],
  "layout.og_description": ["Sitio web del cliente", "Client website"],
  "layout.twitter_title": ["Bienvenidos", "Welcome"],
  "layout.twitter_description": ["Sitio web del cliente", "Client website"],
  "footer.brand_name": ["Bienvenidos", "Welcome"],
  "footer.brand_description": ["Sitio web del cliente", "Client website"],
  "home.hero_title": ["Bienvenidos", "Welcome"],
  "home.hero_subtitle": [
    "Una breve descripción de tu negocio aquí.",
    "A short description of your business here.",
  ],
};

function getNested(obj: Record<string, unknown>, dotPath: string): string | undefined {
  const parts = dotPath.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

function setNested(obj: Record<string, unknown>, dotPath: string, value: string): void {
  const parts = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in cur) || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

interface MigrateMessagesPlan {
  /** Mapeo dotPath → valor a aplicar. Solo se aplica si actual === default del template. */
  overrides: Record<string, string>;
}

function buildMessagesPlan(
  sections: ExtractedSections,
  businessName: string,
): MigrateMessagesPlan {
  const overrides: Record<string, string> = {};
  if (businessName) {
    overrides["layout.title_default"] = businessName;
    overrides["layout.og_site_name"] = businessName;
    overrides["footer.brand_name"] = businessName;
  }
  if (sections.hero.title) {
    overrides["home.hero_title"] = sections.hero.title;
    overrides["layout.og_title"] = sections.hero.title;
    overrides["layout.twitter_title"] = sections.hero.title;
  }
  if (sections.hero.subtitle) {
    overrides["home.hero_subtitle"] = sections.hero.subtitle;
    overrides["layout.description"] = sections.hero.subtitle;
    overrides["layout.og_description"] = sections.hero.subtitle;
    overrides["layout.twitter_description"] = sections.hero.subtitle;
    overrides["footer.brand_description"] = sections.hero.subtitle;
  }
  return { overrides };
}

function applyMessagesOverride(localePath: string, plan: MigrateMessagesPlan): { applied: number; skipped: number } {
  if (!existsSync(localePath)) {
    console.log(`  [skip] ${localePath} no existe`);
    return { applied: 0, skipped: 0 };
  }
  const messages = JSON.parse(readFileSync(localePath, "utf-8")) as Record<string, unknown>;
  let applied = 0;
  let skipped = 0;
  for (const [dotPath, newValue] of Object.entries(plan.overrides)) {
    const current = getNested(messages, dotPath);
    const expectedDefaults = TEMPLATE_DEFAULTS[dotPath];
    if (expectedDefaults && current !== undefined && !expectedDefaults.includes(current)) {
      // El cliente ya tiene un valor distinto al default → respetar
      console.log(`  [skip] ${dotPath}: ya tiene "${current.slice(0, 50)}" (no-default)`);
      skipped++;
      continue;
    }
    setNested(messages, dotPath, newValue);
    console.log(`  [set ] ${dotPath} = "${newValue.slice(0, 60)}${newValue.length > 60 ? "..." : ""}"`);
    applied++;
  }
  writeFileSync(localePath, JSON.stringify(messages, null, 2) + "\n");
  return { applied, skipped };
}

function toLocalized(textEs: string, textEn: string = ""): { es: string; en: string } {
  return { es: textEs, en: textEn };
}

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function buildContactShape(captured: CapturedContact): Omit<IContact, "_id" | "key" | "updatedAt"> {
  const phone = captured.phone ?? "";
  const phoneRaw = digitsOnly(phone);
  const whatsappRaw = captured.whatsapp ? digitsOnly(captured.whatsapp) : phoneRaw;
  const cityLine = [captured.address?.city, captured.address?.postalCode].filter(Boolean).join(", ");

  return {
    phone,
    phoneRaw,
    whatsapp: whatsappRaw,
    email: captured.email ?? "",
    addressStreet: toLocalized(captured.address?.street ?? ""),
    addressCity: toLocalized(cityLine),
    mapEmbedUrl: captured.mapEmbed ?? "",
    schedule: [],
    social: {
      facebook: captured.social?.facebook ?? "",
      instagram: captured.social?.instagram ?? "",
      tripadvisor: captured.social?.tripadvisor ?? "",
    },
    booksyUrl: "",
  };
}

async function migrateContact(captured: CapturedContact): Promise<void> {
  const current = await getContact();
  if (current.phone) {
    console.log(`  [skip] contact ya cargado (phone="${current.phone}")`);
    return;
  }
  const shape = buildContactShape(captured);
  await updateContact(shape);
  console.log(`  [up  ] contact actualizado (phone="${shape.phone}", email="${shape.email}", social=${Object.values(shape.social).filter(Boolean).length} redes)`);
  if (captured.note) console.log(`  [note] ${captured.note}`);
}

function clampMenuCategory(cat: string): MenuCategory {
  return (MENU_CATEGORIES as readonly string[]).includes(cat) ? (cat as MenuCategory) : "otro";
}

function clampPriceCategory(cat: string): PriceCategory {
  return (PRICE_CATEGORIES as readonly string[]).includes(cat) ? (cat as PriceCategory) : "otro";
}

async function migrateMenu(items: MenuItemDraft[]): Promise<void> {
  if (await hasAnyMenuItems()) {
    console.log("  [skip] Mongo menu ya tiene items");
    return;
  }
  const orderByCategory: Record<string, number> = {};
  let created = 0;
  for (const item of items) {
    const category = clampMenuCategory(item.category);
    const order = (orderByCategory[category] ?? 0) + 1;
    orderByCategory[category] = order;
    await createMenuItem({
      category,
      title: toLocalized(item.title),
      description: item.description ? toLocalized(item.description) : undefined,
      price: item.price,
      priceNote: item.priceNote ? toLocalized(item.priceNote) : undefined,
      order,
      active: true,
    });
    created++;
  }
  console.log(`  [up  ] menu items creados: ${created}`);
}

async function migratePrices(items: PriceItemDraft[]): Promise<void> {
  if (await hasAnyPrices()) {
    console.log("  [skip] Mongo prices ya tiene items");
    return;
  }
  const orderByCategory: Record<string, number> = {};
  let created = 0;
  for (const item of items) {
    const category = clampPriceCategory(item.category);
    const order = (orderByCategory[category] ?? 0) + 1;
    orderByCategory[category] = order;
    await createPrice({
      category,
      title: toLocalized(item.title),
      description: item.description ? toLocalized(item.description) : undefined,
      price: item.price,
      isFromPrice: false,
      durationMinutes: item.durationMinutes ?? undefined,
      order,
      active: true,
    });
    created++;
  }
  console.log(`  [up  ] price items creados: ${created}`);
}

async function main(): Promise<void> {
  if (!existsSync(EXTRACTED)) {
    console.error(`[migrate-content] ${EXTRACTED} no existe. Correr extract-from-capture.ts primero.`);
    process.exit(1);
  }

  const industry = readJsonOrNull<IndustryReport>(join(EXTRACTED, "industry.json"));
  const sections = readJsonOrNull<ExtractedSections>(join(EXTRACTED, "sections.json"));
  const contact = readJsonOrNull<CapturedContact>(join(EXTRACTED, "contact.json"));
  if (!industry || !sections) {
    console.error("[migrate-content] faltan industry.json o sections.json");
    process.exit(1);
  }

  console.log(`[migrate-content] industry=${industry.industry}`);

  // 1. Messages
  const businessName = inferBusinessName();
  console.log(`[migrate-content] business name inferido: "${businessName || "(no detectado)"}"`);
  const plan = buildMessagesPlan(sections, businessName);
  console.log("[migrate-content] override messages/es.json:");
  applyMessagesOverride(join(MESSAGES_DIR, "es.json"), plan);
  console.log("[migrate-content] override messages/en.json:");
  applyMessagesOverride(join(MESSAGES_DIR, "en.json"), plan);

  // 2. Contact
  if (contact) {
    console.log("[migrate-content] migrando contact:");
    await migrateContact(contact);
  } else {
    console.log("[migrate-content] WARN: no contact extraído, skip");
  }

  // 3. Menu (restaurante)
  if (industry.industry === "restaurante") {
    const menu = readJsonOrNull<MenuItemDraft[]>(join(EXTRACTED, "menu.json")) ?? [];
    if (menu.length > 0) {
      console.log("[migrate-content] migrando menu items:");
      await migrateMenu(menu);
    }
  }

  // 4. Prices (estetica/peluqueria)
  if (industry.industry === "estetica" || industry.industry === "peluqueria") {
    const prices = readJsonOrNull<PriceItemDraft[]>(join(EXTRACTED, "prices.json")) ?? [];
    if (prices.length > 0) {
      console.log("[migrate-content] migrando price items:");
      await migratePrices(prices);
    }
  }

  console.log("[migrate-content] done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate-content] error:", err);
    process.exit(1);
  });
