# `prices/` — Lista de precios de servicios

## Propósito

Items de tarifa de un servicio (estética, peluquería, masajes, etc.). Renderizado en `/tarifas` y editable desde `/admin/prices`. Solo activo si `industry=estetica`/`peluqueria`.

## Por qué separado de `menu/`

Ver `menu/IA-docs.md § Por qué separado` — categorías y campos específicos del rubro de servicios (`isFromPrice`, `durationMinutes`).

## Shape canónico (`domain/IPrice.ts`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `category` | PriceCategory | 1 de 8: facial, corporal, masaje, manos-pies, depilacion, maquillaje, bronceado, otro |
| `title` | LocalizedText | Nombre del tratamiento bilingüe |
| `description` | LocalizedText? | Detalle opcional |
| `price` | number \| null | EUR sin símbolo |
| `isFromPrice` | boolean | `true` muestra "Desde X€" en vez de exacto |
| `priceOverride` | LocalizedText? | "Bono 6 sesiones", "Consultar" |
| `durationMinutes` | number? | 0 o ausente = no se muestra |
| `order` | number | Posición dentro de su categoría |
| `active` | boolean | Visibilidad pública |

## Funciones (`MongoPriceRepo.ts`)

Análogas a `menu/`: `listActivePrices`, `listPrices`, `getPriceById`, `createPrice`, `updatePrice`, `deletePrice`, `hasAnyPrices`.

## Para el agente: categorización inteligente

Mismo principio que `menu/`: NO keyword regex. Usá contexto:

- "Tratamiento facial básico" → `facial`
- "Masaje deportivo" → `masaje`
- "Depilación piernas completas" → `depilacion`
- "Maquillaje novia" → `maquillaje`
- "Pedicura semipermanente" → `manos-pies`
- "Drenaje linfático" → `corporal`
- "Bronceado UV" → `bronceado`

Si no encaja → `otro`.

`isFromPrice=true` cuando el original dice "Desde 70€" o el precio es variable. Sino `false` (exacto).

## Página pública

`src/app/[locale]/tarifas/page.tsx` lee `listActivePrices()` y renderiza agrupado. Genérico.
