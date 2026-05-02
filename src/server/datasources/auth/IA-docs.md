# `auth/` — Magic link auth + admin user

## Propósito

Sistema de login del admin sin password. El cliente entra a `/admin/login`, ingresa su email, recibe código de 6 dígitos por SendGrid, lo ingresa, queda autenticado vía cookie httpOnly + JWT.

## Por qué magic link (no password)

- Cliente NO-técnico: NO querés que recuerde un password — lo pierde en 30 días.
- NO hay UI para recovery — el "recovery" es pedir otro código.
- 1 admin user por sitio (el dueño). Si necesita acceso compartido, agregar un user con role `editor`.
- Más seguro: passwords débiles son vector común. Códigos one-time son automáticamente más seguros.

## Modelos

### `IUser` (`domain/IUser.ts`)

| Campo | Tipo |
|-------|------|
| `email` | string (unique) |
| `name` | string |
| `role` | `"admin"` \| `"editor"` |
| `createdAt` | Date |

Solo `admin` y `editor` pueden hacer mutations. `editor` no puede borrar usuarios (futuro).

### `ILoginCode` (`domain/ILoginCode.ts`)

| Campo | Tipo |
|-------|------|
| `email` | string |
| `code` | string (6 dígitos) |
| `expiresAt` | Date (10 min desde creación) |
| `usedAt` | Date? |

Códigos auto-expiran. Si se usa, queda marcado para no reutilizarse.

## Funciones (`AuthRepository.ts` + `AuthApi.ts` + `seed.ts`)

| Función | Uso |
|---------|-----|
| `getUserByEmail(email)` | Login flow |
| `createLoginCode(email)` | `/api/auth/request-code` lo invoca + envía email |
| `verifyLoginCode(email, code)` | `/api/login` lo invoca + setea cookie JWT |
| `seedAdminUser()` | Setup inicial: lee `ADMIN_EMAIL` + `ADMIN_NAME` env, crea user con role admin si no existe |

## Para el agente: setup admin user inicial (Fase 1 del `/migrate`)

Después de clonar el template + setear `.env.local` con `ADMIN_EMAIL` y `ADMIN_NAME`, escribí un script ad-hoc o invocá inline:

```bash
cd {cliente}
ADMIN_EMAIL=cliente@dominio.com ADMIN_NAME="Nombre Cliente" \
  npx tsx -e 'import("./src/server/datasources/auth/seed").then(m => m.seedAdminUser())'
```

Idempotente: si el email ya existe en `users`, no hace nada.

## Verificar admin funciona (Validación 1.5)

1. `npm run dev` levanta sin errores.
2. Visitar `localhost:3000/admin/login`.
3. Ingresar email del admin → llega código por SendGrid (verificar con `SENDGRID_API_KEY` configurada).
4. Ingresar código → redirige a `/admin/dashboard`.

Si SendGrid no está configurado, el código se loguea por consola en development.

## Cookie + JWT

- Cookie name: `admin_token` (httpOnly, secure, sameSite=lax)
- JWT firmado con `JWT_SECRET` env (único por cliente — generar con `openssl rand -hex 32`)
- Expira en 7 días
- `getAdminUser()` de `@/lib/auth` lee la cookie + verifica JWT y devuelve el user o null
