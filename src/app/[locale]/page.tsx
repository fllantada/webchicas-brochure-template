import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { listMedia } from "@/server/datasources/media/MediaApi";
import { getContact } from "@/server/datasources/contact/MongoContactRepo";

/** Slots de secciones narrativas que el cliente puede tener (1-5). */
const SECTION_SLOTS = ["section1", "section2", "section3", "section4", "section5"] as const;

/**
 * Home del template — hero + secciones narrativas + final CTA. Toma:
 *   - Hero image desde media (key="hero-main"). Si no hay, muestra placeholder.
 *   - Hero copy desde messages/{locale}.json (namespace "home")
 *   - Secciones narrativas dinámicas: si home.section{N}.title existe (no vacío),
 *     se renderiza alternando layout image-left/image-right con images del admin
 *     (key="home-section{N}" si existe). El cliente puede tener 0-5 secciones.
 *   - CTAs desde contact (Booksy, WhatsApp)
 *
 * Las secciones narrativas se llenan vía `migrate-content.ts` desde la captura
 * del sitio original (extracted/sections.json). Quedan en messages.json para
 * editarse via redeploy (filosofía shena: copy de marca = código, no admin).
 */
export default async function HomePage() {
  const t = await getTranslations("home");
  const allMedia = await listMedia();
  const heroMedia = allMedia.find((m) => m.key === "hero-main");
  const contact = await getContact();

  const narrativeSections = SECTION_SLOTS.map((slot) => ({
    slot,
    title: t(`${slot}.title`),
    body: t(`${slot}.body`),
    media: allMedia.find((m) => m.key === `home-${slot}`),
  })).filter((s) => s.title.trim().length > 0);

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

      {/* Secciones narrativas dinámicas — solo render si home.sectionN.title no vacío */}
      {narrativeSections.map((section, idx) => {
        const imgFirst = idx % 2 === 0;
        const bgClass = idx % 2 === 0 ? "bg-bg" : "bg-surface";
        return (
          <section
            key={section.slot}
            className={`${bgClass} py-20 md:py-28 px-6 border-t border-border`}
          >
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              {section.media && (
                <div
                  className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-elevated ${
                    imgFirst ? "md:order-1" : "md:order-2"
                  }`}
                >
                  <Image
                    src={section.media.variants.webp.hero}
                    alt={section.media.alt.es || section.title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    placeholder={section.media.blurDataURL ? "blur" : "empty"}
                    blurDataURL={section.media.blurDataURL}
                  />
                </div>
              )}
              <div
                className={
                  section.media
                    ? imgFirst
                      ? "md:order-2"
                      : "md:order-1"
                    : "md:col-span-2 max-w-3xl mx-auto text-center"
                }
              >
                <h2 className="font-heading text-3xl md:text-5xl text-ink leading-[1.1] tracking-tight mb-6">
                  {section.title}
                </h2>
                <p className="text-muted leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
              </div>
            </div>
          </section>
        );
      })}

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
