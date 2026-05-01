import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";

/** Dashboard placeholder protegido — punto de entrada post-login. */
export default async function DashboardPage() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">Admin</p>
            <h1 className="font-heading text-3xl text-ink">
              Hola, {user.name}
            </h1>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-sm text-muted hover:text-accent"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        <nav className="grid sm:grid-cols-2 gap-4">
          <a
            href="/admin/media"
            className="block rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent"
          >
            <p className="text-xs uppercase tracking-widest text-accent mb-2">
              Sección
            </p>
            <h2 className="font-heading text-2xl text-ink mb-2">Imágenes</h2>
            <p className="text-sm text-muted">
              Editar fotos del sitio. Sube cualquier formato — se procesa
              automáticamente para web.
            </p>
          </a>

          <a
            href="/admin/contact"
            className="block rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent"
          >
            <p className="text-xs uppercase tracking-widest text-accent mb-2">
              Sección
            </p>
            <h2 className="font-heading text-2xl text-ink mb-2">Contacto</h2>
            <p className="text-sm text-muted">
              Teléfono, email, dirección, mapa, horarios, redes y reservas.
            </p>
          </a>

          <a
            href="/admin/prices"
            className="block rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent"
          >
            <p className="text-xs uppercase tracking-widest text-accent mb-2">
              Sección
            </p>
            <h2 className="font-heading text-2xl text-ink mb-2">Precios</h2>
            <p className="text-sm text-muted">
              Lista completa de tratamientos con precios bilingües y orden por
              categoría.
            </p>
          </a>
        </nav>

        <p className="mt-8 text-xs text-muted">
          {user.email} · Rol: {user.role}
        </p>
      </div>
    </div>
  );
}
