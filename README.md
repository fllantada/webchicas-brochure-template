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

## Validado en

- `estetica-shena` (2026-05-01) — primer cliente que usó este patrón completo.
- Pendiente: validar el flujo `/migrate` → template → admin en `elcuerno-tapas`.

## License

Propietario — uso interno de WebChicas / Dev-Fran.
