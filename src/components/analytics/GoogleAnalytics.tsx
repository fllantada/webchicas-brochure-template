"use client";

import Script from "next/script";

// Google Analytics 4 — solo lo monta <Analytics/> tras consentimiento (o consent "off").
export default function GoogleAnalytics({
  measurementId,
}: {
  measurementId: string;
}) {
  if (process.env.NODE_ENV !== "production") return null;

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
