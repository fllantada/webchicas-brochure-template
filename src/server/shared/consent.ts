import { cookies } from "next/headers";
import { CONSENT_COOKIE } from "@/components/analytics/consent";

// Gate server-side del consentimiento — para eventos que NO pasan por el
// browser (ej. Meta Conversions API). Regla: NINGÚN evento CAPI se emite sin
// que esta función devuelva true para la request del visitante.
export async function hasMarketingConsent(): Promise<boolean> {
  // Mismo switch maestro que el cliente: "off" = cliente fuera de la UE, sin gating.
  if (process.env.NEXT_PUBLIC_COOKIE_CONSENT === "off") return true;
  const store = await cookies();
  return store.get(CONSENT_COOKIE)?.value === "accepted";
}
