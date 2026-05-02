import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import { listMenuItems } from "@/server/datasources/menu/MongoMenuRepo";

import { MenuList } from "./components/MenuList";

/** Lista del menú agrupada por categoría con CRUD por item. */
export default async function MenuAdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const all = await listMenuItems({ includeInactive: true });

  // Serializamos para que pase al CC sin ObjectId/Date.
  const plain = JSON.parse(JSON.stringify(all));

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl p-6 md:p-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">
              Admin · Carta
            </p>
            <h1 className="font-heading text-3xl md:text-4xl text-ink mt-1">
              Carta del restaurante
            </h1>
            <p className="text-sm text-muted mt-2 max-w-2xl">
              Cada plato y bebida del sitio es editable acá. Los desactivados se
              ocultan al público pero quedan disponibles para reactivar.
            </p>
          </div>
          <Link
            href="/admin/menu/new"
            className="shrink-0 inline-flex items-center gap-2 rounded-md bg-accent text-white text-sm font-medium px-5 py-2.5 hover:bg-accent-hover transition-colors"
          >
            + Nuevo plato
          </Link>
        </header>

        <MenuList items={plain} />
      </div>
    </div>
  );
}
