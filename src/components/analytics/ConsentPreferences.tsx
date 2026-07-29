"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  consentRequired,
  getConsentServerSnapshot,
  getStoredConsent,
  hasAnyTracker,
  storeConsent,
  subscribeConsent,
  type ConsentValue,
} from "./consent";

// Bloque "tu decisión" de la página /cookies. Retirar el consentimiento debe
// ser tan fácil como darlo (AEPD): al pasar a "rechazadas" se recarga la
// página para descargar los scripts ya montados.
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
    storeConsent(value);
    if (value === "rejected") window.location.reload();
  };

  return (
    <div className="mt-8 rounded border border-border bg-elevated p-6">
      <p className="mb-1 text-sm font-semibold text-ink">{t("prefs_title")}</p>
      <p className="mb-4 text-sm text-muted">{stateText}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="rounded bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-dark"
        >
          {t("prefs_accept")}
        </button>
        <button
          type="button"
          onClick={() => choose("rejected")}
          className="rounded border border-border px-4 py-2 text-sm text-ink transition-colors hover:bg-surface"
        >
          {t("prefs_reject")}
        </button>
      </div>
    </div>
  );
}
