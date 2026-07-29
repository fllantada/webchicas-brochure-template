"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  consentRequired,
  hasAnyTracker,
  type ConsentValue,
} from "@/lib/consent-contract";
import {
  clearTrackerCookies,
  getConsentServerSnapshot,
  getStoredConsent,
  storeConsent,
  subscribeConsent,
} from "@/components/analytics/Analytics/consent";

/**
 * Bloque "Tu decisión" de la página /cookies: muestra el estado actual del
 * consentimiento y permite cambiarlo. Retirar debe ser tan fácil como dar
 * (criterio AEPD): al rechazar se borran las cookies de trackers ya
 * instaladas y se recarga la página para descargar los scripts montados.
 * Solo aparece en modo consent requerido y con algún tracker configurado.
 */
export default function ConsentPreferences() {
  const t = useTranslations("cookies");
  const consent = useSyncExternalStore(
    subscribeConsent,
    getStoredConsent,
    getConsentServerSnapshot,
  );

  if (consent === "unknown" || !consentRequired() || !hasAnyTracker()) return null;

  const stateText =
    consent === "accepted"
      ? t("prefs_state_accepted")
      : consent === "rejected"
        ? t("prefs_state_rejected")
        : t("prefs_state_none");

  const choose = (value: ConsentValue) => {
    if (value === "rejected") clearTrackerCookies();
    storeConsent(value);
    if (value === "rejected") window.location.reload();
  };

  return (
    <div className="mt-8 rounded-lg border border-ink/12 bg-surface p-6">
      <h2 className="font-heading mb-1 text-lg text-ink">{t("prefs_title")}</h2>
      <p className="mb-4 text-sm text-muted">{stateText}</p>
      {/* Mismo orden y mismo peso visual que el banner: [Rechazar] [Aceptar]. */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => choose("rejected")}
          className="rounded border border-ink/25 px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("prefs_reject")}
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="rounded border border-accent px-5 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t("prefs_accept")}
        </button>
      </div>
    </div>
  );
}
