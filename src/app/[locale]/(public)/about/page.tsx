"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Handshake,
  Landmark,
  LineChart,
  Network,
  Rocket,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/shared/reveal-section";
import { PageBanner } from "@/components/shared/page-banner";
import { CtaCard } from "@/components/shared/cta/cta-card";
import { AboutIntro } from "./_components/about-intro";

export default function AboutPage() {
  const t = useTranslations("public.about");
  const tc = useTranslations("public.common");

  const milestones = [
    {
      year: "2023", title: t("t1Title"), desc: t("t1Desc"), highlight: t("t1Highlight"),
      icon: Landmark,
    },
    {
      year: "2024", title: t("t2Title"), desc: t("t2Desc"), highlight: t("t2Highlight"),
      icon: Rocket,
    },
    {
      year: "2025", title: t("t3Title"), desc: t("t3Desc"), highlight: t("t3Highlight"),
      icon: Network,
    },
    {
      year: "2026", title: t("t4Title"), desc: t("t4Desc"), highlight: t("t4Highlight"),
      icon: Globe,
    },
  ];

  const values = [
    { icon: Users, title: t("v1Title"), desc: t("v1Desc"), tag: t("v1Tag") },
    { icon: Handshake, title: t("v2Title"), desc: t("v2Desc"), tag: t("v2Tag") },
    { icon: Shield, title: t("v3Title"), desc: t("v3Desc"), tag: t("v3Tag") },
    { icon: Zap, title: t("v4Title"), desc: t("v4Desc"), tag: t("v4Tag") },
    { icon: Sparkles, title: t("v5Title"), desc: t("v5Desc"), tag: t("v5Tag") },
    { icon: LineChart, title: t("v6Title"), desc: t("v6Desc"), tag: t("v6Tag") },
  ];

  return (
    <>
      <PageBanner
        title={t("bannerTitle")}
        description={t("bannerDesc")}
        backgroundImage="/background/about.jpg"
        breadcrumbs={[{ label: tc("home"), href: "/" }, { label: tc("aboutUs") }]}
      />

      {/* Section giới thiệu đầu tiên — nội dung + collage ảnh + stats */}
      <AboutIntro />

      {/* Giá trị cốt lõi — full width, nền xanh đậm */}
      <section className="bg-[#0B2A0B] py-16 md:py-24">
        <div className="container">
          <RevealSection>
            <div>
              <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-3">
                  <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.25em] text-[#F2D9A0]">
                    <span className="h-px w-6 bg-[#F2D9A0]/60" />
                    {t("valuesEyebrow")}
                  </span>
                  <h2 className="font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    {t("valuesTitle")}
                  </h2>
                </div>
                <p className="max-w-[44ch] text-sm leading-relaxed text-white/70 md:text-base md:text-right">
                  {t("valuesDesc")}
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {values.map((v, i) => (
                  <div
                    key={v.title}
                    className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#123425]/70 p-6 transition-colors duration-300 hover:bg-[#123425]"
                  >
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#F2D9A0]/10 transition-transform duration-300 group-hover:scale-110">
                      <v.icon size={20} className="text-[#F2D9A0]" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F2D9A0]">
                      {String(i + 1).padStart(2, "0")} • {v.tag}
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-white">{v.title}</h3>
                    <p className="text-sm leading-relaxed text-white/70">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Hành trình phát triển — timeline */}
      <div className="container py-16 md:py-24">
        <RevealSection>
          <div>
            <div className="mb-12 flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground-muted">
                <span className="size-1.5 rounded-full bg-foreground" />
                {t("journeyEyebrow")}
              </span>
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                {t("journeyTitle")}
              </h2>
              <p className="max-w-[60ch] text-sm leading-relaxed text-foreground-muted md:text-base">
                {t("journeyDesc")}
              </p>
            </div>
            <div className="relative grid gap-6 md:grid-cols-4">
              <div className="absolute left-0 right-0 top-16 hidden h-px bg-border md:block" />
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -8 }}
                  className="group relative flex flex-col items-center gap-3 rounded-2xl bg-[#123425] p-6 pt-8 text-center text-white shadow-[0_16px_40px_-16px_rgba(11,42,11,0.4)]"
                >
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#F2D9A0] font-serif text-base font-bold text-[#0F2E1F]">
                    {m.year}
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-white/10 transition-transform duration-300 group-hover:scale-110">
                    <m.icon size={16} className="text-[#F2D9A0]" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold">{m.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{m.desc}</p>
                  <div className="mt-auto w-full pt-4">
                    <div className="mb-3 h-px w-full bg-white/10" />
                    <span className="inline-flex items-center gap-2 text-xs text-[#F2D9A0]">
                      <span className="size-1.5 shrink-0 rounded-full bg-[#F2D9A0]" />
                      {m.highlight}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </RevealSection>
      </div>

      {/* CTA section — full width */}
      <RevealSection>
        <CtaCard
          eyebrow={t("joinEyebrow")}
          title={t("joinTitle")}
          description={t("joinDesc")}
          primaryLabel={t("joinNow")}
          primaryHref="/register"
          secondaryLabel={t("contactAdvisory")}
          secondaryHref="/contact"
        />
      </RevealSection>
    </>
  );
}
