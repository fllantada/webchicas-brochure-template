import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  parseConsent,
  serializeConsent,
  type ConsentSnapshot,
  type ConsentValue,
} from "@/lib/consent-contract";

// Store mínimo para useSyncExternalStore: la cookie first-party es el estado
// (NO localStorage — el server también la lee para gatear Meta CAPI, ver
// src/server/shared/consent.ts) y storeConsent() es la única mutación.

type Listener = () => void;
let listeners: Listener[] = [];

// Si el navegador bloquea la escritura de cookies, la decisión al menos se
// respeta en memoria durante la sesión — sin esto el banner nunca desaparece.
let inMemoryConsent: ConsentValue | null = null;

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
  return parseConsent(match?.split("=")[1]) ?? inMemoryConsent;
}

export function getConsentServerSnapshot(): ConsentSnapshot {
  return "unknown";
}

export function storeConsent(value: ConsentValue) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(value)}; max-age=${CONSENT_MAX_AGE}; path=/; SameSite=Lax${secure}`;
  inMemoryConsent = value;
  listeners.forEach((l) => l());
}

// Prefijos de las cookies que dejan los trackers. Al retirar el consentimiento
// hay que ELIMINARLAS (criterio AEPD): dejar de cargar el script no alcanza.
// Las escribe JavaScript sobre nuestro dominio (first-party a efectos de
// document.cookie), así que podemos borrarlas nosotros.
const TRACKER_COOKIE_PREFIXES = ["_ga", "_gid", "_gat", "_fbp", "_fbc", "_clck", "_clsk", "_clarity"];

export function clearTrackerCookies() {
  const host = window.location.hostname;
  for (const entry of document.cookie.split("; ")) {
    const name = entry.split("=")[0];
    if (!TRACKER_COOKIE_PREFIXES.some((p) => name.startsWith(p))) continue;
    for (const domain of ["", `; domain=${host}`, `; domain=.${host}`]) {
      document.cookie = `${name}=; max-age=0; path=/${domain}`;
    }
  }
}
