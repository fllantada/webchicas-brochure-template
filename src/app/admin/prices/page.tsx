import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import { listPrices } from "@/server/datasources/prices/MongoPriceRepo";

import { PricesList } from "./components/PricesList";

/** Lista de precios agrupada por categoría con CRUD por item. */
export default async function PricesAdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const all = await listPrices({ includeInactive: true });

  // Serializamos para que pase al CC sin ObjectId/Date.
  const plain = JSON.parse(JSON.stringify(all));

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl p-6 md:p-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">
              Admin · Precios
            </p>
            <h1 className="font-heading text-3xl md:text-4xl text-ink mt-1">
              Lista de precios
            </h1>
            <p className="text-sm text-muted mt-2 max-w-2xl">
              Cada precio del sitio es editable acá. Las desactivadas se ocultan
              al público pero quedan disponibles para reactivar.
            </p>
          </div>
          <a
            href="/admin/prices/new"
            className="shrink-0 inline-flex items-center gap-2 rounded-md bg-accent text-white text-sm font-medium px-5 py-2.5 hover:bg-accent-hover transition-colors"
          >
            + Nuevo precio
          </a>
        </header>

        <PricesList items={plain} />
      </div>
    </div>
  );
}
