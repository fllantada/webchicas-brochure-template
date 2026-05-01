/**
 * Flags por módulo del admin: ¿está implementada la UI CRUD?
 *
 * Distinto de `hasAny*Items()` (eso indica si hay DATOS). Este flag indica si
 * existe la página `/admin/{module}` con su CRUD funcional.
 *
 * Uso (sidebar + dashboard):
 *   const showMenu = hasAnyMenuItems() && ADMIN_UI_AVAILABLE.menu;
 *
 * Por qué la distinción:
 * - El backend del módulo Menu (IMenuItem + MongoMenuRepo) está listo y
 *   la página pública `/carta` lo renderiza — pero la admin UI CRUD del
 *   menú todavía NO está construida (capitalizable pendiente del template).
 * - Mostrar el link "Menú" en sidebar antes de tener la UI rompe expectativa:
 *   el cliente click → 404. Falla del principio "no exponer cocina sin terminar".
 *
 * Cuando se implemente `/admin/menu/page.tsx` (CRUD bilingüe + live preview,
 * copy-adapt de `/admin/prices/`), cambiar `menu: true` y borrar este comentario.
 */
export const ADMIN_UI_AVAILABLE = {
  /** /admin/contact — implementada con BilingualInput + ScheduleSection. */
  contact: true,
  /** /admin/media — implementada con upload + 8 variantes sharp + MediaEditForm. */
  media: true,
  /** /admin/prices — implementada con CRUD bilingüe + live preview + categorías. */
  prices: true,
  /** /admin/menu — NO implementada. Backend listo, falta UI CRUD. */
  menu: false,
} as const;
