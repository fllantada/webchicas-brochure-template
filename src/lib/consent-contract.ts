// Contrato del consentimiento de cookies — compartido entre el store del
// browser (components/analytics/Analytics/consent.ts), el gate del server
// (server/shared/consent.ts) y la página /cookies. Puro: sin DOM, sin
// "use client" — por eso vive en lib/ y no dentro de un componente.

export type ConsentValue = "accepted" | "rejected";

// "unknown" = server/hidratación, todavía no pudimos leer la cookie del browser.
export type ConsentSnapshot = ConsentValue | null | "unknown";

export const CONSENT_COOKIE = "cookie_consent";

// La AEPD recomienda renovar el consentimiento periódicamente: 6 meses.
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

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

// El "QUÉ" se consintió, no solo el "sí/no": la cookie guarda la decisión junto
// al scope de trackers vigente (ej. "accepted:cm"). Si el cliente activa un
// tracker nuevo después, el scope deja de coincidir y se vuelve a preguntar —
// el consentimiento viejo no cubre una finalidad sobre la que el visitante
// nunca fue informado (RGPD: consentimiento por finalidades).
export function consentScope(): string {
  return [
    TRACKER_IDS.clarity && "c",
    TRACKER_IDS.metaPixel && "m",
    TRACKER_IDS.ga && "g",
  ]
    .filter(Boolean)
    .join("");
}

export function serializeConsent(value: ConsentValue): string {
  return `${value}:${consentScope()}`;
}

// Parsea el valor crudo de la cookie validando el scope: una decisión tomada
// bajo otro scope (o con el formato viejo sin scope) cuenta como "no decidió".
export function parseConsent(raw: string | undefined): ConsentValue | null {
  if (!raw) return null;
  const [value, scope] = raw.split(":");
  if (value !== "accepted" && value !== "rejected") return null;
  if (scope !== consentScope()) return null;
  return value;
}
