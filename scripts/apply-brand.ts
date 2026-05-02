/**
 * Apply-brand: aplica la paleta y fonts del sitio original al cliente.
 *
 * Lee `migrations/capture/brand/{palette,typography}.json` (output de
 * /web-capture) y modifica:
 *   - `src/app/globals.css`     → CSS vars con paleta del original
 *   - `src/app/layout.tsx`      → next/font/google con fonts del original
 *
 * Cierra el FAIL #2 de validate-clone.sh (paleta default del template)
 * — antes era paso manual del agente, ahora es ejecutable.
 *
 * Idempotente:
 *   - Si globals.css ya tiene paleta del cliente (no #F5F2EC ni #0D6666), skip
 *   - Si layout.tsx ya tiene fonts del cliente (no Raleway ni Nunito_Sans), skip
 *
 * Uso:
 *   npx tsx scripts/apply-brand.ts
 */
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const CWD = process.cwd();
const BRAND = join(CWD, "migrations/capture/brand");
const GLOBALS_CSS = join(CWD, "src/app/globals.css");
const ROOT_LAYOUT = join(CWD, "src/app/layout.tsx");

interface PaletteEntry {
  /** Color en formato CSS — rgb(R, G, B), #RRGGBB, oklab(...), etc. */
  value: string;
  /** Cantidad de elementos del DOM que usan este color. */
  count: number;
}

interface PaletteFile {
  primary?: string[];
  all: PaletteEntry[];
}

interface TypographyFile {
  fonts: string[];
  headings?: { h1?: Array<{ font?: string }> };
  body?: { font?: string };
}

interface Color {
  hex: string;
  r: number;
  g: number;
  b: number;
  /** HSL hue 0-360. */
  h: number;
  /** HSL saturation 0-1. */
  s: number;
  /** HSL lightness 0-1. */
  l: number;
  count: number;
}

