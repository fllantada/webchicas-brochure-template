import { notFound, redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import { getPriceById } from "@/server/datasources/prices/MongoPriceRepo";

import { PriceEditor } from "../components/PriceEditor";

interface Props {
  params: Promise<{ id: string }>;
}

/** Edición de un precio existente. */
export default async function EditPricePage({ params }: Props) {
  const { id } = await params;

  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const price = await getPriceById(id);
  if (!price) notFound();

  // Serializamos para pasar al CC sin ObjectId/Date.
  const initial = JSON.parse(
    JSON.stringify({
      category: price.category,
      title: price.title,
      description: price.description,
      price: price.price,
      isFromPrice: price.isFromPrice,
      priceOverride: price.priceOverride,
      durationMinutes: price.durationMinutes,
      order: price.order,
      active: price.active,
    }),
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <header className="mb-8">
          <a
            href="/admin/prices"
            className="text-sm text-muted hover:text-accent"
          >
            ← Precios
          </a>
          <h1 className="mt-3 font-heading text-3xl text-ink">
            {price.title.es}
          </h1>
        </header>

        <PriceEditor id={id} initial={initial} />
      </div>
    </div>
  );
}
