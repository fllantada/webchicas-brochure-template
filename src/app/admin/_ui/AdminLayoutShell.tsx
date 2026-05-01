"use client";

import { usePathname } from "next/navigation";

import { AdminSidebar } from "./AdminSidebar";

/** Layout shell del admin — esconde sidebar en /admin/login (pre-auth). */
export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isLogin = pathname.startsWith("/admin/login");

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-bg md:flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
