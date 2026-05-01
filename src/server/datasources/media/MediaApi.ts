import { del, list, put } from "@vercel/blob";
import sharp from "sharp";

import { getCollection } from "@/server/shared/MongoService";

import type {
  IMedia,
  ImageFormat,
  ImageQuality,
  ImageVariantKey,
  MediaCategory,
} from "./domain/IMedia";

/**
 * Presets de calidad. OG y thumb se mantienen estándar siempre (no aporta más).
 * El que escala es card (catálogos) y hero (above the fold, fotos importantes).
 */
const QUALITY_PRESETS: Record<
  ImageQuality,
  {
    widths: Record<ImageVariantKey, { width: number; height?: number }>;
    webpQ: number;
    jpgQ: number;
  }
> = {
  standard: {
    widths: {
      thumb: { width: 400 },
      card: { width: 800 },
      hero: { width: 1600 },
      og: { width: 1200, height: 630 },
    },
    webpQ: 85,
    jpgQ: 82,
  },
  high: {
    widths: {
      thumb: { width: 400 },
      card: { width: 1000 },
      hero: { width: 2400 },
      og: { width: 1200, height: 630 },
    },
    webpQ: 92,
    jpgQ: 90,
  },
  max: {
    widths: {
      thumb: { width: 400 },
      card: { width: 1200 },
      hero: { width: 3200 },
      og: { width: 1200, height: 630 },
    },
    webpQ: 95,
    jpgQ: 95,
  },
};

interface UploadInput {
  /** Buffer del archivo crudo (cualquier formato leíble por sharp). */
  file: Buffer;
  /** Slug estable del slot (ej: "hero-main"). */
  key: string;
  /** Nombre amigable que ve el cliente (ej: "Foto principal"). */
  label: string;
  /** Texto alt bilingüe. */
  alt: { es: string; en: string };
  category: MediaCategory;
  /** Nivel de calidad. Default "standard". */
  quality?: ImageQuality;
  /** Paths donde se usa la imagen (opcional, para auditoría). */
  usedIn?: string[];
}

/**
 * Procesa imagen → 8 variantes (4 widths × 2 formats) en Vercel Blob → upsert en Mongo.
 * Idempotente por `key`: subir 2x la misma key reemplaza las variantes existentes.
 */
export async function uploadMedia(input: UploadInput): Promise<IMedia> {
  const {
    file,
    key,
    label,
    alt,
    category,
    quality = "standard",
    usedIn = [],
  } = input;
  const preset = QUALITY_PRESETS[quality];

  const meta = await sharp(file).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Imagen sin dimensiones legibles");
  }

  const urls: Record<ImageFormat, Record<ImageVariantKey, string>> = {
    webp: {} as Record<ImageVariantKey, string>,
    jpg: {} as Record<ImageVariantKey, string>,
  };

  const variantEntries = Object.entries(preset.widths) as [
    ImageVariantKey,
    (typeof preset.widths)[ImageVariantKey],
  ][];

  // Leer doc previo para luego borrar SOLO sus URLs específicas (no por prefix
  // de Blob, que se llevaría puestas variantes recién subidas si hay 2 saves
  // concurrentes del mismo key — race condition resuelta así).
  const collectionForOld = await getCollection<IMedia>("media");
  const previous = await collectionForOld.findOne({ key });
  const oldUrls: string[] = previous
    ? Object.values(previous.variants).flatMap((fmt) => Object.values(fmt))
    : [];

  // Timestamp en path → cada save genera URLs únicas → bypass del cache immutable del browser.
  const v = Date.now();

  const formats: { format: ImageFormat; quality: number }[] = [
    { format: "webp", quality: preset.webpQ },
    { format: "jpg", quality: preset.jpgQ },
  ];

  await Promise.all(
    formats.flatMap(({ format, quality: q }) =>
      variantEntries.map(async ([variant, dims]) => {
        let pipeline = sharp(file).resize({
          width: dims.width,
          height: dims.height,
          fit: dims.height ? "cover" : "inside",
          withoutEnlargement: true,
        });
        pipeline =
          format === "webp"
            ? pipeline.webp({ quality: q })
            : pipeline.jpeg({ quality: q, mozjpeg: true });

        const buf = await pipeline.toBuffer();
        const blob = await put(`media/${key}/${v}-${variant}.${format}`, buf, {
          access: "public",
          contentType: format === "webp" ? "image/webp" : "image/jpeg",
          cacheControlMaxAge: 31536000,
        });
        urls[format][variant] = blob.url;
      }),
    ),
  );

  // Blur placeholder 10x10 base64 (next/image placeholder="blur")
  const blurBuf = await sharp(file)
    .resize(10)
    .jpeg({ quality: 50 })
    .toBuffer();
  const blurDataURL = `data:image/jpeg;base64,${blurBuf.toString("base64")}`;

  const collection = await getCollection<IMedia>("media");
  const now = new Date();
  const setData: Omit<IMedia, "_id" | "uploadedAt"> = {
    key,
    label,
    alt,
    category,
    quality,
    variants: urls,
    width: meta.width,
    height: meta.height,
    aspectRatio: `${meta.width}/${meta.height}`,
    blurDataURL,
    usedIn,
    updatedAt: now,
  };

  await collection.findOneAndUpdate(
    { key },
    { $set: setData, $setOnInsert: { uploadedAt: now } },
    { upsert: true, returnDocument: "after" },
  );

  // Cleanup: borrar las URLs viejas (las del doc previo) DESPUÉS del upsert.
  // Errores silenciados — el sitio ya apunta a las URLs nuevas; un orphan
  // ocasional en Blob no afecta correctness, solo storage marginal.
  if (oldUrls.length > 0) {
    await Promise.allSettled(oldUrls.map((u) => del(u)));
  }

  return { ...setData, uploadedAt: now } as IMedia;
}

