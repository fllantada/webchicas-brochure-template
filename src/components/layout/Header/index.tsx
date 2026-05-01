"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/ui/LanguageSelector";
import type { PlainContact } from "@/server/datasources/contact/domain/IContact";

export interface HeaderNavItem {
  /** Texto visible (ya traducido). */
  label: string;
  /** Path del link (relativo al locale, sin prefijo). */
  href: string;
  /** Subitems opcionales (dropdown desktop / acordeón mobile). */
  children?: { label: string; href: string }[];
}

interface Props {
  /** Datos de contacto del sitio. Necesarios para teléfono visible, CTA Booksy
   *  e info de contacto del menú mobile. */
  contact: PlainContact;
  /**
   * Items del nav. Lo arma el SC padre `HeaderSC` según los módulos activos
   * del cliente (ver IA-docs admin §6 polirrubrismo). Si no se pasa, fallback
   * a los items base (Inicio + Contacto) — solo para tests/storybook.
   */
  navItems?: HeaderNavItem[];
}

export default function Header({ contact, navItems }: Props) {
  const t = useTranslations("nav");
  const th = useTranslations("header");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fallback solo si el SC padre no proveyó items (no debería en producción).
  const NAV_ITEMS: HeaderNavItem[] = navItems ?? [
    { label: t("home"), href: "/" },
    { label: t("contact"), href: "/contacto" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const cleanPath = pathname.replace(/^\/(es|en)/, "") || "/";
  const isActive = (href: string) => {
    if (href === "/") return cleanPath === "/";
    return cleanPath.startsWith(href);
  };
  const servicesActive = cleanPath.startsWith("/servicios");

  return (
    <>
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-bg/90 backdrop-blur-md border-b border-border"
          : "bg-transparent lg:bg-bg"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 md:px-6 h-16">
        <Link href="/" className="shrink-0" aria-label={th("logo_alt")}>
          {process.env.NEXT_PUBLIC_BRAND_LOGO_PATH ? (
            <Image
              src={process.env.NEXT_PUBLIC_BRAND_LOGO_PATH}
              alt={th("logo_alt")}
              width={44}
              height={44}
              priority
            />
          ) : (
            <span className="font-heading text-xl text-ink">
              {process.env.NEXT_PUBLIC_BRAND_NAME || "Brand"}
            </span>
          )}
        </Link>

        <nav
          className="hidden lg:flex items-center gap-7"
          aria-label={t("main_nav_label")}
        >
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setDesktopServicesOpen(true)}
                onMouseLeave={() => setDesktopServicesOpen(false)}
              >
                <button
                  className={`text-sm transition-colors cursor-pointer ${
                    servicesActive ? "text-accent" : "text-ink hover:text-accent"
                  }`}
                >
                  {item.label}
                  <span className="ml-1 text-[10px]">&#9662;</span>
                </button>
                {desktopServicesOpen && (
                  <div className="absolute top-full left-0 bg-bg border border-border rounded-lg py-2 min-w-56 z-50 shadow-[0_8px_40px_-12px_rgba(43,37,32,0.15)]">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-5 py-2 text-sm transition-colors ${
                          isActive(child.href)
                            ? "text-accent"
                            : "text-ink hover:text-accent"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  isActive(item.href) ? "text-accent" : "text-ink hover:text-accent"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-5">
          <LanguageSelector />
          {contact.phoneRaw && (
            <a
              href={`tel:+${contact.phoneRaw}`}
              className="text-sm text-muted hover:text-accent transition-colors"
            >
              {contact.phone || contact.phoneRaw}
            </a>
          )}
          {contact.booksyUrl && (
            <a
              href={contact.booksyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-accent-hover transition-colors"
            >
              {th("book_appointment")}
            </a>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-1">
          <LanguageSelector variant="default" />
          <button
            className="p-2.5 -mr-2 cursor-pointer transition-colors text-ink"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={t("menu_label")}
            aria-expanded={mobileOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
    {mounted && createPortal(
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <button
          className="absolute inset-0 bg-bg/70 backdrop-blur-sm cursor-default"
          onClick={() => setMobileOpen(false)}
          aria-label={t("close_menu")}
          tabIndex={mobileOpen ? 0 : -1}
        />
        <nav
          className={`absolute right-0 top-0 h-full w-full max-w-[360px] bg-bg border-l border-border overflow-y-auto shadow-[-8px_0_40px_-12px_rgba(43,37,32,0.15)] transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
          aria-label={t("mobile_nav_label")}
        >
          <div className="flex justify-between items-center px-7 pt-6 pb-4">
            <p className="kicker">
              <span className="hairline-warm" />
              Menú
            </p>
            <button
              className="p-2 -mr-2 cursor-pointer text-ink"
              onClick={() => setMobileOpen(false)}
              aria-label={t("close_menu")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-7 py-4">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <button
                    className={`w-full text-left font-heading text-xl font-medium py-3 cursor-pointer flex justify-between items-center transition-colors ${
                      servicesActive ? "text-accent" : "text-ink hover:text-accent"
                    }`}
                    onClick={() => setMobileServicesOpen((o) => !o)}
                    aria-expanded={mobileServicesOpen}
                  >
                    {item.label}
                    <span className={`text-base transition-transform duration-200 ${mobileServicesOpen ? "rotate-45" : ""}`}>
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
                      mobileServicesOpen ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <div className="pl-4 border-l border-warm py-1 mb-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block py-2 text-[15px] transition-colors ${
                            isActive(child.href)
                              ? "text-accent"
                              : "text-muted hover:text-accent"
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block font-heading text-xl font-medium py-3 transition-colors ${
                    isActive(item.href) ? "text-accent" : "text-ink hover:text-accent"
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {contact.booksyUrl && (
            <div className="px-7 pt-4 pb-6">
              <a
                href={contact.booksyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-accent text-white text-center text-sm font-semibold py-4 rounded hover:bg-accent-hover transition-colors tracking-wide"
              >
                {th("book_appointment")}
              </a>
            </div>
          )}

          <div className="px-7 pt-6 pb-8 border-t border-border">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Idioma</p>
              <LanguageSelector />
            </div>
            <div className="space-y-2.5 text-sm">
              {contact.phoneRaw && (
                <a href={`tel:+${contact.phoneRaw}`} className="block text-ink hover:text-accent transition-colors">
                  {contact.phone || contact.phoneRaw}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="block text-muted hover:text-accent transition-colors">
                  {contact.email}
                </a>
              )}
              <div className="flex gap-5 pt-3">
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/${contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline underline-offset-4"
                  >
                    WhatsApp
                  </a>
                )}
                {contact.social.instagram && (
                  <a
                    href={contact.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline underline-offset-4"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>,
      document.body
    )}
    </>
  );
}
