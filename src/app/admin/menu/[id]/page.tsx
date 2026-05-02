import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import { getMenuItemById } from "@/server/datasources/menu/MongoMenuRepo";

import { MenuItemEditor } from "../components/MenuItemEditor";

interface Props {
  params: Promise<{ id: string }>;
}

/** Edición de un item de menú existente. */
export default async function EditMenuItemPage({ params }: Props) {
  const { id } = await params;

  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const item = await getMenuItemById(id);
  if (!item) notFound();

  // Serializamos para pasar al CC sin ObjectId/Date.
  const initial = JSON.parse(
    JSON.stringify({
      category: item.category,
      title: item.title,
      description: item.description,
      price: item.price,
      priceNote: item.priceNote,
      priceOverride: item.priceOverride,
      order: item.order,
      active: item.active,
    }),
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <header className="mb-8">
          <Link
            href="/admin/menu"
            className="text-sm text-muted hover:text-accent"
          >
            ← Carta
          </Link>
          <h1 className="mt-3 font-heading text-3xl text-ink">
            {item.title.es}
          </h1>
        </header>

        <MenuItemEditor id={id} initial={initial} />
      </div>
    </div>
  );
}
