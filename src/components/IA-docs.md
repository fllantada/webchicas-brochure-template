# `src/components/` — Componentes layout/UI compartidos

## Propósito

Componentes que usan múltiples páginas del template. Cada uno autocontenido (sigue gold rule de autocontención fractal del workspace).

## Estructura

```
src/components/
├── layout/
│   ├── Header/        ← SC + CC, lee contact + nav links + LanguageSelector
│   └── Footer/        ← lee contact + brand + nav links
├── ui/
│   ├── MobileStickyCTA/  ← CTA fijo bottom en mobile
│   └── LanguageSelector/ ← dropdown bandera + locale code
```

## Header

Patrón **SC → CC**:
- `Header/HeaderSC.tsx` (Server) — fetcheea contact + brand desde Mongo + messages
- `Header/HeaderCC.tsx` (Client) — UI con sticky behavior + scroll detection + mobile drawer

Renderiza nav dinámicamente: solo links a páginas con datos (`hasAnyMenuItems()` → muestra "/carta", `hasAnyPrices()` → muestra "/tarifas"). Coherente con `ADMIN_UI_AVAILABLE` flags.

## Footer

Single component (no necesita SC/CC split). Lee:
- `getContact()` para tel/email/social
- `getTranslations("footer")` para brand_name, brand_description, labels

Render condicional: redes sociales que están vacías en Mongo NO se muestran (regla simetría).

## MobileStickyCTA

Aparece sticky en bottom solo en mobile (md:hidden). Botón principal de "Reservar" o "WhatsApp" según contact.

## LanguageSelector

Dropdown con bandera del locale activo + lista de alternativas. Click → navega a `/{otroLocale}/{currentPath}`. Usado en Header.

## Para el agente

Estos componentes **no se tocan al migrar** — el template los provee genéricos. Lo que cambia entre clientes:
- Brand colors (CSS vars en globals.css → todos los componentes los heredan)
- Brand name + description (messages.json → consumido por Header/Footer)
- Contact (Mongo → consumido)
- Nav links (dinámicos según `hasAny*Items()` + `ADMIN_UI_AVAILABLE`)

Si un cliente necesita un componente custom (ej. banner de ofertas), agregalo a `src/components/{nombre}/` o directamente en la página donde se usa, NO modifiques los layouts compartidos.