/** Parsea rgb(R, G, B) o #RRGGBB a Color. Retorna null si formato no soportado. */
function parseColor(value: string, count: number): Color | null {
  const v = value.trim();
  let r = 0;
  let g = 0;
  let b = 0;

  const hexMatch = v.match(/^#([0-9a-fA-F]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    const rgbMatch = v.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
    if (!rgbMatch) return null; // skip oklab, hsl, transparent
    r = parseInt(rgbMatch[1], 10);
    g = parseInt(rgbMatch[2], 10);
    b = parseInt(rgbMatch[3], 10);
  }

  const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0").toUpperCase()).join("")}`;
  const { h, s, l } = rgbToHsl(r, g, b);
  return { hex, r, g, b, h, s, l, count };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60; break;
      case gn: h = ((bn - rn) / d + 2) * 60; break;
      case bn: h = ((rn - gn) / d + 4) * 60; break;
    }
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  const toHex = (v: number): string =>
    Math.round((v + m) * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustLightness(c: Color, deltaL: number): string {
  const newL = Math.max(0, Math.min(1, c.l + deltaL));
  return hslToHex(c.h, c.s, newL);
}

function adjustSaturation(c: Color, newS: number, newL: number): string {
  return hslToHex(c.h, newS, newL);
}

interface BrandTokens {
  bg: string;
  surface: string;
  elevated: string;
  ink: string;
  muted: string;
  subtle: string;
  border: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
}

/**
 * Selecciona los tokens de marca desde la paleta capturada con heurísticas:
 *   - accent: el color con saturación >0.3 más usado (excluyendo grises)
 *   - bg: el color con lightness >0.85 más usado (canvas claro)
 *   - ink: el color con lightness <0.25 más usado (texto oscuro)
 * Si la paleta no tiene buenos candidatos, devuelve null y el script skipea.
 */
function pickBrandTokens(palette: Color[]): BrandTokens | null {
  // Filtros con count > 30 para descartar ruido
  const significant = palette.filter((c) => c.count >= 30);
  if (significant.length === 0) return null;

  // bg: lightness alta. Preferir warm whites (no #FFFFFF puro si hay alternativa)
  const lights = significant.filter((c) => c.l >= 0.85).sort((a, b) => b.count - a.count);
  const bg = lights[0] ?? significant.sort((a, b) => b.l - a.l)[0];

  // ink: lightness baja
  const darks = significant.filter((c) => c.l <= 0.3).sort((a, b) => b.count - a.count);
  const ink = darks[0] ?? significant.sort((a, b) => a.l - b.l)[0];

  // accent: saturation alta, descartar grises (s < 0.3)
  const colorful = significant.filter((c) => c.s > 0.3 && c.l > 0.2 && c.l < 0.7);
  const accent = colorful.sort((a, b) => b.count - a.count)[0];

  if (!bg || !ink || !accent) return null;

  return {
    bg: bg.hex,
    surface: adjustLightness(bg, -0.02),
    elevated: adjustLightness(bg, 0.02),
    ink: ink.hex,
    muted: adjustLightness(ink, 0.25),
    subtle: adjustLightness(ink, 0.4),
    border: adjustLightness(ink, 0.65),
    accent: accent.hex,
    accentHover: adjustLightness(accent, -0.1),
    accentSoft: adjustSaturation(accent, Math.max(0.15, accent.s * 0.3), Math.min(0.92, accent.l + 0.4)),
  };
}

function loadPalette(): Color[] {
  const file = join(BRAND, "palette.json");
  if (!existsSync(file)) return [];
  const data = JSON.parse(readFileSync(file, "utf-8")) as PaletteFile;
  return data.all
    .map((e) => parseColor(e.value, e.count))
    .filter((c): c is Color => c !== null);
}

/** Reemplaza el valor de una CSS var en el contenido. Devuelve content modificado. */
function replaceCssVar(content: string, varName: string, newValue: string): string {
  const regex = new RegExp(`(--${varName}\\s*:\\s*)#[0-9A-Fa-f]{6,8}(\\s*;)`);
  return content.replace(regex, `$1${newValue}$2`);
}

function applyPaletteToCss(tokens: BrandTokens): boolean {
  if (!existsSync(GLOBALS_CSS)) {
    console.log("[apply-brand] globals.css no existe, skip");
    return false;
  }
  let content = readFileSync(GLOBALS_CSS, "utf-8");
  const before = content;

  content = replaceCssVar(content, "color-bg", tokens.bg);
  content = replaceCssVar(content, "color-surface", tokens.surface);
  content = replaceCssVar(content, "color-elevated", tokens.elevated);
  content = replaceCssVar(content, "color-ink", tokens.ink);
  content = replaceCssVar(content, "color-muted", tokens.muted);
  content = replaceCssVar(content, "color-subtle", tokens.subtle);
  content = replaceCssVar(content, "color-border", tokens.border);
  content = replaceCssVar(content, "color-accent", tokens.accent);
  content = replaceCssVar(content, "color-accent-hover", tokens.accentHover);
  content = replaceCssVar(content, "color-accent-soft", tokens.accentSoft);

  if (content === before) {
    console.log("[apply-brand] globals.css sin cambios (regex no matcheó — ¿cambió la estructura?)");
    return false;
  }
  writeFileSync(GLOBALS_CSS, content);
  console.log("[apply-brand] globals.css aplicado:");
  for (const [k, v] of Object.entries(tokens)) {
    console.log(`  --color-${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v}`);
  }
  return true;
}

/**
 * Lista de Google Fonts con su variante next/font import name (snake_case).
 * Si una font del original no está acá, se ignora y se mantiene la default.
 * Agregar cuando aparezca un cliente nuevo con una font popular distinta.
 */
const GOOGLE_FONTS_KNOWN: Record<string, string> = {
  "Raleway": "Raleway",
  "Nunito Sans": "Nunito_Sans",
  "Inter": "Inter",
  "Montserrat": "Montserrat",
  "Poppins": "Poppins",
  "Roboto": "Roboto",
  "Open Sans": "Open_Sans",
  "Lato": "Lato",
  "Playfair Display": "Playfair_Display",
  "Cormorant Garamond": "Cormorant_Garamond",
  "DM Sans": "DM_Sans",
  "Mulish": "Mulish",
  "Dancing Script": "Dancing_Script",
  "Outfit": "Outfit",
  "Manrope": "Manrope",
  "Lora": "Lora",
  "Merriweather": "Merriweather",
  "Source Sans 3": "Source_Sans_3",
  "Source Serif 4": "Source_Serif_4",
  "Bebas Neue": "Bebas_Neue",
  "Oswald": "Oswald",
  "Cinzel": "Cinzel",
  "EB Garamond": "EB_Garamond",
  "Crimson Pro": "Crimson_Pro",
  "Noto Sans": "Noto_Sans",
  "Quicksand": "Quicksand",
  "Work Sans": "Work_Sans",
};

/** Extrae el primer family name del string font-family. */
function parseFontFamily(value: string | undefined): string | null {
  if (!value) return null;
  // ej: '"Dancing Script", "Dancing Script Fallback"' → "Dancing Script"
  const first = value.split(",")[0].trim().replace(/^["']|["']$/g, "");
  // Skip system fonts y stacks
  if (/^(ui-|system-|sans-serif|serif|monospace|cursive)/i.test(first)) return null;
  return first;
}

interface FontPair {
  headingName: string;
  headingImport: string;
  bodyName: string;
  bodyImport: string;
}

function pickFonts(typo: TypographyFile): FontPair | null {
  const headingFamily = parseFontFamily(typo.headings?.h1?.[0]?.font);
  const bodyFamily = parseFontFamily(typo.body?.font);

  const headingImport = headingFamily ? GOOGLE_FONTS_KNOWN[headingFamily] : null;
  const bodyImport = bodyFamily ? GOOGLE_FONTS_KNOWN[bodyFamily] : null;

  if (!headingImport && !bodyImport) {
    console.log(`[apply-brand] fonts del original no son Google Fonts conocidas (heading="${headingFamily}", body="${bodyFamily}") — skip layout.tsx`);
    return null;
  }
  // Si solo una está disponible, usar default genérica para la otra
  return {
    headingName: headingFamily ?? "Inter",
    headingImport: headingImport ?? "Inter",
    bodyName: bodyFamily ?? "Inter",
    bodyImport: bodyImport ?? "Inter",
  };
}

function applyFontsToLayout(fonts: FontPair): boolean {
  if (!existsSync(ROOT_LAYOUT)) {
    console.log("[apply-brand] root layout.tsx no existe, skip");
    return false;
  }
  const content = readFileSync(ROOT_LAYOUT, "utf-8");

  // Detectar si ya está aplicado (por idempotencia)
  if (content.includes(`{ ${fonts.headingImport}, ${fonts.bodyImport} }`) ||
      content.includes(`{ ${fonts.headingImport} }`) && content.includes(fonts.bodyImport)) {
    console.log("[apply-brand] layout.tsx ya tiene fonts del cliente, skip");
    return false;
  }

  // Reemplaza el bloque de imports + las declaraciones
  // Patrón: import { Raleway, Nunito_Sans } from "next/font/google";
  // const raleway = Raleway({ ... }); const nunito = Nunito_Sans({ ... });
  // <body className={`${raleway.variable} ${nunito.variable} font-body antialiased`}>
  const newImport = `import { ${fonts.headingImport}, ${fonts.bodyImport} } from "next/font/google";`;
  const newDecl = `const heading = ${fonts.headingImport}({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = ${fonts.bodyImport}({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});`;

  let newContent = content
    .replace(/import\s*\{[^}]+\}\s*from\s*"next\/font\/google";/, newImport)
    .replace(
      /const\s+\w+\s*=\s*\w+\([\s\S]+?\);\s*const\s+\w+\s*=\s*\w+\([\s\S]+?\);/,
      newDecl,
    )
    .replace(/\$\{\w+\.variable\}\s*\$\{\w+\.variable\}/, "${heading.variable} ${body.variable}");

  if (newContent === content) {
    console.log("[apply-brand] layout.tsx sin cambios (regex no matcheó)");
    return false;
  }
  writeFileSync(ROOT_LAYOUT, newContent);
  console.log(`[apply-brand] layout.tsx aplicado: heading="${fonts.headingName}" + body="${fonts.bodyName}"`);
  return true;
}

function main(): void {
  if (!existsSync(BRAND)) {
    console.error(`[apply-brand] ${BRAND} no existe. Correr /web-capture primero.`);
    process.exit(1);
  }

  const palette = loadPalette();
  if (palette.length === 0) {
    console.log("[apply-brand] palette.json vacía, skip paleta");
  } else {
    const tokens = pickBrandTokens(palette);
    if (!tokens) {
      console.log("[apply-brand] palette.json no tiene candidatos válidos (necesita color con saturation>0.3 y count>30), skip");
    } else {
      applyPaletteToCss(tokens);
    }
  }

  const typoPath = resolve(BRAND, "typography.json");
  if (!existsSync(typoPath)) {
    console.log("[apply-brand] typography.json no existe, skip fonts");
  } else {
    const typo = JSON.parse(readFileSync(typoPath, "utf-8")) as TypographyFile;
    const fonts = pickFonts(typo);
    if (fonts) applyFontsToLayout(fonts);
  }

  console.log("[apply-brand] done");
}

main();
