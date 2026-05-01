import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rgpd");
  return {
    title: t("page_title"),
  };
}

export default async function RgpdPage() {
  const t = await getTranslations("rgpd");

  return (
    <section className="bg-bg py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-5">
          Legal
        </p>
        <h1 className="font-heading text-4xl md:text-6xl text-ink mb-12 tracking-tight leading-[1.05]">
          {t("title")}
        </h1>

        <div className="space-y-3 text-ink mb-12 text-sm">
          <p><span className="text-muted mr-2 uppercase tracking-widest text-xs">{t("responsible")}</span>{t("responsible_name")}</p>
          <p><span className="text-muted mr-2 uppercase tracking-widest text-xs">{t("cif")}</span>{t("cif_value")}</p>
          <p><span className="text-muted mr-2 uppercase tracking-widest text-xs">{t("address")}</span>{t("address_value")}</p>
          <p><span className="text-muted mr-2 uppercase tracking-widest text-xs">{t("email")}</span>{t("email_value")}</p>
          <p><span className="text-muted mr-2 uppercase tracking-widest text-xs">{t("legal_basis")}</span>{t("legal_basis_value")}</p>
        </div>

        <div className="border-t border-border pt-12 space-y-12">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl text-ink mb-5 tracking-tight">
              {t("purpose_title")}
            </h2>
            <p className="text-muted leading-relaxed">{t("purpose_text")}</p>
          </div>

          <div>
            <h2 className="font-heading text-2xl md:text-3xl text-ink mb-5 tracking-tight">
              {t("rights_title")}
            </h2>
            <p className="text-muted leading-relaxed mb-4">{t("rights_text")}</p>
            <p className="text-muted leading-relaxed">
              {t("rights_contact")}{" "}
              <a
                href="mailto:esteticashena@hotmail.com"
                className="text-accent hover:underline underline-offset-4"
              >
                esteticashena@hotmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
