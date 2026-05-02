/**
 * Parser semántico de la captura del sitio original.
 *
 * Lee `migrations/capture/` (output de /web-capture) y produce JSONs
 * estructurados que `migrate-content.ts` consume para llenar messages.json
 * + Mongo del cliente.
 *
 * Output:
 *   migrations/capture/extracted/industry.json    → { industry: "restaurante" | "estetica" | ... }
 *   migrations/capture/extracted/sections.json    → { hero: {...}, sections: [...] }
 *   migrations/capture/extracted/menu.json        → [{ category, title, ... }]   (si industria=restaurante)
 *   migrations/capture/extracted/prices.json      → [{ category, title, ... }]   (si industria=estetica/peluqueria)
 *   migrations/capture/extracted/contact.json     → IContact-shape (si capture/contact.json existe lo passthroughea)
 *
 * Idempotente: re-escribe los outputs cada corrida (los inputs no cambian).
 *
 * NOTA — heurísticas conservadoras:
 *   El parser usa heurísticas sobre el formato `=== SECTION: name ===` /
 *   `H1: ...` / `H2: ...` / `P: ...` / `A: ...` / `BUTTON: ...` que
 *   /web-capture produce en pages/*.txt. Si el sitio capturado no respeta
 *   ese formato, los outputs salen incompletos pero NUNCA inventados —
 *   campos que no se pudieron extraer quedan como "" o [] para que
 *   migrate-content los detecte y los marque en logs.
 *
 * Uso:
 *   npx tsx scripts/extract-from-capture.ts
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const CAPTURE = resolve(process.cwd(), "migrations/capture");
const EXTRACTED = join(CAPTURE, "extracted");

interface PageLine {
  tag: "SECTION" | "H1" | "H2" | "H3" | "H4" | "H5" | "H6" | "P" | "A" | "BUTTON";
  text: string;
}

interface PageSection {
  id: string;
  lines: PageLine[];
}

interface ParsedPage {
  slug: string;
  sections: PageSection[];
}

type Industry =
  | "restaurante"
  | "estetica"
  | "peluqueria"
  | "construccion"
  | "fotografia"
  | "consultoria"
  | "general";

const INDUSTRY_KEYWORDS: Record<Exclude<Industry, "general">, string[]> = {
  restaurante: ["carta", "menú", "menu", "tapas", "platos", "reserva mesa", "comensales", "cocina", "brasa", "vinos", "cócteles", "cocteles"],
  estetica: ["tratamiento", "facial", "masaje", "depilación", "depilacion", "estética", "estetica", "cabina"],
  peluqueria: ["peluquería", "peluqueria", "corte", "coloración", "coloracion", "peinado", "barbería", "barberia"],
  construccion: ["construcción", "construccion", "obra", "reforma", "albañilería", "albanileria", "presupuesto"],
  fotografia: ["fotografía", "fotografia", "sesión", "sesion", "boda", "retrato", "portfolio"],
  consultoria: ["consultoría", "consultoria", "asesoría", "asesoria", "B2B"],
};

function parsePageTxt(slug: string, content: string): ParsedPage {
  const lines = content.split("\n");
  const sections: PageSection[] = [];
  let current: PageSection | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const sectionMatch = line.match(/^=== SECTION:\s*(.+?)\s*===$/);
    if (sectionMatch) {
      if (current) sections.push(current);
      current = { id: sectionMatch[1].trim(), lines: [] };
      continue;
    }

    const tagMatch = line.match(/^(H[1-6]|P|A|BUTTON):\s*(.+)$/);
    if (tagMatch && current) {
      current.lines.push({
        tag: tagMatch[1] as PageLine["tag"],
        text: tagMatch[2].trim(),
      });
    }
  }
  if (current) sections.push(current);

  return { slug, sections };
}

function loadPages(): ParsedPage[] {
  const pagesDir = join(CAPTURE, "pages");
  if (!existsSync(pagesDir)) return [];
  return readdirSync(pagesDir)
    .filter((f) => f.endsWith(".txt"))
    .map((f) => {
      const slug = f.replace(/\.txt$/, "");
      const content = readFileSync(join(pagesDir, f), "utf-8");
      return parsePageTxt(slug, content);
    });
}

function detectIndustry(pages: ParsedPage[]): { industry: Industry; scores: Record<string, number>; reason: string } {
  const text = pages
    .flatMap((p) => p.sections.flatMap((s) => s.lines.map((l) => l.text)))
    .join(" ")
    .toLowerCase();

  const scores: Record<string, number> = {};
  for (const [industry, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    let score = 0;
    for (const kw of kws) {
      const matches = (text.match(new RegExp(`\\b${kw}\\b`, "g")) || []).length;
      score += matches * 2;
    }
    scores[industry] = score;
  }

  // Sitemap path bonus
  const sitemapPath = join(CAPTURE, "sitemap.json");
  let pathReason = "";
  if (existsSync(sitemapPath)) {
    const sitemap = JSON.parse(readFileSync(sitemapPath, "utf-8"));
    const paths: string[] = (sitemap.pages || []).map((p: { url: string }) =>
      new URL(p.url).pathname.toLowerCase(),
    );
    const pathBonus: Record<string, RegExp[]> = {
      restaurante: [/\bcarta\b/, /\bmenu\b/, /\btapas\b/, /\bcocina\b/],
      estetica: [/\btratamiento/, /\btarifas\b/, /\bservicios?\b/],
      peluqueria: [/\bpeluqueria/, /\bbarberia/],
      construccion: [/\bobra/, /\breforma/, /\bproyecto/],
      fotografia: [/\bportfolio/, /\bgaleria/],
      consultoria: [/\bservicios?\b/],
    };
    for (const [industry, regexes] of Object.entries(pathBonus)) {
      for (const rx of regexes) {
        if (paths.some((p) => rx.test(p))) {
          scores[industry] = (scores[industry] ?? 0) + 5;
          pathReason += `+5 path match ${rx} for ${industry}; `;
        }
      }
    }
  }

  // Tech-stack signals (schema.org type if present)
  const techPath = join(CAPTURE, "tech-stack.json");
  if (existsSync(techPath)) {
    const tech = JSON.parse(readFileSync(techPath, "utf-8"));
    const schemaType = (tech.schemaType ?? "").toLowerCase();
    if (schemaType.includes("restaurant")) scores.restaurante = (scores.restaurante ?? 0) + 10;
    if (schemaType.includes("beautysalon")) scores.estetica = (scores.estetica ?? 0) + 10;
    if (schemaType.includes("hairsalon")) scores.peluqueria = (scores.peluqueria ?? 0) + 10;
  }

  let best: Industry = "general";
  let bestScore = 0;
  for (const [industry, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = industry as Industry;
      bestScore = score;
    }
  }
  if (bestScore < 5) {
    return {
      industry: "general",
      scores,
      reason: `Best score ${bestScore} < 5 → defaulting to "general"`,
    };
  }
  return {
    industry: best,
    scores,
    reason: `Top: ${best} (${bestScore} pts). ${pathReason}`,
  };
}

interface ExtractedSections {
  hero: { title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  brandIntro: string;
  sections: Array<{ id: string; title: string; body: string; ctas: string[] }>;
}

function extractSections(pages: ParsedPage[]): ExtractedSections {
  // El "hero" típicamente es la primera sección con un H1 (o la sección llamada
  // "bienvenidos" / "hero" / la primera del index si no hay match obvio).
  const indexPage = pages.find((p) => p.slug === "index") ?? pages[0];
  const hero = { title: "", subtitle: "", ctaPrimary: "", ctaSecondary: "" };
  let brandIntro = "";
  const sections: ExtractedSections["sections"] = [];

  if (!indexPage) return { hero, brandIntro, sections };

  // Detectar hero: primera sección con un H1, o la 1ra/2da del index
  const heroSection =
    indexPage.sections.find((s) => s.lines.some((l) => l.tag === "H1")) ??
    indexPage.sections[0];

  if (heroSection) {
    const h1 = heroSection.lines.find((l) => l.tag === "H1");
    const firstP = heroSection.lines.find((l) => l.tag === "P");
    const links = heroSection.lines.filter((l) => l.tag === "A");
    hero.title = h1?.text ?? "";
    hero.subtitle = firstP?.text ?? "";
    hero.ctaPrimary = links[0]?.text ?? "";
    hero.ctaSecondary = links[1]?.text ?? "";
  }

  // brandIntro: primera sección con H2 + P (después del hero)
  for (const section of indexPage.sections) {
    if (section === heroSection) continue;
    const firstP = section.lines.find((l) => l.tag === "P");
    if (firstP && firstP.text.length > 20) {
      brandIntro = firstP.text;
      break;
    }
  }

  // sections: todas las del index excepto header/footer/hero
  const skipIds = new Set(["header", "footer", "nav"]);
  for (const section of indexPage.sections) {
    if (section === heroSection) continue;
    if (skipIds.has(section.id.toLowerCase())) continue;
    const heading = section.lines.find((l) => /^H[2-3]$/.test(l.tag));
    const body = section.lines
      .filter((l) => l.tag === "P")
      .map((l) => l.text)
      .join(" ");
    const ctas = section.lines
      .filter((l) => l.tag === "A" || l.tag === "BUTTON")
      .map((l) => l.text);
    sections.push({
      id: section.id,
      title: heading?.text ?? "",
      body,
      ctas,
    });
  }

  return { hero, brandIntro, sections };
}

interface MenuItemDraft {
  category: string;
  title: string;
  description: string;
  price: number | null;
  priceNote: string;
  rawSection: string;
}

const MENU_CATEGORY_KEYWORDS: Array<[string, RegExp]> = [
  ["menu-degustacion", /\bdegusta/i],
  ["tapas", /\btapas?\b/i],
  ["ensaladas", /\bensaladas?\b/i],
  ["entrantes", /\bentrantes?\b|\bpicoteo\b|\baperitivos?\b/i],
  ["pescados", /\bpescados?\b|\bmariscos?\b|\bmar\b/i],
  ["carnes", /\bcarnes?\b|\bbrasa\b|\bparrilla\b/i],
  ["pastas", /\bpastas?\b|\bpasta\b/i],
  ["arroces", /\barroces?\b|\bpaella/i],
  ["postres", /\bpostres?\b|\bdulces?\b/i],
  ["bebidas-cerveza", /\bcervezas?\b/i],
  ["bebidas-vino", /\bvinos?\b/i],
  ["bebidas-cocteles", /\bc[óo]cteles?\b/i],
  ["bebidas-cafe", /\bcaf[ée]s?\b|\binfusiones?\b/i],
  ["bebidas-refrescos", /\brefrescos?\b|\baguas?\b/i],
  ["menu-ninos", /\bni[ñn]os?\b|\binfantil\b/i],
];

function inferMenuCategory(sectionTitle: string): string {
  for (const [cat, rx] of MENU_CATEGORY_KEYWORDS) {
    if (rx.test(sectionTitle)) return cat;
  }
  return "otro";
}

function extractMenuItems(pages: ParsedPage[]): MenuItemDraft[] {
  const items: MenuItemDraft[] = [];
  const indexPage = pages.find((p) => p.slug === "index") ?? pages[0];
  if (!indexPage) return items;

  // Parser ingenuo: dentro de la sección "carta" (o cualquiera con `H2/H3`
  // que matchee categorías), agrupar items por H3, donde cada P consecutivo
  // es un nombre de plato. Si hay precio detectable en el texto, parsearlo.
  const cartaSection = indexPage.sections.find((s) =>
    /\b(carta|men[úu]|nuestra cocina)\b/i.test(s.id) ||
    s.lines.some((l) => l.tag === "H2" && /\bcarta|men[úu]\b/i.test(l.text)),
  );
  if (!cartaSection) return items;

  let currentCategory = "otro";
  for (const line of cartaSection.lines) {
    if (line.tag === "H3" || line.tag === "H2") {
      currentCategory = inferMenuCategory(line.text);
      continue;
    }
    if (line.tag !== "P") continue;
    const priceMatch = line.text.match(/(\d{1,3}(?:[.,]\d{1,2})?)\s*[€]/);
    const priceNoteMatch = line.text.match(/^(por persona|\(.*\))$/i);
    if (priceNoteMatch && items.length > 0) {
      // Anexa nota al ítem anterior (ej. "por persona")
      items[items.length - 1].priceNote = priceNoteMatch[1];
      continue;
    }
    const price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;
    const titleClean = line.text.replace(/(\d{1,3}(?:[.,]\d{1,2})?)\s*[€]/, "").trim();
    if (!titleClean || titleClean.length < 3) continue;
    items.push({
      category: currentCategory,
      title: titleClean,
      description: "",
      price,
      priceNote: "",
      rawSection: cartaSection.id,
    });
  }
  return items;
}

interface PriceItemDraft {
  category: string;
  title: string;
  description: string;
  price: number | null;
  durationMinutes: number | null;
}

const PRICE_CATEGORY_KEYWORDS: Array<[string, RegExp]> = [
  ["facial", /\bfacial\b/i],
  ["corporal", /\bcorporal\b/i],
  ["masaje", /\bmasajes?\b/i],
  ["manos-pies", /\bmanos?|\bpies?|\buñas?|\bmanicur|\bpedicur/i],
  ["depilacion", /\bdepilaci[óo]n\b/i],
  ["maquillaje", /\bmaquillajes?\b/i],
  ["bronceado", /\bbronceados?\b/i],
];

function inferPriceCategory(sectionTitle: string): string {
  for (const [cat, rx] of PRICE_CATEGORY_KEYWORDS) {
    if (rx.test(sectionTitle)) return cat;
  }
  return "otro";
}

function extractPriceItems(pages: ParsedPage[]): PriceItemDraft[] {
  const items: PriceItemDraft[] = [];
  for (const page of pages) {
    if (!/tarifa|servicio|tratamiento|precio/i.test(page.slug)) continue;
    let currentCategory = "otro";
    for (const section of page.sections) {
      const heading = section.lines.find((l) => l.tag === "H2" || l.tag === "H3");
      if (heading) currentCategory = inferPriceCategory(heading.text);
      for (const line of section.lines) {
        if (line.tag !== "P") continue;
        const priceMatch = line.text.match(/(\d{1,3}(?:[.,]\d{1,2})?)\s*[€]/);
        const minutesMatch = line.text.match(/(\d{1,3})\s*(?:min|minutos?)/i);
        const titleClean = line.text
          .replace(/(\d{1,3}(?:[.,]\d{1,2})?)\s*[€]/, "")
          .replace(/(\d{1,3})\s*(?:min|minutos?)/i, "")
          .trim();
        if (!titleClean || titleClean.length < 3) continue;
        items.push({
          category: currentCategory,
          title: titleClean,
          description: "",
          price: priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null,
          durationMinutes: minutesMatch ? parseInt(minutesMatch[1], 10) : null,
        });
      }
    }
  }
  return items;
}

function passthroughContact(): unknown {
  const contactPath = join(CAPTURE, "contact.json");
  if (!existsSync(contactPath)) return null;
  return JSON.parse(readFileSync(contactPath, "utf-8"));
}

function ensureExtractedDir(): void {
  if (!existsSync(EXTRACTED)) mkdirSync(EXTRACTED, { recursive: true });
}

function writeJson(filename: string, data: unknown): void {
  writeFileSync(join(EXTRACTED, filename), JSON.stringify(data, null, 2));
}

function main(): void {
  if (!existsSync(CAPTURE)) {
    console.error(`[extract] ${CAPTURE} no existe. Correr /web-capture primero.`);
    process.exit(1);
  }

  ensureExtractedDir();
  const pages = loadPages();
  if (pages.length === 0) {
    console.error("[extract] no hay pages/*.txt en la captura");
    process.exit(1);
  }

  const industryReport = detectIndustry(pages);
  console.log(`[extract] industry: ${industryReport.industry}`);
  console.log(`[extract] reason:   ${industryReport.reason}`);
  writeJson("industry.json", industryReport);

  const sections = extractSections(pages);
  console.log(`[extract] sections: hero.title="${sections.hero.title}", ${sections.sections.length} other sections`);
  writeJson("sections.json", sections);

  if (industryReport.industry === "restaurante") {
    const menu = extractMenuItems(pages);
    console.log(`[extract] menu items: ${menu.length}`);
    writeJson("menu.json", menu);
  }

  if (industryReport.industry === "estetica" || industryReport.industry === "peluqueria") {
    const prices = extractPriceItems(pages);
    console.log(`[extract] price items: ${prices.length}`);
    writeJson("prices.json", prices);
  }

  const contact = passthroughContact();
  if (contact) {
    console.log("[extract] contact: passthrough from capture/contact.json");
    writeJson("contact.json", contact);
  } else {
    console.log("[extract] WARN: no contact.json in capture — contact extraction is /web-capture's responsibility");
  }

  console.log(`[extract] outputs in ${EXTRACTED}`);
}

main();
