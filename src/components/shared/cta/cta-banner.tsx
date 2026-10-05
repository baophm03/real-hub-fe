"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CtaBannerProps {
  /** Nhãn nhỏ uppercase phía trên tiêu đề */
  eyebrow?: string;
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  /** Override nền/padding của section (mặc định: nền xanh đậm) */
  className?: string;
}

export function CtaBanner({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  className,
}: CtaBannerProps) {
  return (
    <section className={cn("bg-[#0B2A0B] py-16 md:py-24", className)}>
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center gap-8 px-6 text-center md:px-8"
      >
        {eyebrow && (
          <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
            {eyebrow}
          </span>
        )}

        <h2 className="max-w-[20ch] font-serif text-3xl font-semibold leading-[1.1] tracking-tighter text-balance text-white md:text-5xl">
          {title}
        </h2>

        {description && (
          <p className="max-w-[44ch] text-base leading-relaxed text-white/60">
            {description}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button
            size="lg"
            className="bg-[#C7EDBB] text-[#1E2220] hover:bg-[#C7EDBB]/90"
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
              className="bg-white text-[#1E2220] hover:bg-white/90"
              render={<Link href={secondaryHref} />}
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
