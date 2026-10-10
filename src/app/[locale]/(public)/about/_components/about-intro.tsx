"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RevealSection } from "@/components/shared/reveal-section";
import { cn } from "@/lib/utils";

const MAIN_IMAGE = "/background/home/home1.jpg";
const OVERLAY_IMAGE = "/background/home/home2.jpg";

/** Section đầu tiên trang About: nội dung + collage ảnh + hàng thống kê phân tách bằng đường kẻ. */
export function AboutIntro() {
  const t = useTranslations("public.about");

  const stats = [
    { value: "45+", label: t("statsAgency") },
    { value: "10K+", label: t("statsDeals") },
    { value: "50K+", label: t("statsCustomers") },
    { value: "99.9%", label: t("statsUptime") },
  ];

  return (
    <section className="container py-16 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Nội dung */}
        <RevealSection>
          <div className="flex flex-col items-start gap-6">
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-primary">
              {t("introEyebrow")}
            </span>
            <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              {t("introTitle")}
            </h2>
            <p className="max-w-[52ch] text-base leading-relaxed text-foreground-muted md:text-lg">
              {t("introDesc")}
            </p>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 border-b border-primary/40 pb-1 text-sm font-medium text-primary transition-colors hover:border-primary"
            >
              {t("introMore")}
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </RevealSection>

        {/* Collage ảnh */}
        <RevealSection delay={0.15}>
          <div className="relative mx-auto w-full max-w-[520px]">
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl md:aspect-[4/4.6]"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${MAIN_IMAGE})` }}
              />
            </motion.div>

            {/* Ảnh phụ chồng lệch xuống dưới bên trái */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-8 -left-4 w-[46%] overflow-hidden rounded-xl border-4 border-background shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)] md:-left-10 md:w-[44%]"
            >
              <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${OVERLAY_IMAGE})` }} />
            </motion.div>
          </div>
        </RevealSection>
      </div>

      {/* Hàng thống kê — phân tách bằng đường kẻ */}
      <RevealSection className="mt-20 md:mt-28">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex flex-col gap-2 px-2 py-8 text-center md:py-10",
                i > 0 && "border-l border-border",
                i === 2 && "max-lg:border-l-0 max-lg:border-t max-lg:border-border",
                i === 3 && "max-lg:border-t max-lg:border-border",
              )}
            >
              <span className="font-serif text-4xl font-semibold tabular-nums tracking-tight md:text-5xl">
                {item.value}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground-muted">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </RevealSection>
    </section>
  );
}
