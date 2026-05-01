"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  /** URL del widget Booksy. Si vacía o null, el componente no se renderiza
   *  (el cliente no quiere CTA mientras no tenga reservas online). */
  booksyUrl: string;
}

/** Sticky bottom CTA visible on mobile after scrolling past hero */
export default function MobileStickyCTA({ booksyUrl }: Props) {
  const t = useTranslations("header");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!booksyUrl) return null;

  return (
    <div
      className={`lg:hidden fixed left-4 right-4 bottom-4 z-40 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      }`}
    >
      <a
        href={booksyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-accent text-white text-center font-medium py-4 rounded-full shadow-lg hover:bg-accent-hover transition-colors"
      >
        {t("book_appointment")}
      </a>
    </div>
  );
}
