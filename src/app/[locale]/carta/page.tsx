import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { pickLocale, type Locale } from "@/i18n/locales";
import {
  MENU_CATEGORIES,
  MENU_CATEGORY_LABELS,
} from "@/server/datasources/menu/domain/IMenuItem";
import { listActiveMenuItems } from "@/server/datasources/menu/MongoMenuRepo";

interface PageParams {
  params: Promise<{ locale: string }>;
}

/**
 * Metadata SEO de /carta. Si no hay items en Mongo, esta page devuelve
 * 404 — pero generateMetadata corre antes y necesita un fallback razonable.
 */
export async function generateMetadata(
  { params }: PageParams,
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "";
  return {
    title: `${t("page_title")}${brand ? ` · ${brand}` : ""}`,
    description: t("page_description"),
    alternates: { canonical: "/carta" },
  };
}

/**
 * Página pública /carta — renderiza menu_items agrupados por categoría.
 *
 * Server Component puro: lee Mongo, agrupa, renderiza. No hay CC porque la
 * UX es de lectura (no hay filtros / drag / form).
 *
 * Si la collection menu_items está vacía → 404 (cliente no-restaurante o
 * todavía no seedeó). El Header dinámico no muestra el link "Carta" en ese
 * caso (ver HeaderSC), así que llegar acá es un acceso directo.
 *
 * Mobile-first: stack vertical, cada categoría como bloque con header,
 * items en lista con title/description/price. Sin interacción JS.
 */
export default async function CartaPage({ params }: PageParams) {
  const { locale } = await params;
  const items = await listActiveMenuItems();

  if (items.length === 0) notFound();

  const t = await getTranslations({ locale, namespace: "menu" });

  // Agrupar por categoría preservando el orden de MENU_CATEGORIES
  const byCategory = MENU_CATEGORIES.map((cat) => ({
    category: cat,
    label: pickLocale(MENU_CATEGORY_LABELS[cat], locale as Locale),
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="bg-bg py-16 md:py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 md:mb-16 text-center">
          <h1 className="font-heading text-4xl md:text-6xl text-ink leading-[1.05] mb-4 tracking-tight">
            {t("page_title")}
          </h1>
          <p className="text-base md:text-lg text-muted max-w-xl mx-auto">
            {t("page_description")}
          </p>
        </header>

        <div className="space-y-12 md:space-y-16">
          {byCategory.map(({ category, label, items: catItems }) => (
            <section key={category}>
              <h2 className="font-heading text-2xl md:text-3xl text-accent mb-6 pb-2 border-b border-border">
                {label}
              </h2>
              <ul className="space-y-5">
                {catItems.map((item) => {
                  const title = pickLocale(item.title, locale as Locale);
                  const description = item.description
                    ? pickLocale(item.description, locale as Locale)
                    : "";
                  const priceNote = item.priceNote
                    ? pickLocale(item.priceNote, locale as Locale)
                    : "";
                  const priceOverride = item.priceOverride
                    ? pickLocale(item.priceOverride, locale as Locale)
                    : "";
                  const priceDisplay = priceOverride
                    ? priceOverride
                    : item.price !== null
                      ? `${item.price.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`
                      : "";

                  return (
                    <li
                      key={String(item._id)}
                      className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-baseline"
                    >
                      <h3 className="text-base md:text-lg text-ink font-medium">
                        {title}
                        {item.tags && item.tags.length > 0 && (
                          <span className="ml-2 inline-flex gap-1 align-middle">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs uppercase tracking-wider text-warm bg-warm-soft px-1.5 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </h3>
                      {priceDisplay && (
                        <span className="text-base md:text-lg text-ink font-semibold whitespace-nowrap">
                          {priceDisplay}
                        </span>
                      )}
                      {description && (
                        <p className="col-span-2 text-sm text-muted leading-relaxed">
                          {description}
                        </p>
                      )}
                      {priceNote && (
                        <p className="col-span-2 text-xs text-subtle italic">
                          {priceNote}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
