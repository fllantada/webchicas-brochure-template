"use client";

import Script from "next/script";

/**
 * Microsoft Clarity — heatmaps y grabaciones de sesión.
 * Solo lo monta <Analytics/> cuando el visitante consintió (o consent "off").
 * Solo carga en producción REAL (NEXT_PUBLIC_VERCEL_ENV === "production"):
 * los previews de Vercel corren con NODE_ENV=production, y gatear por NODE_ENV
 * mandaría nuestras sesiones de QA a los datos del cliente.
 */
export default function Clarity({
  projectId,
}: {
  /** Project ID de Clarity (viene de NEXT_PUBLIC_CLARITY_PROJECT_ID). */
  projectId: string;
}) {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return null;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", ${JSON.stringify(projectId)});`}
    </Script>
  );
}
