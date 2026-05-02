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
 * - Cada módulo tiene un trio (datasource + página pública + página admin) que
 *   puede estar parcialmente construido. Cuando los 3 están, se setea `true`.
 * - Mostrar un link en sidebar a una admin UI que no existe rompe expectativa:
 *   el cliente click → 404. Falla del principio "no exponer cocina sin terminar".
 */
export const ADMIN_UI_AVAILABLE = {
  /** /admin/contact — implementada con BilingualInput + ScheduleSection. */
  contact: true,
  /** /admin/media — implementada con upload + 8 variantes sharp + MediaEditForm. */
  media: true,
  /** /admin/prices — implementada con CRUD bilingüe + live preview + categorías. */
  prices: true,
  /** /admin/menu — implementada con CRUD bilingüe + live preview + 16 categorías gastronómicas. */
  menu: true,
} as const;
