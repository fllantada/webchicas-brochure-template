import { getTranslations } from "next-intl/server";

import { hasAnyMenuItems } from "@/server/datasources/menu/MongoMenuRepo";
import { hasAnyPrices } from "@/server/datasources/prices/MongoPriceRepo";
import type { PlainContact } from "@/server/datasources/contact/domain/IContact";

import Header, { type HeaderNavItem } from "./index";

interface HeaderSCProps {
  /** Datos de contacto del sitio (se pasan al CC). */
  contact: PlainContact;
  /** Locale activo, para traducir labels server-side. */
  locale: string;
}

/**
 * Header Server Component — decide qué items del nav mostrar según los módulos
 * activos del cliente (mismo patrón que `AdminSidebarSC`).
 *
 * Reglas (ver IA-docs admin §6 polirrubrismo):
 * - Inicio / Contacto: siempre visibles
 * - Carta: solo si la collection `menu_items` tiene >= 1 doc (restaurante)
 * - Tarifas: solo si la collection `prices` tiene >= 1 doc (estética/peluquería)
 *
 * Si un cliente todavía no creó datos en un módulo, el link no aparece — para
 * evitar que turistas/usuarios hagan click en una página vacía. Cuando crea
 * el primer registro desde admin, el link aparece automáticamente al siguiente
 * render (Server Components no se cachean entre requests para datos dinámicos).
 */
export async function HeaderSC({ contact, locale }: HeaderSCProps) {
  const [t, hasMenu, hasPrices] = await Promise.all([
    getTranslations({ locale, namespace: "nav" }),
    hasAnyMenuItems(),
    hasAnyPrices(),
  ]);

  const navItems: HeaderNavItem[] = [
    { label: t("home"), href: "/" },
    ...(hasMenu ? [{ label: t("menu"), href: "/carta" }] : []),
    ...(hasPrices ? [{ label: t("prices"), href: "/tarifas" }] : []),
    { label: t("contact"), href: "/contacto" },
  ];

  return <Header contact={contact} navItems={navItems} />;
}
