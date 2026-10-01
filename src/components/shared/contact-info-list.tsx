"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGetApiContactInfoPublic } from "@/lib/api/endpoints/contact-info";

const KEY_ICON_BG: Record<string, string> = {
  phone: "bg-emerald-50 text-emerald-600",
  email: "bg-blue-50 text-blue-600",
  address: "bg-rose-50 text-rose-600",
};

interface ContactInfoItem {
  id: string;
  key: string;
  value: string;
  isActive: boolean;
  sortOrder: number;
}

interface ContactInfoResponse {
  success?: boolean;
  data?: ContactInfoItem[];
}

const KEY_ICONS: Record<string, { icon: typeof Phone; className: string }> = {
  phone: { icon: Phone, className: "text-emerald-600" },
  email: { icon: Mail, className: "text-blue-600" },
  address: { icon: MapPin, className: "text-rose-600" },
};

const KEY_LABELS: Record<string, string> = {
  phone: "phone",
  email: "email",
  address: "office",
};

/**
 * Fetches public contact info (phone, email, address) from the API
 * and renders it as a list. Falls back to nothing when unavailable.
 */
export function ContactInfoList({ variant = "full" }: { variant?: "full" | "compact" }) {
  const t = useTranslations("public.contact");
  const { data, isLoading } = useGetApiContactInfoPublic<ContactInfoResponse, unknown>({
    query: {
      staleTime: 1000 * 60 * 10,
      retry: 1,
    },
  });

  const items = (data?.data ?? []).filter((item) => item.isActive);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-muted/60" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  if (variant === "compact") {
    return (
      <>
        {items.map((item) => {
          const config = KEY_ICONS[item.key];
          const Icon = config?.icon ?? MapPin;
          const href =
            item.key === "phone"
              ? `tel:${item.value.replace(/\s/g, "")}`
              : item.key === "email"
                ? `mailto:${item.value}`
                : undefined;
          return (
            <div key={item.id} className="flex items-start gap-2 text-sm text-foreground-muted">
              <Icon size={14} className="shrink-0 text-primary mt-0.5" />
              {href ? (
                <a href={href} className="transition-colors hover:text-foreground">
                  {item.value}
                </a>
              ) : (
                <span className="leading-relaxed">{item.value}</span>
              )}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const config = KEY_ICONS[item.key];
        const Icon = config?.icon ?? MapPin;
        const iconBg = KEY_ICON_BG[item.key] ?? "bg-rose-50 text-rose-600";
        const labelKey = KEY_LABELS[item.key];
        const href =
          item.key === "phone"
            ? `tel:${item.value.replace(/\s/g, "")}`
            : item.key === "email"
              ? `mailto:${item.value}`
              : undefined;
        const inner = (
          <>
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${iconBg} transition-transform duration-300 group-hover:scale-105`}
            >
              <Icon size={22} />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                {labelKey ? t(labelKey) : item.key}
              </span>
              <span className="text-sm font-medium leading-relaxed break-words">
                {item.value}
              </span>
            </div>
          </>
        );
        return href ? (
          <a
            key={item.id}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_8px_24px_-8px_rgba(45,95,63,0.12)]"
          >
            {inner}
          </a>
        ) : (
          <div
            key={item.id}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
