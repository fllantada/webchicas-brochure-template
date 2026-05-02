# `menu/` — Carta gastronómica

## Propósito

Items del menú de un restaurante/bar/café. Renderizado en `/carta` (página pública agrupada por categoría) y editable desde `/admin/menu`. Solo activo si `industry=restaurante` o similar.

## Por qué separado de `prices/`

- **Categorías distintas**: gastronomía (16 cats: tapas, ensaladas, entrantes, pescados, carnes, pastas, arroces, postres, bebidas-{cerveza,vino,cocteles,refrescos,cafe}, menu-ninos, menu-degustacion, otro) vs estética (8 cats: facial, corporal, masaje, etc.).
- **`priceNote`**: específico de gastronomía (`"por persona"`, `"(2 pers.)"`, `"(mín. 2 pers.)"`). Estética NO lo usa.
- **`durationMinutes`** existe en prices, NO en menu (un plato no tiene "duración").
- **`isFromPrice` ("Desde X€")** existe en prices, NO en menu (un plato típicamente tiene precio fijo).

## Shape canónico (`domain/IMenuItem.ts`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `category` | MenuCategory | 1 de las 16 categorías. Hardcoded en `MENU_CATEGORIES`. |
| `title` | LocalizedText | Nombre del plato/bebida bilingüe |
| `description` | LocalizedText? | Ingredientes, preparación, alergenos. Vacío = no se muestra |
| `price` | number \| null | EUR sin símbolo. `null` muestra "—" |
| `priceNote` | LocalizedText? | "por persona", "(2 pers.)" — bilingüe. Vacío = no se muestra |
| `priceOverride` | LocalizedText? | "Mercado", "Consultar" — reemplaza el numérico |
| `imageKey` | string? | Key del admin/media para foto del plato (futuro feature) |
| `tags` | string[]? | "vegetariano", "sin-gluten", "picante" (no bilingüe — keywords técnicos) |
| `order` | number | Posición dentro de su categoría (asc) |
| `active` | boolean | `false` = oculto al público, visible en admin |

## Funciones (`MongoMenuRepo.ts`)

| Función | Uso |
|---------|-----|
| `listActiveMenuItems()` | Lectura pública (cache). Solo `active=true`, ordenado por categoría + order. |
| `listMenuItems({ includeInactive })` | Lectura admin (todo, incluso inactivos). |
| `getMenuItemById(id)` | Para edit page del admin. |
| `createMenuItem(data: CreateMenuItemInput)` | Crea con `createdAt`/`updatedAt` automáticos. |
| `updateMenuItem(id, patch)` | Patch parcial. |
| `deleteMenuItem(id)` | Borra definitivo. Para ocultar usar `active=false`. |
| `hasAnyMenuItems()` | Idempotencia: skip seed si ya hay datos. |

## Para el agente: categorización inteligente

Cuando seedeás items desde la captura del original, **NO uses keyword regex**. Usá el contexto del rubro:

- Lee la sección donde aparece el item en el original (`H3: "Pan"`, `H3: "Nuestras Tapas"`, `H3: "Carnes a la brasa"`, etc.).
- Mapeá a la categoría más cercana de las 16 con criterio:
  - "Pan", "Aceitunas" → `entrantes` (no es tapa per se, pero es lo más cercano)
  - "6 Tapas Degustación" → `menu-degustacion`
  - "Jamón Ibérico", "Croquetas" → `tapas`
  - "Solomillo a la brasa" → `carnes`
  - "Lubina al horno" → `pescados`
  - "Sangría", "Vino tinto" → `bebidas-vino` o `bebidas-cocteles` según corresponda
  - "Coca-Cola", "Agua" → `bebidas-refrescos`
  - "Tarta de queso" → `postres`
- Si no encaja claro → `otro` (es OK tener algunos en "otro", el cliente recategoriza desde admin después).

## Página pública

`src/app/[locale]/carta/page.tsx` lee `listActiveMenuItems()` y renderiza agrupado por `MENU_CATEGORY_LABELS`. NO se necesita tocar para clientes nuevos — el render es genérico.
