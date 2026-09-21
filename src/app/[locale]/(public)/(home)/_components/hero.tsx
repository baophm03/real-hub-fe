"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Home, Map, Search, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetApiLocations } from "@/lib/api/endpoints/locations";
import { useGetApiPropertyTypes } from "@/lib/api/endpoints/properties";
import type { Location } from "@/lib/api/types/locations";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-fade";

const HERO_BACKGROUNDS = [
  "/background/home/home1.jpg",
  "/background/home/home2.jpg",
];

type PropertyType = {
  id: string;
  name: string;
  code: string;
  group?: string | null;
};

type PriceRange = {
  label: string;
  from: string;
  to: string;
};

export function Hero() {
  const router = useRouter();
  const t = useTranslations("public.home");

  const [selectedProvince, setSelectedProvince] = useState<Location | null>(null);
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);

  const priceRanges: PriceRange[] = [
    { label: t("priceAll"), from: "", to: "" },
    { label: t("priceUnder1B"), from: "0", to: "1" },
    { label: t("price1to3B"), from: "1", to: "3" },
    { label: t("price3to5B"), from: "3", to: "5" },
    { label: t("price5to10B"), from: "5", to: "10" },
    { label: t("price10to20B"), from: "10", to: "20" },
    { label: t("priceOver20B"), from: "20", to: "" },
    { label: t("rentUnder10M"), from: "0", to: "10" },
    { label: t("rent10to30M"), from: "10", to: "30" },
    { label: t("rentOver30M"), from: "30", to: "" },
  ];

  const { data: provincesData } = useGetApiLocations({ type: "PROVINCE" as any, limit: 100 } as any);
  const provinces: Location[] = ((provincesData as any)?.data as Location[]) || [];

  const { data: propertyTypesData } = useGetApiPropertyTypes();
  const propertyTypes: PropertyType[] = ((propertyTypesData as any)?.data as PropertyType[]) || [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedProvince) params.set("provinceId", selectedProvince.id);
    if (selectedType) params.set("types", selectedType.code);
    if (selectedPriceRange) {
      const multiplier = 1000000000; // default SALE
      if (selectedPriceRange.from) params.set("minPrice", String(parseFloat(selectedPriceRange.from) * multiplier));
      if (selectedPriceRange.to) params.set("maxPrice", String(parseFloat(selectedPriceRange.to) * multiplier));
    }
    const qs = params.toString();
    router.push(qs ? `/listings?${qs}` : "/listings");
  };

  const handleClear = () => {
    setSelectedProvince(null);
    setSelectedType(null);
    setSelectedPriceRange(null);
  };

  const hasSelection = selectedProvince || selectedType || selectedPriceRange;

  return (
    <section className="relative bg-background pt-15 -mt-20 lg:-mt-28">
      <div className="absolute inset-0">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          speed={1000}
          slidesPerView={1}
          loop
          autoplay={{
            delay: 10000,
            disableOnInteraction: false,
          }}
          allowTouchMove={false}
          className="h-full w-full"
        >
          {HERO_BACKGROUNDS.map((src) => (
            <SwiperSlide key={src}>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${src})` }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      <div className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <h1 className="font-serif text-3xl capitalize font-semibold tracking-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-white/90 drop-shadow-md md:text-base lg:text-lg">
            {t("heroSubtitle")}
          </p>
        </div>
        <div className="flex w-full max-w-3xl flex-col gap-2 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur-sm md:flex-row md:items-center">
          {/* Location picker */}
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-surface-muted/60 cursor-pointer"
                >
                  <Map size={22} className="shrink-0 text-foreground-muted" />
                  <span className={`flex-1 truncate ${selectedProvince ? "text-foreground font-medium" : "text-foreground-muted"}`}>
                    {selectedProvince ? selectedProvince.name : t("allRegions")}
                  </span>
                  <ChevronDown size={16} className="shrink-0 text-foreground-muted" />
                </button>
              }
            />
            <PopoverContent align="start" className="max-h-[320px] w-[280px] overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => setSelectedProvince(null)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-muted ${!selectedProvince ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
              >
                {t("allRegions")}
              </button>
              {provinces.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvince(p)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-muted ${selectedProvince?.id === p.id ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                >
                  {p.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="hidden h-8 w-px bg-border md:block" />

          {/* Property type picker */}
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-surface-muted/60 cursor-pointer"
                >
                  <Home size={22} className="shrink-0 text-foreground-muted" />
                  <span className={`flex-1 truncate ${selectedType ? "text-foreground font-medium" : "text-foreground-muted"}`}>
                    {selectedType ? selectedType.name : t("allTypes")}
                  </span>
                  <ChevronDown size={16} className="shrink-0 text-foreground-muted" />
                </button>
              }
            />
            <PopoverContent align="start" className="max-h-[320px] w-[280px] overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-muted ${!selectedType ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
              >
                {t("allTypes")}
              </button>
              {propertyTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-muted ${selectedType?.id === t.id ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                >
                  {t.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="hidden h-8 w-px bg-border md:block" />

          {/* Price range picker */}
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-surface-muted/60 cursor-pointer"
                >
                  <Wallet size={22} className="shrink-0 text-foreground-muted" />
                  <span className={`flex-1 truncate ${selectedPriceRange ? "text-foreground font-medium" : "text-foreground-muted"}`}>
                    {selectedPriceRange ? selectedPriceRange.label : t("priceAll")}
                  </span>
                  <ChevronDown size={16} className="shrink-0 text-foreground-muted" />
                </button>
              }
            />
            <PopoverContent align="start" className="max-h-[320px] w-[280px] overflow-y-auto p-1">
              {priceRanges.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setSelectedPriceRange(r)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-muted ${selectedPriceRange?.label === r.label ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                >
                  {r.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleSearch}
            className="flex h-10 w-full shrink-0 items-center justify-center gap-2 bg-[#092909] cursor-pointer md:w-10 md:gap-0"
          >
            <Search size={16} className="text-white" />
            <span className="text-sm font-medium text-white md:hidden">{t("search")}</span>
          </Button>
        </div>

        {/* Selected chips + clear */}
        {hasSelection && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {selectedProvince && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {selectedProvince.name}
                <button type="button" onClick={() => setSelectedProvince(null)} className="hover:text-white/80">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedType && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {selectedType.name}
                <button type="button" onClick={() => setSelectedType(null)} className="hover:text-white/80">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedPriceRange && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {selectedPriceRange.label}
                <button type="button" onClick={() => setSelectedPriceRange(null)} className="hover:text-white/80">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-white/70 underline-offset-2 hover:text-white hover:underline"
            >
              {t("clearAll")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
