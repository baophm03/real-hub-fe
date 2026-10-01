"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { propertyCategories } from "@/constants/property-categories";

export interface NavLink {
  label: string;
  href: string;
}

export interface HeaderDesktopNavProps {
  isActive: (href: string) => boolean;
  isListingsActive: boolean;
}

export function useNavLinks() {
  const t = useTranslations("public");
  return [
    { label: t("nav.projects"), href: "/projects" },
    { label: t("nav.news"), href: "/news/all" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.contact"), href: "/contact" },
  ];
}

export function HeaderDesktopNav({ isActive, isListingsActive }: HeaderDesktopNavProps) {
  const t = useTranslations("public");
  const navLinks = useNavLinks();
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {/* Mega Menu Trigger */}
      <div ref={megaRef} className="relative">
        <button
          onClick={() => setMegaOpen(!megaOpen)}
          className={cn(
            "group relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-[15px] font-medium transition-colors duration-300",
            isListingsActive
              ? "text-[#092909]"
              : "text-black/80 hover:text-[#092909]"
          )}
        >
          {t("browseProperties")}
          <ChevronDown
            size={12}
            className={cn("transition-transform duration-300", megaOpen && "rotate-180")}
          />
          <span
            className={cn(
              "absolute bottom-0.5 left-1/2 h-px -translate-x-1/2 bg-[#092909] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isListingsActive ? "w-5" : "w-0 group-hover:w-5"
            )}
          />
        </button>

        {megaOpen && (
          <div className="absolute left-1/2 top-full mt-2 w-[480px] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-white shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)]">
            <div className="border-b border-border px-5 py-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-black/60">
                {t("header.exploreByType")}
              </span>
            </div>
            <div className="grid grid-cols-1">
              {propertyCategories.map((cat) => (
                <Link
                  key={cat.labelKey}
                  href={cat.href}
                  onClick={() => setMegaOpen(false)}
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted transition-transform duration-300 group-hover:scale-110">
                    <cat.icon size={20} className={cat.color} />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{t(cat.labelKey)}</span>
                    <span className="text-xs text-foreground-muted">{t(cat.descKey)}</span>
                  </div>
                  <ArrowUpRight
                    size={14}
                    className="ml-auto text-foreground-muted/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#092909]"
                  />
                </Link>
              ))}
            </div>
            <div className="border-t border-border bg-surface-muted px-5 py-3">
              <Link
                href="/listings"
                onClick={() => setMegaOpen(false)}
                className="flex items-center justify-between text-sm font-medium text-[#092909] transition-colors hover:text-[#092909]/80"
              >
                {t("header.viewAllProperties")}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Regular Nav Links */}
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "group relative rounded-lg px-4 py-2 text-[15px] font-medium transition-colors duration-300",
            isActive(link.href)
              ? "text-[#092909]"
              : "text-black/80 hover:text-[#092909]"
          )}
        >
          {link.label}
          <span
            className={cn(
              "absolute bottom-0.5 left-1/2 h-px -translate-x-1/2 bg-[#092909] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isActive(link.href) ? "w-5" : "w-0 group-hover:w-5"
            )}
          />
        </Link>
      ))}
    </nav>
  );
}
