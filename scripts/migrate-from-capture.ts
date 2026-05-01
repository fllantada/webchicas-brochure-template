/**
 * Importa los assets genéricos desde `migrations/capture/` al cliente:
 * - images-manifest.json    → Vercel Blob via uploadMedia()
 * - files-manifest.json     → public/ por targetPublicPath
 *
 * NO importa contact / menu / prices — esos son data-shape-specific por
 * industria y los genera el orquestador `/web-clone` como scripts ad-hoc
 * (seed-contact.ts, seed-menu.ts, seed-prices.ts).
 *
 * Idempotente:
 * - Imágenes: uploadMedia() hace upsert por key (re-corrida = no-op si key existe).
 * - Files: cp -f sobreescribe (idempotente).
 *
 * Uso:
 *   npx tsx scripts/migrate-from-capture.ts
 *
 * Si no existe migrations/capture/, falla con mensaje claro.
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  getMediaByKey,
  uploadMedia,
} from "../src/server/datasources/media/MediaApi";
import type {
  ImageQuality,
  MediaCategory,
} from "../src/server/datasources/media/domain/IMedia";

const CAPTURE = resolve(process.cwd(), "migrations/capture");
const PUBLIC = resolve(process.cwd(), "public");

interface ImageManifestEntry {
  /** URL absoluta del sitio original (informativa). */
  originalUrl: string;
  /** Path relativo a `migrations/capture/` (ej. "images/hero/portada.jpg"). */
  localPath: string;
  /** Texto alt extraído del HTML (puede estar vacío). */
  alt: string;
  width: number;
  height: number;
  /** Categoría de Media (hero/gallery/content/icons/about/og/other). */
  category: string;
  /** Sección del HTML donde apareció (ej. "bienvenidos"). */
  section: string;
  /** Slug de la página (ej. "index"). */
  page: string;
}

interface ImagesManifest {
  totalImages: number;
  byPage: Record<string, ImageManifestEntry[]>;
  byCategory: Record<string, string[]>;
}

interface FileManifestEntry {
  originalUrl: string;
  originalPath: string;
  /** Path relativo a `migrations/capture/`. */
  localPath: string;
  /** Path destino dentro de `public/`. */
  targetPublicPath: string;
  sizeBytes: number;
  mimeType: string;
}

interface FilesManifest {
  totalFiles: number;
  files: FileManifestEntry[];
}

/**
 * Determina la quality preset según peso de la imagen.
 * <100KB → standard (web optimized). 100-300KB → high. >300KB → max.
 */
function inferQuality(buffer: Buffer): ImageQuality {
  const kb = buffer.length / 1024;
  if (kb < 100) return "standard";
  if (kb < 300) return "high";
  return "max";
}

/**
 * Genera una key estable para Vercel Blob a partir de la metadata de la imagen.
 *
 * Convenciones (estables — no cambiar sin migrar imágenes existentes):
 * - `hero-main`: primera imagen del array byPage.index con category="hero"
 *   (suele ser la portada del sitio, la más importante)
 * - `hero-{section-slug}`: resto de heros, slugificando section (ej. "el-restaurante" tal cual)
 * - `gallery-{filename-sin-ext}`: galleries (filename del archivo original
 *   suele ser semántico — ej. "tapas.jpg" → "gallery-tapas")
 * - `service-{filename-sin-ext}`: imágenes de servicios
 * - `about-{filename-sin-ext}`: imágenes de "sobre nosotros"
 *
 * `idx` es el contador global de imágenes procesadas para distinguir múltiples
 * heros sin section (heuristic fallback).
 */
function deriveKey(entry: ImageManifestEntry, heroIdx: number): string {
  const filename = entry.localPath.split("/").pop() ?? "img";
  const baseNoExt = filename.replace(/\.[^.]+$/, "");
  if (entry.category === "hero") {
    if (heroIdx === 0) return "hero-main";
    return entry.section ? `hero-${entry.section}` : `hero-${heroIdx}`;
  }
  if (entry.category === "gallery") {
    return `gallery-${baseNoExt}`;
  }
  return `${entry.category}-${baseNoExt}`;
}

/**
 * Categorías de imagen que deben skipearse del media collection:
 * - icons: favicons sociales (FB/IG/etc) — irrelevantes, livianos
 * - logos: van a brand/logos/ del template, no a media (decorativos del template)
 * - other / general bg: si la categoría es ambigua, mejor ignorar
 */
const SKIP_CATEGORIES = new Set(["icons", "logos"]);

async function migrateImages(): Promise<void> {
  const manifestPath = join(CAPTURE, "images/images-manifest.json");
  if (!existsSync(manifestPath)) {
    console.log("[images] no manifest — skip");
    return;
  }
  const manifest: ImagesManifest = JSON.parse(
    readFileSync(manifestPath, "utf-8"),
  );

  let uploaded = 0;
  let skipped = 0;
  let heroIdx = 0;
  for (const pageEntries of Object.values(manifest.byPage)) {
    for (const entry of pageEntries) {
      if (SKIP_CATEGORIES.has(entry.category)) continue;
      const key = deriveKey(entry, heroIdx);
      if (entry.category === "hero") heroIdx++;
      const existing = await getMediaByKey(key);
      if (existing) {
        console.log(`  [skip] ${key} ya existe`);
        skipped++;
        continue;
      }
      const file = readFileSync(join(CAPTURE, entry.localPath));
      const quality = inferQuality(file);
      await uploadMedia({
        file,
        key,
        label: `${entry.category}: ${entry.section || entry.page}`,
        alt: { es: entry.alt, en: "" },
        category: entry.category as MediaCategory,
        quality,
      });
      console.log(
        `  [up]   ${key} (${(file.length / 1024).toFixed(0)} KB, ${quality})`,
      );
      uploaded++;
    }
  }
  console.log(`[images] uploaded=${uploaded}, skipped=${skipped}\n`);
}

async function migrateFiles(): Promise<void> {
  const manifestPath = join(CAPTURE, "files/files-manifest.json");
  if (!existsSync(manifestPath)) {
    console.log("[files] no manifest — skip");
    return;
  }
  const manifest: FilesManifest = JSON.parse(
    readFileSync(manifestPath, "utf-8"),
  );

  for (const f of manifest.files) {
    const src = join(CAPTURE, f.localPath);
    const dst = join(PUBLIC, f.targetPublicPath.replace(/^\//, ""));
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    console.log(
      `  [cp]   ${f.targetPublicPath} (${(f.sizeBytes / 1024).toFixed(0)} KB)`,
    );
  }
  console.log(`[files] copied ${manifest.totalFiles} archivos a public/\n`);
}

async function main(): Promise<void> {
  if (!existsSync(CAPTURE)) {
    console.error(
      `[migrate-from-capture] ${CAPTURE} no existe. Correr /web-capture primero.`,
    );
    process.exit(1);
  }
  console.log(`[migrate-from-capture] importando desde ${CAPTURE}\n`);
  await migrateImages();
  await migrateFiles();
  console.log("[migrate-from-capture] done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate-from-capture] error:", err);
    process.exit(1);
  });
