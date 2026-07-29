import { cookies } from "next/headers";
import {
  CONSENT_COOKIE,
  consentRequired,
  parseConsent,
} from "@/lib/consent-contract";

// Gate server-side del consentimiento — para eventos que NO pasan por el
// browser (ej. Meta Conversions API). Regla: NINGÚN evento CAPI se emite sin
// que esta función devuelva true para la request del visitante.
// Valida también el scope de trackers (ver consent-contract.ts): un
// consentimiento dado bajo otro juego de trackers no cuenta.
export async function hasMarketingConsent(): Promise<boolean> {
  // Mismo switch maestro que el cliente: "off" = cliente fuera de la UE, sin gating.
  if (!consentRequired()) return true;
  const store = await cookies();
  return parseConsent(store.get(CONSENT_COOKIE)?.value) === "accepted";
}
