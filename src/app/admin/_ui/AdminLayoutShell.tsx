"use client";

import { usePathname } from "next/navigation";

/**
 * Layout shell del admin — esconde sidebar en /admin/login (pre-auth).
 *
 * Recibe el sidebar como children (Server Component `AdminSidebarSC` que lee
 * Mongo para decidir qué links mostrar). Este shell solo decide si renderizarlo
 * o no según el pathname — la lógica de SC vive afuera.
 */
export function AdminLayoutShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isLogin = pathname.startsWith("/admin/login");

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-bg md:flex">
      {sidebar}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
