"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "@/i18n/navigation";
import {
  consentRequired,
  hasAnyTracker,
  TRACKER_IDS,
  type ConsentValue,
} from "@/lib/consent-contract";
import {
  clearTrackerCookies,
  getConsentServerSnapshot,
  getStoredConsent,
  storeConsent,
  subscribeConsent,
} from "./consent";
import CookieBanner from "./components/CookieBanner";
import Clarity from "./components/Clarity";
import MetaPixel from "./components/MetaPixel";
import GoogleAnalytics from "./components/GoogleAnalytics";

/**
 * Orquestador de analítica + consentimiento (RGPD / AEPD).
 * Se monta una sola vez en el layout de [locale].
 *
 * - Sin tracker configurado → no renderiza nada (tampoco banner: no hay nada
 *   que consentir).
 * - Con consent requerido (default), los trackers solo cargan tras "Aceptar";
 *   "Rechazar" persiste la negativa, borra las cookies de trackers que
 *   pudieran quedar de un consentimiento anterior, y no carga nada.
 * - Con NEXT_PUBLIC_COOKIE_CONSENT="off" (clientes fuera de la UE) los
 *   trackers cargan directo y no hay banner.
 * - En /cookies el banner no se muestra: ahí ya está el bloque "Tu decisión"
 *   (ConsentPreferences) con los mismos dos botones.
 */
export default function Analytics() {
  // La cookie es el estado; "unknown" mientras no la leímos (server/hidratación).
  const consent = useSyncExternalStore(
    subscribeConsent,
    getStoredConsent,
    getConsentServerSnapshot,
  );
  // usePathname de i18n/navigation devuelve la ruta sin prefijo de locale.
  const pathname = usePathname();

  if (!hasAnyTracker()) return null;

  const required = consentRequired();
  const allowed = !required || consent === "accepted";
  const onCookiePolicy = pathname === "/cookies";

  const choose = (value: ConsentValue) => {
    if (value === "rejected") clearTrackerCookies();
    storeConsent(value);
  };

  return (
    <>
      {allowed && (
        <>
          {TRACKER_IDS.clarity && <Clarity projectId={TRACKER_IDS.clarity} />}
          {TRACKER_IDS.metaPixel && <MetaPixel pixelId={TRACKER_IDS.metaPixel} />}
          {TRACKER_IDS.ga && <GoogleAnalytics measurementId={TRACKER_IDS.ga} />}
        </>
      )}
      {required && consent === null && !onCookiePolicy && (
        <CookieBanner onChoice={choose} />
      )}
    </>
  );
}
