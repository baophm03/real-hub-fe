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
import { useUserStore } from "@/lib/stores/user-store";
import { usePostApiSubscribe } from "@/lib/api/endpoints/subscribers";
import { toast } from "sonner";
import { useGetApiLocations } from "@/lib/api/endpoints/locations";
import { useGetApiProjects } from "@/lib/api/endpoints/projects";
import type { Location } from "@/lib/api/types/locations";
import { PriceRangeSlider } from "./price-range-slider";

type Project = { id: string; name: string };

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
  currentDistrictId: string;
  currentWardId: string;
  currentTypes: string[];
  currentPriceFrom: string;
  currentPriceTo: string;
  currentMinArea: string;
  currentMaxArea: string;
  currentProjectId: string;
}

export function ListingsFilter({
  propertyTypes,
  provinces,
  currentTransactionType,
  currentProvinceId,
  currentDistrictId,
  currentWardId,
  currentTypes,
  currentPriceFrom,
  currentPriceTo,
  currentMinArea,
  currentMaxArea,
  currentProjectId,
}: ListingsFilterProps) {
  const t = useTranslations("public.listings");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.user);
  const tf = useTranslations("public.footer");
  const [alertEmailOpen, setAlertEmailOpen] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const { mutateAsync: subscribe, isPending: isSubscribing } = usePostApiSubscribe();

  // Draft state initialized from current searchParams
  const [draftTransactionType, setDraftTransactionType] = useState<"ALL" | "SALE" | "RENT">(
    (currentTransactionType as "ALL" | "SALE" | "RENT") || "ALL",
  );
  const [draftSelectedZone, setDraftSelectedZone] = useState(currentProvinceId || "");
  const [draftDistrictId, setDraftDistrictId] = useState(currentDistrictId || "");
  const [draftWardId, setDraftWardId] = useState(currentWardId || "");
  const [draftSelectedTypes, setDraftSelectedTypes] = useState<string[]>(currentTypes || []);
  const [draftPriceFrom, setDraftPriceFrom] = useState(currentPriceFrom || "");
  const [draftPriceTo, setDraftPriceTo] = useState(currentPriceTo || "");
  const [draftMinArea, setDraftMinArea] = useState(currentMinArea || "");
  const [draftMaxArea, setDraftMaxArea] = useState(currentMaxArea || "");
  const [draftProjectId, setDraftProjectId] = useState(currentProjectId || "");

  // Cascading locations: district theo province, ward theo district (fallback province)
  const { data: districtsData } = useGetApiLocations(
    draftSelectedZone ? { type: "DISTRICT", parentId: draftSelectedZone, limit: 100 } : undefined,
  );
  const districts: Location[] = ((districtsData as unknown as { data?: Location[] })?.data) ?? [];

  const wardParentId = draftDistrictId || draftSelectedZone;
  const { data: wardsData } = useGetApiLocations(
    wardParentId ? { type: "WARD", parentId: wardParentId, limit: 200 } : undefined,
  );
  const wards: Location[] = ((wardsData as unknown as { data?: Location[] })?.data) ?? [];

  const { data: projectsData } = useGetApiProjects({ limit: "100" });
  const projects: Project[] = ((projectsData as unknown as { data?: Project[] })?.data) ?? [];

  // Sync draft state when URL searchParams change (e.g. after "Xóa bộ lọc" or external nav)
  useEffect(() => {
    setDraftTransactionType((currentTransactionType as "ALL" | "SALE" | "RENT") || "ALL");
    setDraftSelectedZone(currentProvinceId || "");
    setDraftDistrictId(currentDistrictId || "");
    setDraftWardId(currentWardId || "");
    setDraftSelectedTypes(currentTypes || []);
    setDraftPriceFrom(currentPriceFrom || "");
    setDraftPriceTo(currentPriceTo || "");
    setDraftMinArea(currentMinArea || "");
    setDraftMaxArea(currentMaxArea || "");
    setDraftProjectId(currentProjectId || "");
  }, [currentTransactionType, currentProvinceId, currentDistrictId, currentWardId, currentTypes, currentPriceFrom, currentPriceTo, currentMinArea, currentMaxArea, currentProjectId]);

  const hasFilters =
    draftSelectedTypes.length > 0 ||
    draftTransactionType !== "ALL" ||
    draftPriceFrom !== "" ||
    draftPriceTo !== "" ||
    draftSelectedZone !== "" ||
    draftDistrictId !== "" ||
    draftWardId !== "" ||
    draftMinArea !== "" ||
    draftMaxArea !== "" ||
    draftProjectId !== "";

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
    params.delete("districtId");
    params.delete("wardId");
    params.delete("types");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("minArea");
    params.delete("maxArea");
    params.delete("projectId");
    params.delete("sort");

    if (draftTransactionType !== "ALL") params.set("transactionType", draftTransactionType);
    if (draftSelectedZone) params.set("provinceId", draftSelectedZone);
    if (draftDistrictId) params.set("districtId", draftDistrictId);
    if (draftWardId) params.set("wardId", draftWardId);
    if (draftPriceFrom) {
      const multiplier = draftTransactionType === "RENT" ? 1000000 : 1000000000;
      params.set("minPrice", String(parseFloat(draftPriceFrom) * multiplier));
    }
    if (draftPriceTo) {
      const multiplier = draftTransactionType === "RENT" ? 1000000 : 1000000000;
      params.set("maxPrice", String(parseFloat(draftPriceTo) * multiplier));
    }
    if (draftMinArea) params.set("minArea", draftMinArea);
    if (draftMaxArea) params.set("maxArea", draftMaxArea);
    if (draftProjectId) params.set("projectId", draftProjectId);
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

  const submitSubscribe = async (email: string) => {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error(tf("newsletterInvalid"));
      return;
    }
    try {
      await subscribe({ data: { email: value } });
      toast.success(tf("newsletterSuccess"));
      setAlertEmail("");
      setAlertEmailOpen(false);
    } catch (err) {
      toast.error(
        (err as any)?.response?.data?.error?.message?.[0] || tf("newsletterError"),
      );
    }
  };

  const handleAlertSubscribe = () => {
    if (isAuthenticated && user?.email) {
      void submitSubscribe(user.email);
      return;
    }
    setAlertEmailOpen((o) => !o);
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

        {/* Zone Filter — cascading tỉnh → huyện → phường */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("region")}</Label>
          <Select
            value={draftSelectedZone}
            onValueChange={(value) => {
              setDraftSelectedZone(value ?? "");
              setDraftDistrictId("");
              setDraftWardId("");
            }}
          >
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

          {draftSelectedZone && districts.length > 0 && (
            <Select
              value={draftDistrictId}
              onValueChange={(value) => {
                setDraftDistrictId(value ?? "");
                setDraftWardId("");
              }}
            >
              <SelectTrigger className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-[#072707] focus:outline-none focus:ring-1 focus:ring-[#072707]">
                <SelectValue placeholder={t("allDistricts")}>
                  {(value: string) => {
                    if (!value) return t("allDistricts");
                    return districts.find((d) => d.id === value)?.name || value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" label={t("allDistricts")}>{t("allDistricts")}</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id} label={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {draftSelectedZone && wards.length > 0 && (
            <Select
              value={draftWardId}
              onValueChange={(value) => setDraftWardId(value ?? "")}
            >
              <SelectTrigger className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-[#072707] focus:outline-none focus:ring-1 focus:ring-[#072707]">
                <SelectValue placeholder={t("allWards")}>
                  {(value: string) => {
                    if (!value) return t("allWards");
                    return wards.find((w) => w.id === value)?.name || value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" label={t("allWards")}>{t("allWards")}</SelectItem>
                {wards.map((w) => (
                  <SelectItem key={w.id} value={w.id} label={w.name}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Project */}
        {projects.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("project")}</Label>
            <Select
              value={draftProjectId}
              onValueChange={(value) => setDraftProjectId(value ?? "")}
            >
              <SelectTrigger className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-[#072707] focus:outline-none focus:ring-1 focus:ring-[#072707]">
                <SelectValue placeholder={t("allProjects")}>
                  {(value: string) => {
                    if (!value) return t("allProjects");
                    return projects.find((p) => p.id === value)?.name || value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" label={t("allProjects")}>{t("allProjects")}</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id} label={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Area Range */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{t("areaRange")}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={draftMinArea}
              onChange={(e) => setDraftMinArea(e.target.value)}
              placeholder={t("areaFrom")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-[#072707] focus:outline-none focus:ring-1 focus:ring-[#072707]"
            />
            <span className="text-foreground-muted">—</span>
            <Input
              type="number"
              min={0}
              value={draftMaxArea}
              onChange={(e) => setDraftMaxArea(e.target.value)}
              placeholder={t("areaTo")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-[#072707] focus:outline-none focus:ring-1 focus:ring-[#072707]"
            />
          </div>
        </div>

        {/* Price Range — slider + input */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            {t("priceRange", { unit: draftTransactionType === "RENT" ? t("priceUnitMillion") : t("priceUnitBillion") })}
          </Label>
          {(() => {
            const sliderMax = draftTransactionType === "RENT" ? 100 : 50;
            const sliderStep = draftTransactionType === "RENT" ? 1 : 0.5;
            const from = Math.min(Number(draftPriceFrom) || 0, sliderMax);
            const to = draftPriceTo === "" ? sliderMax : Math.min(Number(draftPriceTo) || sliderMax, sliderMax);
            return (
              <PriceRangeSlider
                min={0}
                max={sliderMax}
                step={sliderStep}
                valueFrom={from}
                valueTo={to}
                onChange={(f, v) => {
                  setDraftPriceFrom(f > 0 ? String(f) : "");
                  setDraftPriceTo(v >= sliderMax ? "" : String(v));
                }}
              />
            );
          })()}
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
        {alertEmailOpen && !user?.email ? (
          <div className="w-full mt-2 flex flex-col gap-2">
            <Input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder={tf("newsletterPlaceholder")}
              className="h-9 bg-white text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitSubscribe(alertEmail);
              }}
            />
            <Button
              onClick={() => void submitSubscribe(alertEmail)}
              disabled={isSubscribing}
              className="w-full py-2 bg-surface text-[#072707] rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-surface-muted transition-colors"
            >
              {t("alertSubscribe")}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleAlertSubscribe}
            disabled={isSubscribing}
            className="w-full mt-2 py-2 bg-surface text-[#072707] rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-surface-muted transition-colors"
          >
            {t("alertSubscribe")}
          </Button>
        )}
      </div>
    </div>
  );
}
