import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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

        <p className="text-muted leading-relaxed border-t border-border pt-8">
          {t("preferences")}
        </p>
      </div>
    </section>
  );
}
