import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ConsentPreferences from "@/components/analytics/ConsentPreferences";
import { TRACKER_IDS } from "@/components/analytics/consent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cookies");
  return {
    title: t("page_title"),
  };
}

export default async function CookiesPage() {
  const t = await getTranslations("cookies");

  return (
    <section className="bg-bg py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-5">
          Legal
        </p>
        <h1 className="font-heading text-4xl md:text-6xl text-ink mb-12 tracking-tight leading-[1.05]">
          {t("title")}
        </h1>

        <p className="text-muted leading-relaxed mb-8">{t("intro")}</p>

        <div className="space-y-3 text-ink text-sm mb-8">
          <p><span className="text-muted mr-2 uppercase tracking-widest text-xs">{t("responsible")}</span>{t("responsible_name")}</p>
          <p><span className="text-muted mr-2 uppercase tracking-widest text-xs">{t("email")}</span>{t("email_value")}</p>
        </div>

        <div className="border-t border-border pt-8">
          <h2 className="font-heading text-2xl text-ink mb-4 tracking-tight">
            {t("list_title")}
          </h2>
          <ul className="space-y-3 text-muted leading-relaxed list-disc pl-6">
            <li>{t("list_essential")}</li>
            {TRACKER_IDS.clarity && <li>{t("list_clarity")}</li>}
            {TRACKER_IDS.metaPixel && <li>{t("list_meta")}</li>}
            {TRACKER_IDS.ga && <li>{t("list_ga")}</li>}
          </ul>
        </div>

        <p className="text-muted leading-relaxed mt-8">{t("authorization")}</p>

        <ConsentPreferences />
      </div>
    </section>
  );
}
