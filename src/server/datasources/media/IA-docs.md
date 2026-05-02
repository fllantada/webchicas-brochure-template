# `media/` — Imágenes con Vercel Blob + 8 variantes sharp

## Propósito

Storage central de imágenes del cliente. Cada upload genera 8 variantes (4 widths × 2 formatos: WebP + JPG) preprocesadas con sharp para servirse rápido sin Cloudflare. Editable desde `/admin/media`.

## Por qué Vercel Blob (no Cloudflare R2)

Cliente histórico (estética-shena) reportó downtime de imágenes en Cloudflare durante partidos La Liga (CDN saturado en horario pico). Vercel Blob = storage del mismo provider que el hosting (Vercel) → latencia consistente, sin CDN externo. Trade-off: precio levemente mayor, manejado.

## Shape canónico (`domain/IMedia.ts`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `key` | string | **Identificador estable** entre re-corridas. Convención abajo. |
| `label` | string | Display en `/admin/media` (ej: "Foto principal del local") |
| `alt` | LocalizedText | Alt text para accesibilidad + SEO |
| `category` | MediaCategory | hero \| gallery \| service \| about \| og \| other |
| `variants` | object | `{ webp: { thumb, card, hero, og }, jpg: { thumb, card, hero, og } }` URLs |
| `blurDataURL` | string? | Para `placeholder="blur"` de next/image |
| `quality` | "standard" \| "high" \| "max" | Preset que define resolución de las variantes |

## Convención estable de KEYS (no cambiar nunca)

Cambiar el formato rompería clientes existentes. Dejar fijo:

| Pattern | Uso | Ejemplo |
|---------|-----|---------|
| `hero-main` | Foto principal de la home | (única) |
| `hero-{section-id}` | Heros adicionales por sección | `hero-bienvenidos`, `hero-grupos` |
| `gallery-{filename-sin-ext}` | Galería | `gallery-tapas`, `gallery-postres` |
| `service-{filename-sin-ext}` | Foto de servicio | `service-masaje-1` |
| `about-{filename-sin-ext}` | Sección "sobre nosotros" | `about-equipo` |
| `home-section{N}` | Imagen para slot narrativo de home | `home-section1`, `home-section2` |
| `og-home` | Open Graph | (única) |

## Quality presets

- `standard`: 4 widths chicos (250/400/600/800px). Para galleries con muchas fotos.
- `high`: 4 widths medios (400/600/900/1200px). Default — sirve para hero y mayoría.
- `max`: 4 widths grandes (600/900/1400/1920px). Para hero principal o portadas.

Heurística para el agente al subir desde captura:
- Imagen original < 100KB → `standard`
- 100-300KB → `high`
- > 300KB → `max`

## Funciones (`MediaApi.ts`)

| Función | Uso |
|---------|-----|
| `listMedia()` | Lectura (cached) — usado por home, footer, gallery |
| `getMediaByKey(key)` | Para skip idempotente al re-seedear |
| `uploadMedia({ file, key, label, alt, category, quality })` | Uploadea + genera variantes + persiste doc Mongo |
| `updateMediaMeta(key, patch)` | Edita label/alt sin re-procesar la imagen |
| `deleteMedia(key)` | Borra del Blob y Mongo |

## Skip categories al subir desde captura

NO subir al media collection:
- `category="icons"`: favicons sociales del original (irrelevantes, livianos)
- `category="logos"`: el logo del cliente va en `public/` directamente, no en Blob
