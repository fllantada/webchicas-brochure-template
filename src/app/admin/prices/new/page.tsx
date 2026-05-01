import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import {
  PRICE_CATEGORIES,
  type PriceCategory,
} from "@/server/datasources/prices/domain/IPrice";

import { PriceEditor } from "../components/PriceEditor";
import type { PricePayload } from "../types";

interface Props {
  searchParams: Promise<{ category?: string }>;
}

/** Crea un precio nuevo. Acepta ?category=facial para preseleccionar la categoría. */
export default async function NewPricePage({ searchParams }: Props) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const { category } = await searchParams;
  const safeCategory: PriceCategory = (
    PRICE_CATEGORIES as readonly string[]
  ).includes(category ?? "")
    ? (category as PriceCategory)
    : "otro";

  const initial: PricePayload = {
    category: safeCategory,
    title: { es: "", en: "" },
    description: undefined,
    price: null,
    isFromPrice: false,
    priceOverride: undefined,
    durationMinutes: undefined,
    order: 999,
    active: true,
  };

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
          <h1 className="mt-3 font-heading text-3xl text-ink">Nuevo precio</h1>
        </header>

        <PriceEditor id={null} initial={initial} />
      </div>
    </div>
  );
}
