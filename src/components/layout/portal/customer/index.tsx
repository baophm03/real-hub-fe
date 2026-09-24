"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "../owner/topbar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export function CustomerPortalLayout({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh]">
      <div
        className={cn(
          "fixed inset-0 z-30 bg-[#1a1614]/20 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-[100dvh] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:sticky lg:top-0 lg:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
      <Toaster richColors />
    </div>
  );
}
