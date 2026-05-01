import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { pickLocale, type Locale } from "@/i18n/locales";
import { getContact } from "@/server/datasources/contact/MongoContactRepo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return {
    title: t("page_title"),
    description: t("page_description"),
    openGraph: {
      images: [{ url: "/images/og-home.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function ContactoPage() {
  const t = await getTranslations("contact");
  const locale = (await getLocale()) as Locale;
  const contact = await getContact();

  return (
    <>
      {/* Header */}
      <section className="bg-bg py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-5xl md:text-7xl text-ink mb-6 tracking-tight leading-[1.05]">
            {t("title")}
          </h1>
          <h2 className="font-heading text-2xl md:text-3xl text-muted mb-4">
            {t("subtitle")}
          </h2>
          <p className="text-muted leading-relaxed max-w-2xl">
            {t("subtitle_detail")}
          </p>
        </div>
      </section>

      {/* Contact info + form */}
      <section className="bg-bg pb-24 md:pb-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[5fr_7fr] gap-16 md:gap-24">
          {/* Info */}
          <div className="space-y-10">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-accent mb-3">
                {t("address_title")}
              </h3>
              <p className="text-ink">{pickLocale(contact.addressStreet, locale)}</p>
              <p className="text-muted">{pickLocale(contact.addressCity, locale)}</p>
            </div>

            {contact.phoneRaw && (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-accent mb-3">
                  {t("phone_title")}
                </h3>
                <a
                  href={`tel:+${contact.phoneRaw}`}
                  className="font-heading text-2xl text-ink hover:text-accent transition-colors"
                >
                  {contact.phone || contact.phoneRaw}
                </a>
              </div>
            )}

            {contact.whatsapp && (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-accent mb-3">
                  {t("whatsapp_title")}
                </h3>
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-heading text-2xl text-ink hover:text-accent transition-colors"
                >
                  {contact.phone || contact.whatsapp}
                </a>
              </div>
            )}

            {contact.schedule.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-accent mb-3">
                  {t("schedule_title")}
                </h3>
                <div className="space-y-1.5 text-ink text-sm">
                  {contact.schedule.map((item) => (
                    <p key={item.id}>
                      {pickLocale(item.label, locale)}
                      {item.hours && (
                        <>
                          <span className="text-muted">: </span>
                          <span>{pickLocale(item.hours, locale)}</span>
                        </>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {(contact.social.facebook || contact.social.instagram) && (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-accent mb-3">
                  {t("social_title")}
                </h3>
                <div className="flex gap-6 text-sm">
                  {contact.social.facebook && (
                    <a
                      href={contact.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:text-accent transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                  {contact.social.instagram && (
                    <a
                      href={contact.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:text-accent transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div>
            <h3 className="font-heading text-3xl md:text-4xl text-ink mb-4 tracking-tight">
              {t("form_title")}
            </h3>
            <p className="text-muted mb-10 leading-relaxed">{t("form_intro")}</p>
            <form
              action={`https://formsubmit.co/${contact.email || "info@example.com"}`}
              method="POST"
              className="space-y-8"
            >
              <input type="hidden" name="_subject" value={t("form_subject")} />
              <input type="hidden" name="_captcha" value="false" />
              <input
                type="hidden"
                name="_next"
                value="${process.env.NEXT_PUBLIC_FRONTEND_URL}/contacto"
              />
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs uppercase tracking-widest text-muted mb-2"
                >
                  {t("form_name")}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full bg-transparent border-0 border-b border-border focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent py-2 text-base text-ink transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-widest text-muted mb-2"
                >
                  {t("form_email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full bg-transparent border-0 border-b border-border focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent py-2 text-base text-ink transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-xs uppercase tracking-widest text-muted mb-2"
                >
                  {t("form_message")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  className="w-full bg-transparent border-0 border-b border-border focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent py-2 text-base text-ink transition-colors resize-none"
                />
              </div>
              <div className="flex items-start gap-3">
                <input
                  id="privacy"
                  name="_privacy"
                  type="checkbox"
                  required
                  className="mt-0.5 w-4 h-4 accent-accent cursor-pointer"
                />
                <label htmlFor="privacy" className="text-xs text-muted leading-relaxed">
                  {t("form_privacy")}
                </label>
              </div>
              <button
                type="submit"
                className="bg-accent text-white text-sm font-medium px-8 py-3 rounded hover:bg-accent-hover transition-colors tracking-wide"
              >
                {t("form_submit")}
              </button>
            </form>
            {contact.email && (
              <p className="text-xs text-subtle mt-6">
                {t("form_email_label")} {contact.email}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Booksy CTA */}
      {contact.booksyUrl && (
        <section className="bg-surface py-16 md:py-20 px-6 text-center border-t border-border">
          <h3 className="font-heading text-2xl md:text-3xl text-ink mb-6 tracking-tight">
            {t("booksy_title")}
          </h3>
          <a
            href={contact.booksyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-accent text-white text-sm font-medium px-8 py-3 rounded hover:bg-accent-hover transition-colors tracking-wide"
          >
            {t("booksy_cta")}
          </a>
        </section>
      )}

      {/* Map */}
      {contact.mapEmbedUrl && (
        <section>
          <iframe
            src={contact.mapEmbedUrl}
            className="w-full h-[450px] border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={t("map_title")}
          />
        </section>
      )}
    </>
  );
}
