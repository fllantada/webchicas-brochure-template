"use client";

import Script from "next/script";

/**
 * Google Analytics 4 — solo lo monta <Analytics/> tras consentimiento (o
 * consent "off"). Solo carga en producción real (NEXT_PUBLIC_VERCEL_ENV):
 * ver nota en Clarity.tsx.
 */
export default function GoogleAnalytics({
  measurementId,
}: {
  /** Measurement ID de GA4, formato G-XXXXXXX (viene de NEXT_PUBLIC_GA_MEASUREMENT_ID). */
  measurementId: string;
}) {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', ${JSON.stringify(measurementId)});`}
      </Script>
    </>
  );
}
