"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronDown, LogOut, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUserStore } from "@/lib/stores/user-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { propertyCategories } from "@/constants/property-categories";
import { getPortalEntry } from "@/config/portal-entry";
import type { NavLink } from "./header-desktop-nav";

export interface HeaderMobileMenuProps {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
  navLinks: NavLink[];
  initials: string;
  isAuthenticated: boolean | null;
  mounted: boolean;
}

export function HeaderMobileMenu({
  open,
  onClose,
  isActive,
  navLinks,
  initials,
  isAuthenticated,
  mounted,
}: HeaderMobileMenuProps) {
  const t = useTranslations("public");
  const [megaOpen, setMegaOpen] = useState(false);
  const user = useUserStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const codes = user?.roles?.map((r) => r.code) ?? [];
  const portalEntry = getPortalEntry(codes);

  return (
    <div
      className={cn(
        "overflow-hidden border-b border-black/10 bg-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden",
        open
          ? "max-h-[calc(100vh-4rem)] overflow-y-auto opacity-100 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)]"
          : "max-h-0 border-b-0 opacity-0"
      )}
    >
      <nav className="flex flex-col gap-1 px-6 py-4">
        {/* Mobile Mega Menu — Accordion */}
        <div className="flex flex-col">
          <button
            onClick={() => setMegaOpen(!megaOpen)}
            className={cn(
              "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              megaOpen
                ? "bg-[#092909]/5 text-[#092909]"
                : "text-black/80 hover:bg-black/5 hover:text-[#092909]"
            )}
          >
            {t("browseProperties")}
            <ChevronDown
              size={14}
              className={cn("transition-transform duration-300", megaOpen && "rotate-180")}
            />
          </button>
          {megaOpen && (
            <div className="flex flex-col gap-0.5 pb-2 pl-2">
              {propertyCategories.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-black/70 transition-colors hover:bg-black/5 hover:text-foreground"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                    <cat.icon size={16} className={cat.color} />
                  </span>
                  {cat.label}
                </Link>
              ))}
              <Link
                href="/listings"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-[#092909] transition-colors hover:bg-[#092909]/5"
              >
                {t("common.viewAll")}
                <ArrowUpRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={cn(
              "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              isActive(link.href)
                ? "bg-[#092909]/5 text-[#092909]"
                : "text-black/80 hover:bg-black/5 hover:text-[#092909]"
            )}
          >
            {link.label}
          </Link>
        ))}

        <div className="mt-3 flex flex-col gap-2 border-t border-black/10 pt-4">
          {mounted && isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 rounded-lg bg-black/5 px-4 py-3">
                <Avatar className="size-9 rounded-full overflow-hidden">
                  {user?.avatarFile?.url && (
                    <AvatarImage src={user.avatarFile?.url} alt={user?.fullName ?? "User"} />
                  )}
                  <AvatarFallback className="flex size-9 items-center justify-center rounded-full bg-[#092909]/10 text-xs font-medium text-[#092909]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {user?.fullName ?? "User"}
                  </span>
                  <span className="text-xs text-black/50">{user?.email}</span>
                </div>
              </div>

              {portalEntry && (
                <button
                  onClick={() => {
                    router.push(`/${portalEntry.slug}`);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#092909] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#092909]/90"
                >
                  <portalEntry.icon size={16} />
                  {portalEntry.label}
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                  onClose();
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-3 text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
              >
                <LogOut size={16} />
                {t("header.logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="rounded-lg border border-black/15 px-4 py-3 text-center text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#092909] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#092909]/90"
              >
                {t("signUp")}
                <ArrowUpRight size={14} />
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
