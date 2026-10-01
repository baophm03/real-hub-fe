import type { Metadata } from "next";
import { Send } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "./_components/contact-form";
import { RevealSection } from "@/components/shared/reveal-section";
import { PageBanner } from "@/components/shared/page-banner";
import { ContactInfoList } from "@/components/shared/contact-info-list";
import { generateSeoMetadata } from "@/lib/seo";
import { buildStaticContext } from "@/lib/seo-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.contact");
  return generateSeoMetadata("CONTACT", buildStaticContext(), {
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default async function ContactPage() {
  const t = await getTranslations("public.contact");
  const tc = await getTranslations("public.common");
  const tp = await getTranslations("public");

  return (
    <>
      <PageBanner
        title={t("bannerTitle")}
        description={t("bannerDesc")}
        backgroundImage="/background/contact.jpg"
        breadcrumbs={[{ label: tc("home"), href: "/" }, { label: tp("nav.contact") }]}
      />

      <div className="container py-16 md:py-24">

        <RevealSection>
          <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
            <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-8 shadow-[0_24px_70px_-24px_rgba(45,95,63,0.14)]">
              <div className="flex items-start gap-4">
                <Send size={24} className="mt-1 shrink-0 text-blue-600" />
                <div className="flex flex-col gap-1">
                  <h2 className="font-serif text-2xl font-semibold tracking-tight">{t("sendMessage")}</h2>
                  <p className="text-sm text-foreground-muted">{t("sendMessageDesc")}</p>
                </div>
              </div>
              <ContactForm />
            </div>

            <div className="flex flex-col gap-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground-muted">{t("contactInfo")}</h3>
              <ContactInfoList />
            </div>
          </div>
        </RevealSection>
      </div>
    </>
  );
}
