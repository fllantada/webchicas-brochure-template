# `contact/` — Datos de contacto del negocio

## Propósito

Single document Mongo (key=`"main"`) con todos los datos de contacto del negocio. Renderizado en footer, contacto page, header CTA, schema.org, página de servicios. Editable desde `/admin/contact`.

## Por qué single doc

Decisión KISS: cada negocio tiene UN contacto principal. Multi-localización lo manejaríamos con un `branches` array en `IContact` cuando aparezca el primer cliente con sucursales — YAGNI hasta entonces.

## Shape canónico (`domain/IContact.ts`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `phone` | string | Display format: `"+34 647 12 39 76"` |
| `phoneRaw` | string | E.164 sin signos: `"34647123976"` (para `tel:` y `wa.me/`) |
| `whatsapp` | string | E.164 sin signos. Puede ser igual a phoneRaw. |
| `email` | string | Email principal del negocio |
| `addressStreet` | LocalizedText | "C/ Rubí 8 bajos" |
| `addressCity` | LocalizedText | "Palma de Mallorca, 07001" |
| `mapEmbedUrl` | string | URL del iframe `src` de Google Maps embed (paste desde "Compartir > Insertar mapa") |
| `schedule` | ScheduleItem[] | Items de horario, cada uno bilingüe |
| `social.facebook` | string | URL de Facebook page (vacío = no se muestra) |
| `social.instagram` | string | URL de Instagram |
| `social.tripadvisor` | string | URL de TripAdvisor (alta señal para gastronomía/turismo) |
| `booksyUrl` | string | URL de Booksy (botón "Reservar"). Vacío = ocultar CTA |

## Decisión bilingüe (LocalizedText)

`addressStreet`/`addressCity` son bilingües por si la traducción cambia ("C/" → "Street"). En la práctica es raro — pero la shape lo permite sin migración futura.

## Funciones (`MongoContactRepo.ts`)

| Función | Uso |
|---------|-----|
| `getContact(): Promise<IContact>` | Lee el doc o devuelve `EMPTY_CONTACT` si no existe (no crashea frontend) |
| `updateContact(data)` | Upsert por `key="main"`. Setea `updatedAt`. |

`getContact` está envuelto en `cache()` de React para reads idempotentes en Server Components.

## Para el agente: seedear contacto del cliente

Desde un script ad-hoc en `{cliente}/scripts/seed-contact.ts`:

```ts
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { updateContact, getContact } from "@/server/datasources/contact/MongoContactRepo";

async function main() {
  const current = await getContact();
  if (current.phone) {
    console.log("Contact ya cargado, skip");
    return;
  }
  // Transformar capture/contact.json → IContact shape
  await updateContact({
    phone: "...",
    phoneRaw: "...",
    whatsapp: "...",
    email: "...",
    addressStreet: { es: "...", en: "..." },
    addressCity: { es: "...", en: "..." },
    mapEmbedUrl: "...",
    schedule: [],
    social: { facebook: "", instagram: "", tripadvisor: "" },
    booksyUrl: "",
  });
}
main();
```

## Reglas de UX (admin)

- Si el cliente NO usa Booksy: dejar el campo vacío. El sitio público oculta el CTA "Reservar" automáticamente.
- Si una red social está vacía: el footer NO renderiza ese ícono. NO autoadministrar lo que no se ve.
