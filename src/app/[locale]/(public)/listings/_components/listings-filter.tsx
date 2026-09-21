"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";

type PropertyType = {
  id: string;
  name: string;
  code: string;
  group?: string | null;
};

type Province = {
  id: string;
  name: string;
};

interface ListingsFilterProps {
  propertyTypes: PropertyType[];
  provinces: Province[];
  currentTransactionType: string;
  currentProvinceId: string;
  currentTypes: string[];
  currentPriceFrom: string;
  currentPriceTo: string;
}

export function ListingsFilter({
  propertyTypes,
  provinces,
  currentTransactionType,
  currentProvinceId,
  currentTypes,
  currentPriceFrom,
  currentPriceTo,
}: ListingsFilterProps) {
  const t = useTranslations("public.listings");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Draft state initialized from current searchParams
  const [draftTransactionType, setDraftTransactionType] = useState<"ALL" | "SALE" | "RENT">(
    (currentTransactionType as "ALL" | "SALE" | "RENT") || "ALL",
  );
  const [draftSelectedZone, setDraftSelectedZone] = useState(currentProvinceId || "");
  const [draftSelectedTypes, setDraftSelectedTypes] = useState<string[]>(currentTypes || []);
  const [draftPriceFrom, setDraftPriceFrom] = useState(currentPriceFrom || "");
  const [draftPriceTo, setDraftPriceTo] = useState(currentPriceTo || "");

  // Sync draft state when URL searchParams change (e.g. after "Xóa bộ lọc" or external nav)
  useEffect(() => {
    setDraftTransactionType((currentTransactionType as "ALL" | "SALE" | "RENT") || "ALL");
    setDraftSelectedZone(currentProvinceId || "");
    setDraftSelectedTypes(currentTypes || []);
    setDraftPriceFrom(currentPriceFrom || "");
    setDraftPriceTo(currentPriceTo || "");
  }, [currentTransactionType, currentProvinceId, currentTypes, currentPriceFrom, currentPriceTo]);

  const hasFilters =
    draftSelectedTypes.length > 0 ||
    draftTransactionType !== "ALL" ||
    draftPriceFrom !== "" ||
    draftPriceTo !== "" ||
    draftSelectedZone !== "";

  const toggleType = (typeCode: string) => {
    setDraftSelectedTypes((prev) =>
      prev.includes(typeCode) ? prev.filter((t) => t !== typeCode) : [...prev, typeCode],
    );
  };

  const buildUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    // Preserve sort
    const sort = params.get("sort");

    params.delete("transactionType");
    params.delete("provinceId");
    params.delete("types");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("sort");

    if (draftTransactionType !== "ALL") params.set("transactionType", draftTransactionType);
    if (draftSelectedZone) params.set("provinceId", draftSelectedZone);
    if (draftPriceFrom) {
      const multiplier = draftTransactionType === "RENT" ? 1000000 : 1000000000;
      params.set("minPrice", String(parseFloat(draftPriceFrom) * multiplier));
    }
    if (draftPriceTo) {
      const multiplier = draftTransactionType === "RENT" ? 1000000 : 1000000000;
      params.set("maxPrice", String(parseFloat(draftPriceTo) * multiplier));
    }
    if (sort) params.set("sort", sort);

    // Build query manually to keep comma raw (URLSearchParams encodes it to %2C)
    const parts: string[] = [];
    for (const [key, value] of params.entries()) {
      parts.push(`${key}=${value}`);
    }
    if (draftSelectedTypes.length > 0) {
      parts.push(`types=${draftSelectedTypes.join(",")}`);
    }

    return parts.length > 0 ? `${pathname}?${parts.join("&")}` : pathname;
  };

  const applyFilters = () => {
    router.push(buildUrl());
  };

  const handleAlertSubscribe = () => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    const sort = params.get("sort");
    const cleanParams = new URLSearchParams();
    if (sort) cleanParams.set("sort", sort);
    const url = cleanParams.toString() ? `${pathname}?${cleanParams.toString()}` : pathname;
    router.push(url);
  };

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
      <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-xl font-medium text-[#072707] flex items-center gap-2">
            <Filter size={16} /> {t("filterTitle")}
          </h2>
          {hasFilters && (
            <Button variant="link" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs font-medium">
              {t("clearFilter")}
            </Button>
          )}
        </div>

        {/* Transaction Type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("transactionType")}</label>
          <div className="flex gap-2">
            {(["ALL", "SALE", "RENT"] as const).map((tx) => {
              const activeColor =
                tx === "SALE" ? "bg-[#FCEAEB] text-[#C57B7A] hover:bg-[#FCEAEB]"
                  : tx === "RENT" ? "bg-accent-blue text-accent-blue-text hover:bg-accent-blue"
                    : "bg-[#072707] text-white hover:bg-[#072707]";
              return (
                <Button
                  key={tx}
                  onClick={() => setDraftTransactionType(tx)}
                  className={`flex h-9 rounded-lg text-xs font-medium transition-colors hover:bg-surface-muted ${draftTransactionType === tx
                    ? activeColor
                    : "bg-surface-muted text-foreground-muted"
                    }`}
                >
                  {tx === "ALL" ? t("all") : tx === "SALE" ? t("sale") : t("rent")}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Zone Filter */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("region")}</Label>
          <Select value={draftSelectedZone} onValueChange={(value) => setDraftSelectedZone(value ?? "")}>
            <SelectTrigger className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-[#072707] focus:outline-none focus:ring-1 focus:ring-[#072707]">
              <SelectValue placeholder={t("all")}>
                {(value: string) => {
                  if (!value) return t("all");
                  const p = provinces.find((p) => p.id === value);
                  return p?.name || value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" label={t("all")}>{t("all")}</SelectItem>
              {provinces.map((p) => (
                <SelectItem key={p.id} value={p.id} label={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            {t("priceRange", { unit: draftTransactionType === "RENT" ? t("priceUnitMillion") : t("priceUnitBillion") })}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={draftPriceFrom}
              onChange={(e) => setDraftPriceFrom(e.target.value)}
              placeholder={t("priceFrom")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-[#072707] focus:outline-none focus:ring-1 focus:ring-[#072707]"
            />
            <span className="text-foreground-muted">—</span>
            <Input
              type="text"
              value={draftPriceTo}
              onChange={(e) => setDraftPriceTo(e.target.value)}
              placeholder={t("priceTo")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-[#072707] focus:outline-none focus:ring-1 focus:ring-[#072707]"
            />
          </div>
        </div>

        {/* Property Type */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("propertyType")}</Label>
          <div className="flex flex-col gap-2">
            {propertyTypes.map((t) => (
              <Label key={t.code} className="flex items-center gap-2 text-sm cursor-pointer">
                <Input
                  type="checkbox"
                  checked={draftSelectedTypes.includes(t.code)}
                  onChange={() => toggleType(t.code)}
                  className="size-4 rounded border-border accent-[#072707]"
                />
                {t.name}
              </Label>
            ))}
          </div>
        </div>

        <Button className="w-full bg-[#072707] hover:bg-[#072707]/90" size="lg" onClick={applyFilters}>
          {t("apply")}
        </Button>
      </div>

      {/* Notification Card */}
      <div className="bg-[#072707] rounded-xl p-4 flex flex-col gap-2 text-center items-center justify-center">
        <Bell size={32} className="text-white mb-1" />
        <h3 className="font-serif text-lg font-medium text-white">{t("alertTitle")}</h3>
        <p className="text-sm text-white/80">
          {t("alertDesc")}
        </p>
        <Button
          onClick={handleAlertSubscribe}
          className="w-full mt-2 py-2 bg-surface text-[#072707] rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-surface-muted transition-colors"
        >
          {t("alertSubscribe")}
        </Button>
      </div>
    </div>
  );
}
