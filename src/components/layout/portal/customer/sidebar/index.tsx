"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { navGroups } from "./nav.config";
import { ability } from "@/config/casl/ability";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { SidebarCollapse } from "../../shared/sidebar-collapse";

export function Sidebar() {
  const rawPathname = usePathname();
  // Strip locale prefix (/vi/customer-portal/favorites → /customer-portal/favorites)
  const pathname = rawPathname.replace(new RegExp(`^/(${routing.locales.join("|")})`), "");

  return (
    <SidebarCollapse>
      {(collapsed) => (
        <>
          <Link href="/" className="group flex h-16 items-center gap-2.5 px-4" title="RealHub">
            <img
              src="/logo.png"
              alt="RealHub"
              className="size-9 shrink-0 rounded-lg object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
            />
            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
                  RealHub
                </span>
                <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-accent-green-text">
                  Cổng khách hàng
                </span>
              </div>
            )}
          </Link>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter(
                (item) => !item.permission || ability.can(item.permission.action, item.permission.subject),
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.label} className="mb-6">
                  {!collapsed && (
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted/60">
                      {group.label}
                    </p>
                  )}
                  {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-border" />}
                  <ul className="flex flex-col gap-1">
                    {visibleItems.map((item) => {
                      const segments = item.href.split("/").filter(Boolean);
                      const isActive = pathname === item.href || (segments.length > 1 && pathname.startsWith(item.href + "/"));

                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={cn(
                              "group flex items-center rounded-2xl text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-2.5 py-2.5",
                              isActive
                                ? "bg-accent-green text-accent-green-text"
                                : "text-foreground-muted hover:bg-surface-muted/60 hover:text-foreground"
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                                isActive
                                  ? "bg-white/60 dark:bg-white/10"
                                  : "bg-surface-muted group-hover:bg-surface"
                              )}
                            >
                              <Icon size={16} />
                            </span>
                            {!collapsed && <span>{item.label}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          {!collapsed && (
            <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-xl border border-accent-green-text/20 bg-accent-green px-3 py-2.5">
              <Heart size={16} className="shrink-0 text-accent-green-text" />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-accent-green-text">Khách hàng</span>
                <span className="text-[10px] text-foreground-muted">Theo dõi BĐS quan tâm</span>
              </div>
            </div>
          )}
        </>
      )}
    </SidebarCollapse>
  );
}
