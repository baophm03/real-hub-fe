"use client";

import { useTranslations } from "next-intl";
import { CtaBanner } from "@/components/shared/cta/cta-banner";

export function CtaSection() {
  const t = useTranslations("public.home");
  return (
    <CtaBanner
      eyebrow={t("ctaEyebrow")}
      title={t("ctaTitle")}
      description={t("ctaDesc")}
      primaryLabel={t("ctaJoin")}
      primaryHref="/register"
      secondaryLabel={t("ctaContact")}
      secondaryHref="/contact"
    />
  );
}
