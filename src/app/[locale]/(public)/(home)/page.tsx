import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "./_components/hero";
import { StatsBar } from "./_components/stats-bar";
import { FeaturedPropertiesSection } from "./_components/featured-properties-section";
import { FeaturedProjects } from "./_components/featured-projects";
import { FeaturedNews } from "./_components/featured-news";
import { CtaSection } from "./_components/cta-section";
import { RevealSection } from "@/components/shared/reveal-section";
import { generateSeoMetadata } from "@/lib/seo";
import { buildStaticContext } from "@/lib/seo-context";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.home");
  return generateSeoMetadata("HOME", buildStaticContext(), {
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.home");

  return (
    <>
      <Hero />
      <RevealSection>
        <StatsBar />
      </RevealSection>
      <RevealSection>
        <FeaturedPropertiesSection
          transactionType="SALE"
          eyebrow={t("saleEyebrow")}
          title={t("saleTitle")}
          description={t("saleDesc")}
          sectionClassName="bg-white"
        />
      </RevealSection>
      <RevealSection>
        <FeaturedPropertiesSection
          transactionType="RENT"
          eyebrow={t("rentEyebrow")}
          title={t("rentTitle")}
          description={t("rentDesc")}
          sectionClassName="bg-surface-muted/30"
        />
      </RevealSection>
      <RevealSection>
        <FeaturedProjects />
      </RevealSection>
      <RevealSection>
        <FeaturedNews />
      </RevealSection>
      <RevealSection>
        <CtaSection />
      </RevealSection>
    </>
  );
}
