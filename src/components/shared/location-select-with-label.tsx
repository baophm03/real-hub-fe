"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetApiLocations } from "@/lib/api/endpoints/locations";
import type { Location } from "@/lib/api/types/locations";

interface LocationSelectWithLabelProps {
  provinceId?: string | null;
  wardId?: string | null;
  onProvinceChange: (id: string | null) => void;
  onWardChange: (id: string | null) => void;
  wardPlaceholder?: string;
  provincePlaceholder?: string;
  horizontal?: boolean;
}

export function LocationSelectWithLabel({
  provinceId,
  wardId,
  onProvinceChange,
  onWardChange,
  wardPlaceholder,
  provincePlaceholder,
  horizontal = false,
}: LocationSelectWithLabelProps) {
  const t = useTranslations("auth");
  const resolvedWardPlaceholder = wardPlaceholder ?? t("wardPlaceholder");
  const resolvedProvincePlaceholder = provincePlaceholder ?? t("provincePlaceholder");
  const { data: provincesData, isLoading: provincesLoading } = useGetApiLocations({
    type: "PROVINCE",
    limit: 100,
  });
  const provinces = useMemo(
    () => ((provincesData as unknown as { data?: Location[] })?.data) ?? [],
    [provincesData],
  );

  const { data: wardsData, isLoading: wardsLoading } = useGetApiLocations(
    provinceId ? { type: "WARD", parentId: provinceId, limit: 100 } : undefined,
  );
  const wards = useMemo(
    () => ((wardsData as unknown as { data?: Location[] })?.data) ?? [],
    [wardsData],
  );

  useEffect(() => {
    if (wardId && provinceId && wards.length > 0 && !wards.some((ward) => ward.id === wardId)) {
      onWardChange(null);
    }
  }, [provinceId, wardId, wards, onWardChange]);

  const provinceName = provinces.find((location) => location.id === provinceId)?.name;
  const wardName = wards.find((location) => location.id === wardId)?.name;

  return (
    <div className={horizontal ? "grid grid-cols-2 gap-4" : "flex flex-col gap-3"}>
      <Select
        value={provinceId ?? ""}
        onValueChange={(value) => {
          onProvinceChange(value);
          onWardChange(null);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={provincesLoading ? t("loadingLocations") : resolvedProvincePlaceholder}>
            {provinceName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {provinces.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={wardId ?? ""}
        disabled={!provinceId || wardsLoading}
        onValueChange={onWardChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={!provinceId ? resolvedWardPlaceholder : wardsLoading ? t("loadingLocations") : resolvedWardPlaceholder}
          >
            {wardName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {wards.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