/** Lee un media por key. Server-side, en pages. */
export async function getMediaByKey(key: string): Promise<IMedia | null> {
  const collection = await getCollection<IMedia>("media");
  return collection.findOne({ key });
}

/** Borra todas las variantes en Blob + el doc Mongo. */
export async function deleteMedia(key: string): Promise<void> {
  const { blobs } = await list({ prefix: `media/${key}/` });
  if (blobs.length > 0) {
    await Promise.all(blobs.map((b) => del(b.url)));
  }
  const collection = await getCollection<IMedia>("media");
  await collection.deleteOne({ key });
}

/** Lista todos los media (para admin grid). */
export async function listMedia(): Promise<IMedia[]> {
  const collection = await getCollection<IMedia>("media");
  return collection.find().sort({ updatedAt: -1 }).toArray();
}

/**
 * Copia el contenido de un media existente a otra key. Descarga la variante
 * "hero" (full size) del source, la reprocesa con sharp en el dest. Cada slot
 * queda independiente — editar el source después NO afecta al dest.
 */
export async function copyMediaFromKey(input: {
  destKey: string;
  destLabel: string;
  sourceKey: string;
  alt: { es: string; en: string };
  category: MediaCategory;
  quality?: ImageQuality;
  usedIn?: string[];
}): Promise<IMedia> {
  const {
    destKey,
    destLabel,
    sourceKey,
    alt,
    category,
    quality,
    usedIn = [],
  } = input;
  const source = await getMediaByKey(sourceKey);
  if (!source) throw new Error(`Source media "${sourceKey}" no existe`);

  const sourceUrl = source.variants.webp.hero;
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`No pude descargar ${sourceUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  return uploadMedia({
    file: buffer,
    key: destKey,
    label: destLabel,
    alt,
    category,
    quality,
    usedIn,
  });
}

/**
 * Reprocesa una imagen ya existente con un nuevo nivel de calidad. Útil cuando
 * el cliente quiere subir/bajar la calidad sin tener que re-uploadear el archivo.
 * Toma la variante `hero` actual (la más grande disponible) y la corre por
 * uploadMedia de nuevo con el preset nuevo. Hereda label/alt/category/usedIn.
 */
export async function reprocessMediaQuality(
  key: string,
  quality: ImageQuality,
): Promise<IMedia> {
  const current = await getMediaByKey(key);
  if (!current) throw new Error(`Media "${key}" no existe`);

  const sourceUrl = current.variants.webp.hero;
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`No pude descargar ${sourceUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  return uploadMedia({
    file: buffer,
    key,
    label: current.label,
    alt: current.alt,
    category: current.category,
    quality,
    usedIn: current.usedIn,
  });
}

/** Actualiza solo metadata (alt, category, usedIn) sin reprocesar imagen. */
export async function updateMediaMeta(
  key: string,
  patch: Partial<Pick<IMedia, "alt" | "category" | "usedIn">>,
): Promise<IMedia | null> {
  const collection = await getCollection<IMedia>("media");
  const result = await collection.findOneAndUpdate(
    { key },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result as IMedia | null;
}
