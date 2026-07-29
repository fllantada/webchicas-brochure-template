"use client";

import Script from "next/script";

/**
 * Meta Pixel — solo lo monta <Analytics/> tras consentimiento (o consent "off").
 * Solo carga en producción real (NEXT_PUBLIC_VERCEL_ENV): ver nota en Clarity.tsx.
 * El espejo server-side (Conversions API) debe gatearse con
 * hasMarketingConsent() de src/server/shared/consent.ts antes de CADA evento.
 */
export default function MetaPixel({
  pixelId,
}: {
  /** Pixel ID de Meta (viene de NEXT_PUBLIC_META_PIXEL_ID). */
  pixelId: string;
}) {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', ${JSON.stringify(pixelId)});
      fbq('track', 'PageView');`}
    </Script>
  );
}
