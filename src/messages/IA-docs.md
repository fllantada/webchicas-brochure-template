# `src/messages/` — i18n strings (next-intl)

## Propósito

Diccionarios bilingües (ES/EN) de UI chrome + copy de marca del cliente. Consumido por `useTranslations()` (CC) o `getTranslations()` (SC) de next-intl.

## Decisión 2026-05-02 — qué vive acá vs en Mongo

| Tipo | Vive en | Editable cliente |
|------|---------|------------------|
| **UI chrome** (labels nav, "Cargando", errores admin) | `messages/{es,en}.json` | NO (dev escribe una vez) |
| **Copy de marca del cliente** (hero_title, brand_name, descripciones, secciones narrativas) | `messages/{es,en}.json` con valores del cliente | **Vía redeploy** — el cliente edita pidiéndonos cambio. Modelo shena, validado en prod. |
| **Datos del negocio** (tel, email, dirección, horarios, redes) | Mongo `contact` | SÍ desde admin |
| **Items dinámicos** (menú, precios, fotos) | Mongo (menu/prices/media) | SÍ desde admin |

Filosofía: el copy de marca cambia pocas veces al año — vivir en messages.json (con redeploy) es OK + mantiene admin con mínimo de inputs (regla KISS). Si un cliente futuro pide editar copy de marca desde admin, agregar `MongoTextRepo` (pendiente, YAGNI hasta entonces).

## Shape canónico

Top-level keys (namespaces de next-intl):

| Namespace | Contenido | Cambia por cliente |
|-----------|-----------|---------------------|
| `common` | "Saltar al contenido", "Cambiar idioma" | NO (UI chrome) |
| `layout` | title_default, description, og_*, twitter_* | **SÍ** (copy de marca) |
| `nav` | "Inicio", "Carta", etc. + aria-labels | NO (UI chrome) |
| `header` | book_appointment, logo_alt | Mixto (book_appointment a veces) |
| `footer` | brand_name, brand_description + labels | **SÍ** (brand) + UI chrome |
| `home` | hero_*, cta_*, **section1..5.{title,body}** | **SÍ** (todo el copy del cliente) |
| `menu` | page_title, page_description (de la página /carta) | SÍ (intro de la página) |
| `contact` | titles, form labels, subtitles | Mixto |
| `rgpd` | textos legales + responsible_name + cif_value | **SÍ** (datos legales del cliente) |
| `cookies` | textos legales | **SÍ** (responsible_name, email_value) |

## Slots de secciones narrativas (`home.section1..5`)

5 slots disponibles para secciones narrativas dinámicas en la home. Cada uno con `{ title, body }`:

```json
"home": {
  "section1": { "title": "", "body": "" },
  "section2": { "title": "", "body": "" },
  ...
}
```

Vacíos por default. Cuando el agente migra desde un sitio existente, llena estos slots con las secciones narrativas del original (historia, "sobre nosotros", "nuestra cocina", "grupos", etc.). El render dinámico en `src/app/[locale]/page.tsx` itera y renderiza solo los que tienen `title` no vacío.

**No agregar más slots** sin justificación — si un cliente tiene >5 secciones narrativas en home, repensar la arquitectura (probablemente algunas van a páginas separadas).

## Para el agente: aplicar copy del cliente

Después de extraer hero + secciones del capture:

1. Identificá el nombre del negocio (del SEO `<title>` o del hero).
2. Identificá las 3-5 secciones narrativas más significativas del original.
3. Aplicá con Edit a `messages/{es,en}.json`:
   - `layout.title_default`, `layout.og_site_name`, `footer.brand_name` ← nombre del negocio
   - `home.hero_title`, `layout.og_title`, `layout.twitter_title` ← hero title del original
   - `home.hero_subtitle`, `layout.description`, `layout.og_description`, `footer.brand_description` ← hero subtitle
   - `home.section1..5.{title,body}` ← secciones narrativas

**Solo escribir si el valor actual es default** ("Bienvenidos"/"Welcome"/"Sitio web del cliente"/etc.). Si el cliente ya editó manualmente, respetar.

## Idiomas

- Default: `es` (Argentina/España según país).
- `en` para sitios con turismo (Mallorca → ES + EN obligatorio, AR servicios locales → solo ES quizás).
- Si el original es monolingüe ES, llenar `en` con copia del ES — mejor que dejar "Welcome" suelto en /en. El cliente puede pedir traducción real después (redeploy).

## Agregar idioma nuevo

1. Crear `src/messages/{nuevo}.json` con misma estructura.
2. Agregar el código a `src/i18n/locales.ts` y `src/i18n/routing.ts`.
3. Verificar que `LocalizedText` types (en `IContact`, `IMenuItem`, etc.) tienen el nuevo locale.
