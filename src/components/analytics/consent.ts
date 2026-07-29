// Helpers puros del sistema de consentimiento de cookies (client-safe).
// La decisión vive en una cookie first-party (NO localStorage) para que el
// server también pueda leerla y gatear eventos server-side como Meta CAPI:
// ver src/server/shared/consent.ts.

export type ConsentValue = "accepted" | "rejected";

// "unknown" = server/hidratación, todavía no pudimos leer la cookie del browser.
export type ConsentSnapshot = ConsentValue | null | "unknown";

export const CONSENT_COOKIE = "cookie_consent";

// La AEPD recomienda renovar el consentimiento periódicamente: 6 meses.
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

// IDs de trackers por cliente. Referencias estáticas obligatorias:
// Next inlinea NEXT_PUBLIC_* en build, no se pueden leer dinámicamente.
export const TRACKER_IDS = {
  clarity: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  metaPixel: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  ga: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
};

export function hasAnyTracker(): boolean {
  return Boolean(TRACKER_IDS.clarity || TRACKER_IDS.metaPixel || TRACKER_IDS.ga);
}

// Switch maestro EXPLÍCITO por cliente: NEXT_PUBLIC_COOKIE_CONSENT
//   unset / "required" → banner + trackers gateados por consentimiento (default seguro, UE)
//   "off"              → sin banner, trackers cargan directo (clientes fuera de la UE)
export function consentRequired(): boolean {
  return process.env.NEXT_PUBLIC_COOKIE_CONSENT !== "off";
}

// --- Store mínimo para useSyncExternalStore: la cookie es el estado, ---
// --- storeConsent() es la única mutación y notifica a los suscriptos. ---

type Listener = () => void;
let listeners: Listener[] = [];

export function subscribeConsent(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getStoredConsent(): ConsentSnapshot {
  if (typeof document === "undefined") return "unknown";
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  const value = match?.split("=")[1];
  return value === "accepted" || value === "rejected" ? value : null;
}

export function getConsentServerSnapshot(): ConsentSnapshot {
  return "unknown";
}

export function storeConsent(value: ConsentValue) {
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${CONSENT_MAX_AGE}; path=/; SameSite=Lax`;
  listeners.forEach((l) => l());
}
