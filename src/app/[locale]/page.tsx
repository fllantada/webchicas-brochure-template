import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listMedia } from "@/server/datasources/media/MediaApi";
import { getContact } from "@/server/datasources/contact/MongoContactRepo";

/**
 * Home genérico del template — minimal y limpio. Toma:
 *   - Hero image desde media (key="hero-main"). Si no hay, muestra placeholder.
 *   - Copy desde messages/{locale}.json (namespace "home")
 *   - CTAs desde contact (Booksy, WhatsApp)
 *
 * Cada cliente puede customizar este archivo a su gusto. El template solo
 * provee una base navegable que funciona out-of-the-box.
 */
export default async function HomePage() {
  const t = await getTranslations("home");
  const allMedia = await listMedia();
  const heroMedia = allMedia.find((m) => m.key === "hero-main");
  const contact = await getContact();

  return (
    <>
      {/* Hero */}
      <section className="bg-bg py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h1 className="font-heading text-4xl md:text-6xl text-ink leading-[1.05] mb-6 tracking-tight">
              {t("hero_title")}
            </h1>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              {t("hero_subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              {contact.booksyUrl && (
                <a
                  href={contact.booksyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent text-white text-sm font-semibold px-7 py-3.5 rounded hover:bg-accent-hover transition-colors tracking-wide"
                >
                  {t("hero_cta_book")}
                </a>
              )}
              <Link
                href="/contacto"
                className="border border-ink text-ink text-sm font-medium px-7 py-3.5 rounded hover:bg-ink/5 transition-colors tracking-wide"
              >
                {t("hero_cta_contact")}
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/5] md:aspect-square overflow-hidden rounded-2xl bg-surface">
            {heroMedia ? (
              <Image
                src={heroMedia.variants.webp.hero}
                alt={heroMedia.alt.es || ""}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                placeholder={heroMedia.blurDataURL ? "blur" : "empty"}
                blurDataURL={heroMedia.blurDataURL}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-subtle text-sm">
                Subí tu imagen hero desde /admin/media
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-surface py-20 md:py-28 px-6 text-center border-t border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-5xl text-ink mb-6 tracking-tight leading-[1.1]">
            {t("cta_title")}
          </h2>
          <p className="text-muted mb-8 leading-relaxed max-w-md mx-auto">
            {t("cta_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {contact.booksyUrl && (
              <a
                href={contact.booksyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent text-white text-sm font-semibold px-8 py-3.5 rounded hover:bg-accent-hover transition-colors tracking-wide"
              >
                {t("cta_book")}
              </a>
            )}
            {contact.whatsapp && (
              <a
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-ink text-ink text-sm font-medium px-8 py-3.5 rounded hover:bg-ink/5 transition-colors tracking-wide"
              >
                {t("cta_whatsapp")}
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
