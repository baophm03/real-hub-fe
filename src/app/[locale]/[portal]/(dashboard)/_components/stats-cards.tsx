import { Building2, CircleUser, Handshake, Users } from "lucide-react";
import type { DashboardSummary } from "@/lib/api/types/dashboard";
import { formatNumber } from "./constants";

type Accent = "green" | "blue" | "yellow" | "purple";

const accentTile: Record<Accent, string> = {
  green: "bg-accent-green text-accent-green-text",
  blue: "bg-accent-blue text-accent-blue-text",
  yellow: "bg-accent-yellow text-accent-yellow-text",
  purple: "bg-accent-purple text-accent-purple-text",
};

const accentGlow: Record<Accent, string> = {
  green: "from-accent-green/70",
  blue: "from-accent-blue/70",
  yellow: "from-accent-yellow/70",
  purple: "from-accent-purple/70",
};

interface StatsCardsProps {
  summary?: DashboardSummary["data"];
}

export function StatsCards({ summary }: StatsCardsProps) {
  const stats: { label: string; value: string; icon: any; accent: Accent }[] = [
    {
      label: "Tổng bất động sản",
      value: summary ? formatNumber(summary.properties) : "—",
      icon: Building2,
      accent: "green",
    },
    {
      label: "Khách hàng",
      value: summary ? formatNumber(summary.customers) : "—",
      icon: Users,
      accent: "blue",
    },
    {
      label: "Nguồn khách hàng",
      value: summary ? formatNumber(summary.leads) : "—",
      icon: CircleUser,
      accent: "purple",
    },
    {
      label: `Giao dịch ${summary?.month?.label ?? "tháng này"}`,
      value: summary ? formatNumber(summary.dealsThisMonth) : "—",
      icon: Handshake,
      accent: "yellow",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up-delay-1">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface bg-gradient-to-br ${accentGlow[stat.accent]} via-surface to-surface p-4 shadow-[0_1px_3px_rgba(42,37,32,0.02),0_8px_24px_-12px_rgba(45,95,63,0.06)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(45,95,63,0.06),0_16px_40px_-12px_rgba(45,95,63,0.12)] md:gap-4 md:p-6 md:rounded-[1.25rem]`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex size-9 items-center justify-center rounded-lg md:size-11 ${accentTile[stat.accent]}`}>
                <Icon size={18} className="md:size-5" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-semibold tabular-nums tracking-tight md:text-3xl">
                {stat.value}
              </span>
              <span className="text-xs text-foreground-muted">{stat.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
