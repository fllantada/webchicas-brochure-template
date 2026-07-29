# webchicas-brochure-template

Template canónico para sitios brochure de WebChicas — **Next.js 16 autoadministrable de fábrica**.

Cada cliente que arranca con `/migrate` o `/repo-setup brochure` parte de este repo (clonado vía `gh repo create --template fllantada/webchicas-brochure-template`).

## Qué viene incluido

- **Next.js 16** + React 19 + Tailwind v4 + next-intl (es/en)
- **Admin panel** (`/admin`) con magic link auth (MongoDB + JWT + SendGrid)
- **Editores listos para usar**:
  - 📞 Contacto (teléfono, email, dirección bilingüe, mapa, horarios, redes, Booksy)
  - 💰 Precios (CRUD por categoría, bilingüe, vista previa)
  - 🖼️ Imágenes (upload, crop, calidad, biblioteca, Vercel Blob + sharp)
- **Páginas estándar**: Home, Contacto, RGPD, Cookies (todas leen del admin)
- **Consent de cookies RGPD/AEPD** de fábrica: banner + gating de Clarity/Meta Pixel/GA4 (ver sección abajo)
- **JSON-LD dinámico** desde datos del admin (LocalBusiness por default)
- **Sitemap + robots.txt** dinámicos
- **OG metadata** correcta (1200×630, peso < 300KB)

## Cómo usarlo

> **NO clones este repo directamente.** Está pensado para ser usado como **template**: cuando creás un cliente nuevo, GitHub copia el contenido sin historial.

```bash
# Crear cliente nuevo desde este template
gh repo create fllantada/{cliente} --private \
  --template fllantada/webchicas-brochure-template --clone

cd {cliente}
cp .env.example .env.local
# Llenar las vars — ver REBRAND-CHECKLIST.md
npm install
npm run dev
```

Después seguir el [REBRAND-CHECKLIST](./REBRAND-CHECKLIST.md) para personalizar marca, contenido y deploy.

## Stack

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | Next.js 16 (App Router) | params=Promise, caching explícito |
| UI | Tailwind v4 (CSS-first) | `@theme` block, paleta via CSS vars |
| i18n | next-intl | Default es + en (configurable) |
| State (CC) | Zustand | useShallow obligatorio |
| Auth | Magic link JWT | SendGrid agency-level (`noreply@dev-fran.com`) |
| DB | MongoDB Atlas | 1 DB por cliente, cluster compartido |
| Imágenes | Vercel Blob + sharp | 8 variantes (4 widths × 2 formats), placeholder blur |
| Logs | BetterStack | source = LOGTAIL_SOURCE |
| Deploy | Vercel | metadataBase = NEXT_PUBLIC_FRONTEND_URL |

## Filosofía de uso

El template provee la **base autoadministrable mínima** para cualquier negocio brochure. NO incluye:
- Páginas específicas de industria (servicios, galería, tarifas) → cada cliente las añade según su rubro
- Paleta o tipografía concreta → el cliente personaliza `globals.css` y elige fonts
- Contenido → todo se carga via `/admin` después del primer deploy

Si después de usar el template aparece un patrón nuevo que se repite en 2+ clientes, distillarlo y meterlo acá.

## Consent de cookies (RGPD / AEPD)

El template trae el sistema completo en `src/components/analytics/` y se controla 100% por env vars — sin tocar código:

| Env var | Efecto |
|---------|--------|
| `NEXT_PUBLIC_COOKIE_CONSENT` | **Switch maestro.** Sin setear o `required` → banner + trackers solo tras "Aceptar" (default seguro, clientes UE). `off` → sin banner, trackers cargan directo (clientes fuera de la UE, ej. Argentina). |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Activa Microsoft Clarity |
| `NEXT_PUBLIC_META_PIXEL_ID` | Activa Meta Pixel |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Activa Google Analytics 4 |

Comportamiento:

- **Sin ningún tracker configurado no hay banner** (nada que consentir — cookies técnicas no lo requieren).
- La decisión vive en la cookie first-party `cookie_consent` (6 meses), **legible desde el server**: cualquier evento **Meta CAPI** server-side DEBE gatearse con `hasMarketingConsent()` de `src/server/shared/consent.ts` — ningún evento sin consentimiento.
- **Consent versionado por scope**: la cookie guarda la decisión + los trackers vigentes (`accepted:cm`). Si el cliente activa un tracker nuevo, se vuelve a preguntar — el consentimiento viejo no cubre la finalidad nueva.
- El banner **nombra a los terceros activos** (Microsoft/Meta/Google) en la primera capa, y Aceptar/Rechazar tienen el mismo peso visual (criterio AEPD + WCAG 1.4.11).
- La página `/cookies` lista solo los trackers activos del cliente y permite cambiar la decisión; **al retirar se borran las cookies ya instaladas** (`_ga`, `_fbp`, `_clarity`…) — criterio AEPD: dejar de cargar no alcanza. En modo `off` el copy se bifurca para no describir un aviso que no existe.
- Los trackers solo cargan en **producción real** (`NEXT_PUBLIC_VERCEL_ENV === "production"`): ni en dev ni en previews (los previews corren con `NODE_ENV=production` y contaminarían los datos del cliente). Para probar el flujo en local: `NEXT_PUBLIC_VERCEL_ENV=production` en `.env.local`.
- El banner publica su alto en la CSS var `--cookie-banner-h`; el `MobileStickyCTA` la usa para apilarse encima y no quedar tapado.
- Como todas las vars son `NEXT_PUBLIC_*`, se **inlinean en build**: cambiarlas exige redeploy (no toman efecto solo desde el dashboard de Vercel).

Estructura (autocontención fractal): `src/lib/consent-contract.ts` (contrato puro compartido browser/server) · `src/components/analytics/Analytics/` (orquestador + `components/` con banner y trackers) · `src/app/[locale]/cookies/components/ConsentPreferences/` (bloque "tu decisión") · `src/server/shared/consent.ts` (gate CAPI).

**Regla de oro**: si el sitio del cliente es para público de la UE, NUNCA setear `off`. El texto viejo "al continuar navegando aceptás" está prohibido por la AEPD — el template ya no lo usa.

## Validado en

- `estetica-shena` (2026-05-01) — primer cliente que usó este patrón completo.
- Pendiente: validar el flujo `/migrate` → template → admin en `elcuerno-tapas`.

## License

Propietario — uso interno de WebChicas / Dev-Fran.
