import { hasAnyMenuItems } from "@/server/datasources/menu/MongoMenuRepo";
import { hasAnyPrices } from "@/server/datasources/prices/MongoPriceRepo";

import { AdminSidebar, type NavItem } from "./AdminSidebar";

/**
 * Sidebar admin Server Component — decide qué links mostrar según los módulos
 * activos del cliente (polirrubrismo del template).
 *
 * Reglas (ver IA-docs admin §6):
 * - Inicio / Imágenes / Contacto: siempre visibles (módulos base de TODO cliente)
 * - Menú: solo si la collection `menu_items` tiene >= 1 doc (clientes restaurante)
 * - Precios: solo si la collection `prices` tiene >= 1 doc (clientes estética/peluquería)
 *
 * Si un cliente todavía no creó ningún ítem en un módulo, el link no aparece —
 * para evitar que vea "Precios" o "Menú" apuntando a una página vacía. Cuando
 * cree el primer registro (desde Dashboard, módulo correspondiente o seed),
 * el link aparece automáticamente al siguiente render.
 */
export async function AdminSidebarSC() {
  const [hasMenu, hasPrices] = await Promise.all([
    hasAnyMenuItems(),
    hasAnyPrices(),
  ]);

  const items: NavItem[] = [
    { label: "Inicio", href: "/admin/dashboard" },
    { label: "Imágenes", href: "/admin/media" },
    { label: "Contacto", href: "/admin/contact" },
    ...(hasMenu ? [{ label: "Menú", href: "/admin/menu" }] : []),
    ...(hasPrices ? [{ label: "Precios", href: "/admin/prices" }] : []),
  ];

  return <AdminSidebar items={items} />;
}
