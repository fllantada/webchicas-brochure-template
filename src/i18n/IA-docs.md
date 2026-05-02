# `src/i18n/` — Configuración next-intl

## Propósito

Setup centralizado de internacionalización: lista de locales, routing, request config para Server Components. Consumido por middleware + layout.

## Archivos

| File | Responsabilidad |
|------|-----------------|
| `locales.ts` | Lista canónica de `LOCALES` + `Locale` type + helper `pickLocale(path)` |
| `routing.ts` | `createNavigation` config: locales, defaultLocale, prefix |
| `request.ts` | `getRequestConfig` que carga `messages/{locale}.json` por request |

## Decisión: prefix locale en URL

`/es/...` y `/en/...` son URLs distintas (no usar locale por header/cookie):
- SEO mejor (Google indexa cada idioma como página separada).
- Compartible (link a `/en/contacto` siempre va a la versión EN).
- Hreflang explícito en metadata por idioma.

Default locale (`es`) NO tiene prefix opcional — se decide en `routing.ts` según preferencia del cliente. Por default sí lo tiene (`/es/...`) para coherencia con i18n agresivo.

## Para el agente

Cuando agregás un idioma nuevo:

1. `LOCALES` array de `locales.ts` → agregar el código.
2. `routing.ts` → agregar al `locales` config.
3. `messages/{nuevo}.json` → crear con la misma shape que es.json/en.json.
4. Verificar `LocalizedText` type (en `IContact`, `IMenuItem`, etc.) — si está derivado de `LOCALES` queda automático, sino agregar manualmente.

## Routing

URLs estándar del template:
- `/{locale}` → home
- `/{locale}/contacto` → contacto
- `/{locale}/carta` → menú (si activo)
- `/{locale}/tarifas` → precios (si activo)
- `/{locale}/rgpd`, `/{locale}/cookies` → legales

`/admin/*` NO tiene locale prefix — el admin es siempre español (o el idioma del admin user). El admin form muestra inputs bilingües (`{ es, en }`) para LocalizedText fields.
