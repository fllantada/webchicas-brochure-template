# REBRAND-CHECKLIST

Pasos a seguir tras clonar este template para un cliente nuevo. Marcá los completados.

## 1. Variables de entorno (`.env.local`)

Copiar `.env.example` a `.env.local` y completar:

```bash
# Marca
NEXT_PUBLIC_BRAND_NAME="Nombre del Cliente"        # Ej: "Estética Shena"
NEXT_PUBLIC_BRAND_LOGO_PATH=                       # /images/logos/cliente.png — vacío = muestra texto
NEXT_PUBLIC_BRAND_DESCRIPTION="Descripción corta"  # Para JSON-LD + OG
NEXT_PUBLIC_BRAND_COUNTRY=ES                       # Código ISO país (Schema.org)
NEXT_PUBLIC_SCHEMA_TYPE=LocalBusiness              # O BeautySalon, Restaurant, ProfessionalService, etc.
NEXT_PUBLIC_FRONTEND_URL=https://cliente.com       # Dominio real (NO localhost en prod)

# Logs
LOGTAIL_SOURCE=cliente                             # Slug único — filtra logs en BetterStack

# Bases compartidas (no cambiar a menos que el cliente tenga su propio plan)
SENDGRID_API_KEY=<agency-level-key>                # Compartida — viene de WebChicas .env.local
SENDGRID_FROM_EMAIL=noreply@dev-fran.com
LOGTAIL_TOKEN=<agency-level-token>
LOGTAIL_HOST=https://s2409654.eu-fsn-3.betterstackdata.com

# Por cliente (provisionados por /repo-setup)
MONGODB_URI=mongodb+srv://...                      # Cluster compartido, DB nueva
MONGODB_DB_NAME=clientecms                         # `{slug}cms`
JWT_SECRET=<openssl rand -hex 32>                  # Único por cliente
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...           # Vercel Blob store por cliente

# Admin inicial (para seedAdminUser)
ADMIN_EMAIL=cliente@dominio.com
ADMIN_NAME="Nombre del cliente"
```

- [ ] Vars completas en `.env.local` (no committear)
- [ ] Mismas vars cargadas en Vercel project (`vercel env add ...`)

## 2. Marca visual

- [ ] **Paleta**: editar `src/app/globals.css` — sección `@theme` (CSS vars `--color-bg`, `--color-ink`, `--color-accent`, etc.)
- [ ] **Tipografías**: actualizar `next/font` imports en `src/app/[locale]/layout.tsx`
- [ ] **Logo**: subir `public/images/logos/{slug}.png` y setear `NEXT_PUBLIC_BRAND_LOGO_PATH=/images/logos/{slug}.png`
- [ ] **Favicon**: reemplazar `src/app/icon.png`
- [ ] **OG image**: subir `public/images/og-home.jpg` (1200×630, < 300 KB)

## 3. Datos iniciales (vía Mongo seed)

```bash
ADMIN_EMAIL=cliente@dominio.com ADMIN_NAME="..." \
  npx tsx -e 'import("./src/server/datasources/auth/seed").then(m=>m.seedAdminUser())'
```

- [ ] Admin user creado en Mongo

## 4. Login al admin

```bash
npm run dev
# Abrir http://localhost:3000/admin/login
# Pedir magic link al email del admin → llega por SendGrid
```

- [ ] Magic link recibido → verificación OK → redirige a `/admin/dashboard`

## 5. Cargar contenido inicial vía admin

- [ ] **Datos de contacto** (`/admin/contact`): teléfono, email, dirección, horarios, redes, Booksy
- [ ] **Imágenes hero/galería** (`/admin/media`): subir hero principal con key `hero-main`
- [ ] **Lista de precios** (`/admin/prices`): si aplica al rubro

## 6. Páginas adicionales (custom por industria)

Si el cliente necesita páginas extra (servicios, galería, tarifas, instalaciones):

- [ ] Crear bajo `src/app/[locale]/{nombre}/page.tsx`
- [ ] Sumar al NAV_ITEMS de `src/components/layout/Header/index.tsx`
- [ ] Sumar a FOOTER_LINKS de `src/components/layout/Footer/index.tsx` y a `src/messages/{es,en}.json` namespace `nav`
- [ ] Sumar al `src/app/sitemap.ts`

## 7. Deploy

```bash
vercel link
vercel env pull .env.local                # opcional, sync con Vercel
vercel deploy --prod
```

- [ ] Deploy preview probado en URL `*.vercel.app`
- [ ] Dominio custom apuntando (Cloudflare DNS)
- [ ] OG WhatsApp verificado (https://developers.facebook.com/tools/debug)
- [ ] Mandar al cliente: URL pública + URL admin + email para magic link

## 8. Mantenimiento

Mensual:
- [ ] Revisar logs en BetterStack (`source: {slug}`)
- [ ] Verificar que el admin sigue accesible
- [ ] Renovar API keys vencidas (CLI, SendGrid, etc.)
