"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Eye,
  Handshake,
  LineChart,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { RevealSection } from "@/components/shared/reveal-section";
import { PageBanner } from "@/components/shared/page-banner";
import { CtaCard } from "@/components/shared/cta/cta-card";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const t = useTranslations("public.about");
  const tc = useTranslations("public.common");

  const milestones = [
    {
      year: "2023", title: t("t1Title"), desc: t("t1Desc"),
      circle: "border-blue-500 text-blue-600 group-hover:bg-blue-500",
      titleHover: "group-hover:text-blue-600",
    },
    {
      year: "2024", title: t("t2Title"), desc: t("t2Desc"),
      circle: "border-emerald-500 text-emerald-600 group-hover:bg-emerald-500",
      titleHover: "group-hover:text-emerald-600",
    },
    {
      year: "2025", title: t("t3Title"), desc: t("t3Desc"),
      circle: "border-amber-500 text-amber-600 group-hover:bg-amber-500",
      titleHover: "group-hover:text-amber-600",
    },
    {
      year: "2026", title: t("t4Title"), desc: t("t4Desc"),
      circle: "border-violet-500 text-violet-600 group-hover:bg-violet-500",
      titleHover: "group-hover:text-violet-600",
    },
  ];

  const values = [
    { icon: Users, title: t("v1Title"), desc: t("v1Desc"), color: "bg-blue-100 text-blue-600" },
    { icon: Handshake, title: t("v2Title"), desc: t("v2Desc"), color: "bg-emerald-100 text-emerald-600" },
    { icon: Shield, title: t("v3Title"), desc: t("v3Desc"), color: "bg-violet-100 text-violet-600" },
    { icon: Zap, title: t("v4Title"), desc: t("v4Desc"), color: "bg-amber-100 text-amber-600" },
    { icon: Sparkles, title: t("v5Title"), desc: t("v5Desc"), color: "bg-rose-100 text-rose-600" },
    { icon: LineChart, title: t("v6Title"), desc: t("v6Desc"), color: "bg-teal-100 text-teal-600" },
  ];

  const stats = [
    { value: "45+", label: t("statsAgency"), icon: Building2, color: "bg-blue-100 text-blue-600" },
    { value: "10K+", label: t("statsDeals"), icon: Handshake, color: "bg-emerald-100 text-emerald-600" },
    { value: "50K+", label: t("statsCustomers"), icon: Users, color: "bg-amber-100 text-amber-600" },
    { value: "99.9%", label: t("statsUptime"), icon: LineChart, color: "bg-violet-100 text-violet-600" },
  ];

  return (
    <>
      <PageBanner
        title={t("bannerTitle")}
        description={t("bannerDesc")}
        backgroundImage="/background/about.jpg"
        breadcrumbs={[{ label: tc("home"), href: "/" }, { label: tc("aboutUs") }]}
      />

      {/* Stats Bar */}
      <section className="border-y border-border bg-[#F9FAFB] py-8">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className={cn(
                  "group flex cursor-pointer flex-col items-center gap-3 rounded-2xl px-6 py-6 text-center transition-colors duration-300 hover:bg-surface md:px-10 md:py-8"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-300 group-hover:shadow-sm md:h-16 md:w-16",
                    item.color,
                  )}
                >
                  <item.icon size={32} className="transition-transform duration-300 group-hover:scale-110" strokeWidth={1.8} />
                </motion.div>
                <span className="font-serif text-3xl font-semibold tabular-nums tracking-tighter md:text-4xl">
                  {item.value}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground-muted">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sứ mệnh & Tầm nhìn */}
      <div className="container py-16 md:py-24">
        <RevealSection className="mb-20">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-8 transition-shadow hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]">
              <div className="flex size-12 items-center justify-center rounded-lg bg-blue-100">
                <Target size={24} className="text-blue-600" />
              </div>
              <h2 className="font-serif text-2xl font-semibold">{t("mission")}</h2>
              <p className="text-base leading-relaxed text-foreground-muted">
                {t("missionDesc")}
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-8 transition-shadow hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]">
              <div className="flex size-12 items-center justify-center rounded-lg bg-violet-100">
                <Eye size={24} className="text-violet-600" />
              </div>
              <h2 className="font-serif text-2xl font-semibold">{t("vision")}</h2>
              <p className="text-base leading-relaxed text-foreground-muted">
                {t("visionDesc")}
              </p>
            </div>
          </div>
        </RevealSection>

        {/* Giá trị cốt lõi */}
        <RevealSection className="mb-20">
          <div>
            <div className="mb-8 flex flex-col gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-primary">{t("valuesEyebrow")}</span>
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                {t("valuesTitle")}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]"
                >
                  <div className={cn("flex size-11 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110", v.color)}>
                    <v.icon size={22} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-foreground-muted">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* Hành trình phát triển — timeline */}
        <RevealSection className="mb-20">
          <div>
            <div className="mb-8 flex flex-col gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-primary">{t("journeyEyebrow")}</span>
              <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                {t("journeyTitle")}
              </h2>
            </div>
            <div className="relative grid gap-6 md:grid-cols-4">
              <div className="absolute left-0 right-0 top-6 hidden h-px bg-border md:block" />
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -8 }}
                  className="group relative flex cursor-pointer flex-col gap-2 rounded-xl p-3 -m-3 transition-colors duration-300 hover:bg-surface-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-full border-2 bg-surface font-serif text-sm font-semibold transition-all duration-300 group-hover:scale-110 group-hover:text-white",
                      m.circle,
                    )}>
                      {m.year}
                    </div>
                  </div>
                  <h3 className={cn("mt-2 font-serif text-lg font-semibold transition-colors duration-300", m.titleHover)}>{m.title}</h3>
                  <p className="text-sm leading-relaxed text-foreground-muted">{m.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* CTA section */}
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
      </div>
    </>
  );
}
