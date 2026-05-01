import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pickLocale, type Locale } from "@/i18n/locales";
import { HeaderSC } from "@/components/layout/Header/HeaderSC";
import Footer from "@/components/layout/Footer";
import MobileStickyCTA from "@/components/ui/MobileStickyCTA";
import { getContact } from "@/server/datasources/contact/MongoContactRepo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("layout");
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"),
    title: {
      default: t("title_default"),
      template: t("title_template"),
    },
    description: t("description"),
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: t("og_site_name"),
      title: t("og_title"),
      description: t("og_description"),
      images: [
        {
          url: "/images/og-home.jpg",
          width: 1200,
          height: 630,
          alt: t("og_image_alt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitter_title"),
      description: t("twitter_description"),
      images: ["/images/og-home.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Convierte el array `schedule` del admin a `openingHoursSpecification` de
 * schema.org. Heurística: extrae el primer rango HH:MM — HH:MM del campo
 * `hours.es` y lo aplica al/los días del label. Si el cliente cambia el
 * formato (ej. "Cerrado"), simplemente no se incluye ese día.
 */
function buildOpeningHours(schedule: { label: { es: string; en: string }; hours: { es: string; en: string } }[]) {
  const dayMap: Record<string, string> = {
    lunes: "Monday",
    martes: "Tuesday",
    miércoles: "Wednesday",
    miercoles: "Wednesday",
    jueves: "Thursday",
    viernes: "Friday",
    sábado: "Saturday",
    sabado: "Saturday",
    domingo: "Sunday",
  };

  const out: { "@type": string; dayOfWeek: string; opens: string; closes: string }[] = [];

  for (const item of schedule) {
    const labelLower = item.label.es.toLowerCase();
    const hoursMatch = item.hours.es.match(/(\d{1,2}):(\d{2})\s*[—–-]\s*(\d{1,2}):(\d{2})/);
    if (!hoursMatch) continue;

    const opens = `${hoursMatch[1].padStart(2, "0")}:${hoursMatch[2]}`;
    const closes = `${hoursMatch[3].padStart(2, "0")}:${hoursMatch[4]}`;

    for (const [keyword, dayName] of Object.entries(dayMap)) {
      if (labelLower.includes(keyword)) {
        out.push({ "@type": "OpeningHoursSpecification", dayOfWeek: dayName, opens, closes });
      }
    }
  }

  // Si no detectamos nada, fallback al horario clásico para no perder SEO.
  if (out.length === 0) {
    return SCHEMA_DAYS.slice(0, 6).map((d) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: d,
      opens: "09:30",
      closes: "17:30",
    }));
  }

  return out;
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const tc = await getTranslations("common");

  // Cargar contact del server (cacheado por request) y serializarlo para CC.
  const contact = await getContact();
  const plainContact = JSON.parse(
    JSON.stringify({
      key: contact.key,
      phone: contact.phone,
      phoneRaw: contact.phoneRaw,
      whatsapp: contact.whatsapp,
      email: contact.email,
      addressStreet: contact.addressStreet,
      addressCity: contact.addressCity,
      mapEmbedUrl: contact.mapEmbedUrl,
      schedule: contact.schedule,
      social: contact.social,
      booksyUrl: contact.booksyUrl,
    }),
  );

  // JSON-LD dinámico — usa datos del admin (contact) y env vars de marca.
  // Si el cliente quiere especializar el `@type` (BeautySalon, Restaurant,
  // ProfessionalService, etc), sobreescribir con `NEXT_PUBLIC_SCHEMA_TYPE`.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": process.env.NEXT_PUBLIC_SCHEMA_TYPE || "LocalBusiness",
    name: process.env.NEXT_PUBLIC_BRAND_NAME || "Brand",
    description: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: pickLocale(plainContact.addressStreet, locale as Locale),
      addressLocality: pickLocale(plainContact.addressCity, locale as Locale),
      addressCountry: process.env.NEXT_PUBLIC_BRAND_COUNTRY || undefined,
    },
    telephone: plainContact.phoneRaw ? `+${plainContact.phoneRaw}` : undefined,
    email: plainContact.email || undefined,
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || undefined,
    openingHoursSpecification: buildOpeningHours(plainContact.schedule),
    sameAs: [plainContact.social.facebook, plainContact.social.instagram].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        {tc("skip_to_content")}
      </a>
      <NextIntlClientProvider messages={messages}>
        <HeaderSC contact={plainContact} locale={locale} />
        <main id="main">{children}</main>
        <Footer contact={plainContact} />
        <MobileStickyCTA booksyUrl={plainContact.booksyUrl} />
      </NextIntlClientProvider>
    </>
  );
}
