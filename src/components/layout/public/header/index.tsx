"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUserStore } from "@/lib/stores/user-store";
import { HeaderDesktopNav, useNavLinks } from "./components/header-desktop-nav";
import { HeaderMobileMenu } from "./components/header-mobile-menu";
import { HeaderAuthDropdown } from "./components/header-auth-dropdown";
import { LanguageSwitcher } from "./components/language-switcher";

export function PublicHeader() {
  const t = useTranslations("public");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const navLinks = useNavLinks();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/projects") return pathname.startsWith("/projects");
    if (href === "/news") return pathname.startsWith("/news");
    return pathname === href;
  };
  const isListingsActive = pathname.startsWith("/listings");

  const initials =
    user?.fullName
      ?.split(" ")
      .slice(-2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  return (
    <header className="fixed inset-x-0 top-0 z-30 [--primary-foreground:#ffffff]">
      <div className="bg-white border-b border-black/10 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.15)]">
        <div className="container mx-auto flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="RealHub"
              className="size-9 rounded-lg object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
            />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-lg font-semibold tracking-tight text-[#092909]">
                RealHub
              </span>
              <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-black/60">
                {t("header.subtitle")}
              </span>
            </div>
          </Link>

          <HeaderDesktopNav isActive={isActive} isListingsActive={isListingsActive} />

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {mounted && isAuthenticated ? (
              !mobileOpen && <HeaderAuthDropdown initials={initials} />
            ) : (
              <Link
                href="/login"
                className="hidden md:flex rounded-lg bg-[#0D2D0D] px-4 py-2 text-[15px] font-medium text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#0D2D0D]/80"
              >
                {t("header.joinNow")}
              </Link>
            )}

            {/* Mobile Toggle */}
            <button
              className="flex size-10 items-center justify-center rounded-lg text-[#092909] transition-colors hover:bg-[#092909]/10 lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      <HeaderMobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isActive={isActive}
        navLinks={navLinks}
        initials={initials}
        isAuthenticated={isAuthenticated}
        mounted={mounted}
      />
    </header>
  );
}
