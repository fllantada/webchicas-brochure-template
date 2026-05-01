"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  label: string;
  href: string;
  disabled?: boolean;
}

const ITEMS: NavItem[] = [
  { label: "Inicio", href: "/admin/dashboard" },
  { label: "Imágenes", href: "/admin/media" },
  { label: "Contacto", href: "/admin/contact" },
  { label: "Precios", href: "/admin/prices" },
];

/** Sidebar admin — drawer hamburger en mobile, lateral fijo en desktop. */
export function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  // Cerrar drawer al cambiar de ruta
  useEffect(() => setOpen(false), [pathname]);

  // Bloquear scroll body cuando drawer abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 h-14">
        <p className="font-heading text-base text-ink">{process.env.NEXT_PUBLIC_BRAND_NAME || "Admin"}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="p-2 -mr-2 text-ink"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — drawer en mobile, fijo en desktop */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-0 h-screen w-72 md:w-60 bg-surface border-r border-border flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="px-6 py-6 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-heading text-lg text-ink">{process.env.NEXT_PUBLIC_BRAND_NAME || "Admin"}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted mt-1">
              Admin
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden p-1 -mr-1 text-muted"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {ITEMS.map((item) => {
            const isActive =
              item.href === "/admin/dashboard"
                ? pathname === "/admin/dashboard"
                : pathname.startsWith(item.href);

            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  className="block px-6 py-3 text-sm text-muted/50 cursor-not-allowed"
                  title="Próximamente"
                >
                  {item.label}
                  <span className="ml-2 text-[10px] uppercase tracking-widest">
                    pronto
                  </span>
                </span>
              );
            }
            return (
              <a
                key={item.href}
                href={item.href}
                className={`block px-6 py-3 text-sm transition-colors border-l-2 ${
                  isActive
                    ? "text-accent border-accent bg-bg font-medium"
                    : "text-ink border-transparent hover:text-accent hover:bg-bg/50"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <form
          action="/api/auth/logout"
          method="post"
          className="p-6 border-t border-border"
        >
          <button
            type="submit"
            className="text-sm text-muted hover:text-accent"
          >
            Cerrar sesión
          </button>
        </form>
      </aside>
    </>
  );
}
