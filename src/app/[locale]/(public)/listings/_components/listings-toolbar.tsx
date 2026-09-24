"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, Map } from "lucide-react";

export function ListingsToolbar({
  currentSort,
  resultCount,
  currentView = "grid",
}: {
  currentSort: string;
  resultCount: number;
  currentView?: string;
}) {
  const t = useTranslations("public.listings");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const SORT_OPTIONS = [
    { value: "newest", label: t("sortNewest") },
    { value: "price-asc", label: t("sortPriceAsc") },
    { value: "price-desc", label: t("sortPriceDesc") },
    { value: "area-desc", label: t("sortAreaDesc") },
  ];

  const handleSortChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleViewChange = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "grid") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary">
          {t("title")}
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          {t("results", { count: resultCount })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border bg-surface p-1">
          <button
            onClick={() => handleViewChange("grid")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${currentView !== "map"
              ? "bg-[#072707] text-white"
              : "text-foreground-muted hover:text-foreground"
              }`}
            aria-label={t("gridView")}
          >
            <LayoutGrid size={14} />
            {t("gridView")}
          </button>
          <button
            onClick={() => handleViewChange("map")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${currentView === "map"
              ? "bg-[#072707] text-white"
              : "text-foreground-muted hover:text-foreground"
              }`}
            aria-label={t("mapView")}
          >
            <Map size={14} />
            {t("mapView")}
          </button>
        </div>

        {/* Sort */}
        <Select value={currentSort} onValueChange={handleSortChange} items={SORT_OPTIONS}>
          <SelectTrigger className="w-[180px] rounded-lg border border-border bg-surface text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <SelectValue placeholder={t("sort")} />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} label={o.label}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
