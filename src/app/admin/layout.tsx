import { AdminLayoutShell } from "./_ui/AdminLayoutShell";

/** Layout permanente del admin con sidebar — se esconde automáticamente en /admin/login. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
