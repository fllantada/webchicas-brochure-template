import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import { listMedia } from "@/server/datasources/media/MediaApi";

import { MediaGrid } from "./components/MediaGrid";

/** Lista todas las imágenes editables agrupadas por categoría. */
export default async function MediaPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const all = await listMedia();

  return (
    <div className="min-h-screen bg-bg p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">
              Admin · Imágenes
            </p>
            <h1 className="font-heading text-3xl text-ink">
              {all.length} imágenes
            </h1>
          </div>
          <a
            href="/admin/dashboard"
            className="text-sm text-muted hover:text-accent"
          >
            ← Volver
          </a>
        </header>

        <MediaGrid items={all} />
      </div>
    </div>
  );
}
