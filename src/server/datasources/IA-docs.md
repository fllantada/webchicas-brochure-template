# `src/server/datasources/` — Capa de datos

## Propósito

Acceso a Mongo + Vercel Blob + auth. Cada datasource es un módulo autocontenido que el resto del código (admin pages, server components públicos) consume vía sus funciones exportadas. **No tocar Mongo directamente desde fuera de acá** — siempre via los repos.

## Filosofía

- Cada datasource = una colección Mongo + un dominio explícito (`domain/I*.ts`).
- Shape canónico de cada modelo está en `domain/I*.ts` (no inferir de uso). El admin form, el render público y los seeds leen ese shape.
- Funciones exportadas con `cache()` de React para reads idempotentes en Server Components.
- Idempotencia en escrituras: `updateContact()` upsert por key, `createMenuItem()` chequea `hasAnyMenuItems()` antes desde el caller (skip si ya hay datos).

## Datasources disponibles

| Carpeta | Colección Mongo | Función principal |
|---------|------------------|-------------------|
| `auth/` | `users`, `loginCodes` | Magic link auth + admin user seed |
| `contact/` | `contact` (single doc, key=main) | Datos de contacto del negocio |
| `media/` | `media` + Vercel Blob | Imágenes con 8 variantes sharp |
| `menu/` | `menu_items` | Carta gastronómica (restaurantes) |
| `prices/` | `prices` | Lista de precios (estética/peluquería) |

## Para el agente Claude Code (workflow `/web-clone`)

Cuando seedeás Mongo del cliente con datos del original:

| Para llenar... | Llamá... | Desde |
|---------------|----------|-------|
| Contacto | `updateContact(data: Omit<IContact, "_id"\|"key"\|"updatedAt">)` | `contact/MongoContactRepo.ts` |
| Cada item del menú | `createMenuItem(data: CreateMenuItemInput)` por item | `menu/MongoMenuRepo.ts` |
| Cada precio | `createPrice(data: CreatePriceInput)` por item | `prices/MongoPriceRepo.ts` |
| Cada imagen | `uploadMedia({ file, key, label, alt, category, quality })` | `media/MediaApi.ts` |
| Admin user inicial | `seedAdminUser()` (lee `ADMIN_EMAIL`/`ADMIN_NAME` env) | `auth/seed.ts` |

Skip si datos ya existen (idempotencia):
- `getContact().phone` no vacío → skip seed contact
- `hasAnyMenuItems()` true → skip seed menu
- `hasAnyPrices()` true → skip seed prices
- `getMediaByKey(key)` retorna doc → skip upload

## Convenciones estables (no cambiar)

- **Keys de Vercel Blob**: `hero-main`, `hero-{section}`, `gallery-{filename-sin-ext}`, `service-{filename-sin-ext}`, `about-{filename-sin-ext}`. Cambiarlas rompe clientes existentes.
- **Categorías**: `MENU_CATEGORIES` (16) y `PRICE_CATEGORIES` (8) son hardcoded en `domain/`. Los clientes editan platos/precios, NO categorías. Agregar categoría = cambio del template para todos.
- **LocalizedText**: campos bilingües siempre con `{ es: string, en: string }`. Aunque solo se llene es y en quede vacío, mantener la shape.
