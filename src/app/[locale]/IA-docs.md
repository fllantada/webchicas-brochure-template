# `src/app/[locale]/` — Páginas públicas con i18n

## Propósito

Routing públicas del cliente con prefix de locale. Cada page.tsx es un Server Component que fetchea de Mongo + messages y renderiza.

## Páginas estándar del template

| Path | Función | Consume |
|------|---------|---------|
| `/{locale}` (home) | Hero + secciones narrativas dinámicas + final CTA | media (hero-main + home-sectionN), messages (home.*), contact |
| `/{locale}/contacto` | Form + datos | contact (Mongo) + messages (contact.*) |
| `/{locale}/carta` | Menú agrupado por categoría | listActiveMenuItems() + messages (menu.*) |
| `/{locale}/tarifas` | Precios agrupados | listActivePrices() + messages (prices.*) |
| `/{locale}/rgpd`, `/{locale}/cookies` | Legales | messages (rgpd.*, cookies.*) |

## Convenciones App Router (Next.js 16)

- `params` es `Promise<{ locale: string }>` — siempre `await params` antes de usar.
- `generateMetadata` async + `await getTranslations`.
- `setRequestLocale(locale)` al inicio de cada page para que `useTranslations` funcione.
- `generateStaticParams` para pre-render por locale.

## Render dinámico en home (`page.tsx`)

La home itera `SECTION_SLOTS = ["section1", ..., "section5"]` y renderiza solo los que tienen `home.section{N}.title` no vacío. Patrón:

```tsx
const narrativeSections = SECTION_SLOTS.map((slot) => ({
  slot,
  title: t(`${slot}.title`),
  body: t(`${slot}.body`),
  media: allMedia.find((m) => m.key === `home-${slot}`),
})).filter((s) => s.title.trim().length > 0);
```

Layout alterna `image-left/image-right` con `bg-bg/bg-surface` para ritmo visual. Si una sección no tiene image (no hay `home-sectionN` en Mongo), usa `md:col-span-2` centrado.

## Páginas que NO existen en el template

- Servicios específicos (`/servicios/X`) — un cliente con catálogo amplio puede necesitarlos. El agente los crea como overlay.
- Galería dedicada (`/galeria`) — si el cliente tiene 50+ fotos, mejor página separada que home muy larga.
- Blog/posts — futuro, requiere datasource.

Cuando el original tiene una página única que no encaja, crearla bajo `[locale]/{slug}/page.tsx` con Write — usando componentes del template (`Header`, `Footer`, etc.).

## Para el agente

Al migrar, las páginas estándar (home, contacto, carta, tarifas, rgpd, cookies) **NO se tocan**. El render es genérico — lee de Mongo + messages. Lo que customizás del cliente:

1. **Mongo del cliente** (contact, media, menu/prices) ← seedeado en /web-clone
2. **messages/{es,en}.json del cliente** (copy + secciones narrativas) ← editado en /web-clone
3. **globals.css del cliente** (paleta) ← editado en /web-clone
4. **layout.tsx root del cliente** (fonts) ← editado en /web-clone

Las páginas reaccionan automáticamente.
