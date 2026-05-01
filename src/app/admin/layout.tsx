import { AdminLayoutShell } from "./_ui/AdminLayoutShell";
import { AdminSidebarSC } from "./_ui/AdminSidebarSC";

/**
 * Layout permanente del admin con sidebar dinámico.
 *
 * Composición SC→CC: el sidebar lo arma `AdminSidebarSC` (Server Component)
 * que lee Mongo y decide qué links mostrar según los módulos activos del
 * cliente; lo pasa como `sidebar` prop al `AdminLayoutShell` (CC) que decide
 * si renderizarlo (esconde sidebar en /admin/login).
 *
 * El sidebar SC se monta DENTRO del shell CC pasándolo por props (Next.js
 * permite SC adentro de CC siempre que el SC se pase como children o prop —
 * no se puede importar y renderizar directamente desde dentro del CC).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutShell sidebar={<AdminSidebarSC />}>{children}</AdminLayoutShell>
  );
}
