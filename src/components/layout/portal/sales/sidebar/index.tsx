"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, TrendingUp } from "lucide-react";
import { navGroups } from "./nav.config";
import { ability } from "@/config/casl/ability";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { SidebarCollapse } from "../../shared/sidebar-collapse";

export function Sidebar() {
  const rawPathname = usePathname();
  // Strip locale prefix (/vi/sales-portal/leads → /sales-portal/leads)
  const pathname = rawPathname.replace(new RegExp(`^/(${routing.locales.join("|")})`), "");

  return (
    <SidebarCollapse>
      {(collapsed) => (
        <>
          <Link href="/" className="group flex h-16 items-center gap-2.5 px-4" title="RealHub">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue text-accent-blue-text transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
              <Building2 size={22} />
            </span>
            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
                  RealHub
                </span>
                <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-accent-blue-text">
                  Sales Portal
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
                              "group flex items-center rounded-full text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-4 py-2.5",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                            )}
                          >
                            <Icon
                              size={20}
                              className={cn(
                                "shrink-0 transition-transform duration-300",
                                isActive ? "" : "group-hover:scale-110"
                              )}
                            />
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
            <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-xl border border-accent-blue-text/20 bg-accent-blue px-3 py-2.5">
              <TrendingUp size={16} className="shrink-0 text-accent-blue-text" />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-accent-blue-text">Kênh kinh doanh</span>
                <span className="text-[10px] text-foreground-muted">Lead · Deal · Hoa hồng</span>
              </div>
            </div>
          )}
        </>
      )}
    </SidebarCollapse>
  );
}
