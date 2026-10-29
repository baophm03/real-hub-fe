"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquareText } from "lucide-react";

interface CtaCardProps {
  /** Nhãn nhỏ uppercase phía trên tiêu đề */
  eyebrow?: string;
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  /** Ảnh nền phía sau lớp overlay xanh đậm */
  backgroundImage?: string;
}

/** CTA dạng banner ảnh nền + overlay xanh đậm, nhúng trong container (thường bọc ngoài bằng RevealSection). */
export function CtaCard({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  backgroundImage = "/background/home-banner.webp",
}: CtaCardProps) {
  return (
    <section className="relative overflow-hidden bg-[#0B2A0B]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-[#0B2A0B]/70 via-[#0B2A0B]/60 to-[#0B2A0B]/80" />

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 py-20 text-center md:gap-7 md:py-28"
      >
        {eyebrow && (
          <span className="w-fit rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
            {eyebrow}
          </span>
        )}

        <h2 className="max-w-[20ch] font-serif text-3xl font-semibold leading-[1.1] tracking-tighter text-balance text-white md:text-5xl">
          {title}
        </h2>

        {description && (
          <p className="max-w-[52ch] text-sm leading-relaxed text-white/70 md:text-base">
            {description}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:gap-4">
          <Button
            size="lg"
            className="bg-[#1D4D36] text-white shadow-lg shadow-black/20 hover:bg-[#1D4D36]/85"
            render={<Link href={primaryHref} />}
            rightIcon={
              <span className="flex items-center justify-center">
                <ArrowRight size={14} />
              </span>
            }
          >
            {primaryLabel}
          </Button>
          {secondaryLabel && secondaryHref && (
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              render={<Link href={secondaryHref} />}
              leftIcon={
                <span className="flex items-center justify-center">
                  <MessageSquareText size={14} />
                </span>
              }
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
