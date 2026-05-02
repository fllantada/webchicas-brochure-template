import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import {
  MENU_CATEGORIES,
  type MenuCategory,
} from "@/server/datasources/menu/domain/IMenuItem";

import { MenuItemEditor } from "../components/MenuItemEditor";
import type { MenuItemPayload } from "../types";

interface Props {
  searchParams: Promise<{ category?: string }>;
}

/** Crea un item de menú nuevo. Acepta ?category=tapas para preseleccionar. */
export default async function NewMenuItemPage({ searchParams }: Props) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const { category } = await searchParams;
  const safeCategory: MenuCategory = (
    MENU_CATEGORIES as readonly string[]
  ).includes(category ?? "")
    ? (category as MenuCategory)
    : "otro";

  const initial: MenuItemPayload = {
    category: safeCategory,
    title: { es: "", en: "" },
    description: undefined,
    price: null,
    priceNote: undefined,
    priceOverride: undefined,
    order: 999,
    active: true,
  };

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
          <h1 className="mt-3 font-heading text-3xl text-ink">Nuevo plato</h1>
        </header>

        <MenuItemEditor id={null} initial={initial} />
      </div>
    </div>
  );
}
