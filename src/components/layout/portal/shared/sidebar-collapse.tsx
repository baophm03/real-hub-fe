"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarCollapseProps {
  children: (collapsed: boolean) => ReactNode;
  className?: string;
  buttonClassName?: string;
}

export function SidebarCollapse({ children, className, buttonClassName }: SidebarCollapseProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col border-r border-border bg-surface h-full transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {children(collapsed)}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        className={cn(
          "absolute top-1/2 -right-3 z-50 hidden h-10 w-6 translate-y-[-50%] items-center justify-center rounded-[7px] border border-border bg-surface shadow-sm transition-colors hover:bg-surface-muted lg:flex",
          buttonClassName,
        )}
      >
        {collapsed ? (
          <ChevronRight size={14} className="text-foreground-muted" />
        ) : (
          <ChevronLeft size={14} className="text-foreground-muted" />
        )}
      </button>
    </aside>
  );
}
