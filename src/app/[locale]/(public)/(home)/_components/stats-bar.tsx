"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Building2, Handshake, Users, Home } from "lucide-react";
import { useGetApiDashboardPublicStats } from "@/lib/api/endpoints/dashboard";
import { cn } from "@/lib/utils";

type PublicStats = {
  propertiesForSale: number;
  customers: number;
  deals: number;
  agencies: number;
};

type StatsLabel = { key: keyof PublicStats; labelKey: "statsProperties" | "statsCustomers" | "statsDeals" | "statsAgency"; icon: typeof Home; color: string; bg: string };

const labels: StatsLabel[] = [
  { key: "propertiesForSale", labelKey: "statsProperties", icon: Home, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "customers", labelKey: "statsCustomers", icon: Users, color: "text-sky-600", bg: "bg-sky-50" },
  { key: "deals", labelKey: "statsDeals", icon: Handshake, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "agencies", labelKey: "statsAgency", icon: Building2, color: "text-amber-600", bg: "bg-amber-50" },
];

const FALLBACK_STATS: PublicStats = {
  propertiesForSale: 0,
  customers: 0,
  deals: 0,
  agencies: 0,
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function StatsBar() {
  const t = useTranslations("public.home");
  const { data: res } = useGetApiDashboardPublicStats();
  const stats = ((res as any)?.data as PublicStats | undefined) ?? FALLBACK_STATS;

  return (
    <section className="bg-[#F9FAFB] py-8">
      <div className="mx-auto max-w-350 px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {labels.map((item, i) => (
            <motion.div
              key={item.key}
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
                  "flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-300 md:h-16 md:w-16",
                  item.bg,
                  "group-hover:shadow-sm",
                )}
              >
                <item.icon size={32} className={cn(item.color, "transition-transform duration-300 group-hover:scale-110")} strokeWidth={1.8} />
              </motion.div>
              <span className="font-serif text-3xl font-semibold tabular-nums tracking-tighter md:text-4xl">
                {formatNumber(stats[item.key])}+
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-foreground-muted">
                {t(item.labelKey)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
