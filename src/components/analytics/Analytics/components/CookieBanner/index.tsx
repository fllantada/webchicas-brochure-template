"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TRACKER_IDS, type ConsentValue } from "@/lib/consent-contract";

/**
 * Aviso de cookies, primera capa (criterio AEPD): nombra a los terceros
 * activos, aceptar y rechazar con el MISMO peso visual y área táctil ≥44px,
 * link a la política, y sin "seguir navegando implica aceptar".
 *
 * Geometría: barra inferior full-width en móvil, tarjeta acotada (~416px)
 * abajo a la izquierda en desktop. Publica su alto real en la CSS var
 * --cookie-banner-h para que el MobileStickyCTA se apile encima y no quede
 * tapado (el CTA usa bottom: calc(var(--cookie-banner-h, 0px) + 1rem)).
 */
export default function CookieBanner({
  onChoice,
}: {
  /** Recibe la decisión del visitante; el llamador la persiste y desmonta el banner. */
  onChoice: (value: ConsentValue) => void;
}) {
  const t = useTranslations("cookies");
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  // Entrada animada (patrón del MobileStickyCTA): el estado real recién se
  // conoce tras hidratar y sin transición el banner aparece de golpe.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Publica el alto real del banner mientras esté montado.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () =>
      root.style.setProperty("--cookie-banner-h", `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--cookie-banner-h");
    };
  }, []);

  // Terceros activos, nombrados en la primera capa (requisito AEPD).
  const vendors = [
    TRACKER_IDS.clarity && "Microsoft",
    TRACKER_IDS.metaPixel && "Meta",
    TRACKER_IDS.ga && "Google",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      ref={ref}
      role="region"
      aria-label={t("banner_aria")}
      className={`fixed z-50 bg-elevated shadow-[0_8px_32px_rgba(43,37,32,0.16)]
        inset-x-0 bottom-0 border-t border-border px-6 py-5
        sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-[26rem] sm:rounded-lg sm:border sm:border-ink/10
        transition-all duration-300 motion-reduce:transition-none ${
          shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-ink">
          {t("banner_text", { vendors })}{" "}
          <Link
            href="/cookies"
            className="text-accent underline underline-offset-2"
          >
            {t("banner_more")}
          </Link>
        </p>
        {/* Mismo peso visual en ambos (criterio AEPD): outlined los dos,
            diferenciados solo por color. border-ink/25 ≥ 3:1 (WCAG 1.4.11). */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChoice("rejected")}
            className="flex-1 rounded border border-ink/25 px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("banner_reject")}
          </button>
          <button
            type="button"
            onClick={() => onChoice("accepted")}
            className="flex-1 rounded border border-accent px-5 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("banner_accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
