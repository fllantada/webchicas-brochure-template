import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import { hasAnyMenuItems } from "@/server/datasources/menu/MongoMenuRepo";
import { hasAnyPrices } from "@/server/datasources/prices/MongoPriceRepo";

import { ADMIN_UI_AVAILABLE } from "../_ui/availableModules";

import { OnboardingChecklist } from "./components/OnboardingChecklist";

/**
 * Dashboard admin protegido — punto de entrada post-login.
 *
 * Estructura: greeting + checklist de onboarding (esconde si todo OK) +
 * grid de secciones del admin (cards dinámicas según módulos activos).
 *
 * Polirrubrismo (ver IA-docs admin §6): las cards "Menú" y "Precios" solo
 * aparecen si la collection correspondiente tiene datos. Si está vacía y no
 * aplica al cliente, se esconde para no confundirlo.
 */
export default async function DashboardPage() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [hasMenu, hasPrices] = await Promise.all([
    hasAnyMenuItems(),
    hasAnyPrices(),
  ]);

  return (
    <div className="min-h-screen bg-bg p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">
              Admin
            </p>
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

        <OnboardingChecklist />

        <nav className="grid sm:grid-cols-2 gap-4">
          <DashboardCard
            href="/admin/media"
            title="Imágenes"
            description="Editar fotos del sitio. Sube cualquier formato — se procesa automáticamente para web."
          />
          <DashboardCard
            href="/admin/contact"
            title="Contacto"
            description="Teléfono, email, dirección, mapa, horarios, redes y reservas."
          />
          {hasMenu && ADMIN_UI_AVAILABLE.menu && (
            <DashboardCard
              href="/admin/menu"
              title="Menú"
              description="Carta del restaurante con categorías, descripciones, precios y notas, bilingüe."
            />
          )}
          {hasPrices && ADMIN_UI_AVAILABLE.prices && (
            <DashboardCard
              href="/admin/prices"
              title="Precios"
              description="Lista completa de tratamientos con precios bilingües y orden por categoría."
            />
          )}
        </nav>

        <p className="mt-8 text-xs text-muted">
          {user.email} · Rol: {user.role}
        </p>
      </div>
    </div>
  );
}

interface DashboardCardProps {
  /** Path del admin (ej. /admin/media). */
  href: string;
  /** Título visible al cliente. */
  title: string;
  /** Descripción corta de qué se edita en esa sección. */
  description: string;
}

function DashboardCard({ href, title, description }: DashboardCardProps) {
  return (
    <a
      href={href}
      className="block rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <p className="text-xs uppercase tracking-widest text-accent mb-2">
        Sección
      </p>
      <h2 className="font-heading text-2xl text-ink mb-2">{title}</h2>
      <p className="text-sm text-muted">{description}</p>
    </a>
  );
}
