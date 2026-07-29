"use client";

import { useSyncExternalStore } from "react";
import {
  consentRequired,
  getConsentServerSnapshot,
  getStoredConsent,
  hasAnyTracker,
  storeConsent,
  subscribeConsent,
  TRACKER_IDS,
} from "./consent";
import CookieBanner from "./CookieBanner";
import Clarity from "./Clarity";
import MetaPixel from "./MetaPixel";
import GoogleAnalytics from "./GoogleAnalytics";

/**
 * Orquestador de analítica + consentimiento (RGPD / AEPD).
 * Se monta una sola vez en el layout de [locale].
 *
 * - Sin tracker configurado → no renderiza nada (tampoco banner: no hay nada
 *   que consentir).
 * - Con consent requerido (default), los trackers solo cargan tras "Aceptar";
 *   "Rechazar" persiste la negativa y no carga nada.
 * - Con NEXT_PUBLIC_COOKIE_CONSENT="off" (clientes fuera de la UE) los
 *   trackers cargan directo y no hay banner.
 */
export default function Analytics() {
  // La cookie es el estado; "unknown" mientras no la leímos (server/hidratación).
  const consent = useSyncExternalStore(
    subscribeConsent,
    getStoredConsent,
    getConsentServerSnapshot,
  );

  if (!hasAnyTracker()) return null;

  const required = consentRequired();
  const allowed = !required || consent === "accepted";

  return (
    <>
      {allowed && (
        <>
          {TRACKER_IDS.clarity && <Clarity projectId={TRACKER_IDS.clarity} />}
          {TRACKER_IDS.metaPixel && <MetaPixel pixelId={TRACKER_IDS.metaPixel} />}
          {TRACKER_IDS.ga && <GoogleAnalytics measurementId={TRACKER_IDS.ga} />}
        </>
      )}
      {required && consent === null && <CookieBanner onChoice={storeConsent} />}
    </>
  );
}
