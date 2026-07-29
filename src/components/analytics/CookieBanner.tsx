"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ConsentValue } from "./consent";

// Aviso de cookies AEPD-compliant: aceptar y rechazar con la misma prominencia,
// link a la política, y sin "seguir navegando implica aceptar".
export default function CookieBanner({
  onChoice,
}: {
  onChoice: (value: ConsentValue) => void;
}) {
  const t = useTranslations("cookies");

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("banner_aria")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-elevated px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-relaxed text-ink">
          {t("banner_text")}{" "}
          <Link
            href="/cookies"
            className="text-accent underline underline-offset-2"
          >
            {t("banner_more")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => onChoice("rejected")}
            className="rounded border border-border px-4 py-2 text-sm text-ink transition-colors hover:bg-surface"
          >
            {t("banner_reject")}
          </button>
          <button
            type="button"
            onClick={() => onChoice("accepted")}
            className="rounded bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-dark"
          >
            {t("banner_accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
