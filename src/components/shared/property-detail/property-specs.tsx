"use client";

import { useMemo } from "react";
import {
  findPropertyIcon,
  findFieldValue,
  getFieldsByGroupCode,
  type IconColor,
} from "@/constants/property-icons";

const iconColorClasses: Record<IconColor, string> = {
  blue: "text-accent-blue-text",
  purple: "text-accent-purple-text",
  green: "text-accent-green-text",
  yellow: "text-accent-yellow-text",
  red: "text-accent-red-text",
};

interface PropertySpecsProps {
  property?: any;
  schemas?: any[];
}

/** Thông số BĐS dạng thẻ card — cùng thiết kế với listing detail công khai. */
export function PropertySpecs({ property, schemas = [] }: PropertySpecsProps) {
  const specs = useMemo(() => {
    const dynamicValues = property?.dynamicValuesJson as Record<string, unknown> | undefined;
    const areaNum = property?.area ?? 0;

    const bedrooms = findFieldValue(schemas, dynamicValues, ["bedroom", "beds", "phong_ngu", "phòng ngủ"]);
    const bathrooms = findFieldValue(schemas, dynamicValues, ["bathroom", "baths", "phong_tam", "phòng tắm"]);
    const legalStatus = findFieldValue(schemas, dynamicValues, ["legal", "phap_ly", "pháp lý", "ownership"]);

    const staticSpecs = [
      { icon: findPropertyIcon("phòng ngủ").icon, color: findPropertyIcon("phòng ngủ").color as IconColor, label: "Phòng ngủ", value: bedrooms },
      { icon: findPropertyIcon("phòng tắm").icon, color: findPropertyIcon("phòng tắm").color as IconColor, label: "Phòng tắm", value: bathrooms },
      { icon: findPropertyIcon("diện tích").icon, color: findPropertyIcon("diện tích").color as IconColor, label: "Diện tích", value: property?.area ? `${areaNum} m²` : null },
      { icon: findPropertyIcon("pháp lý").icon, color: findPropertyIcon("pháp lý").color as IconColor, label: "Pháp lý", value: legalStatus },
    ];

    // Loại trừ label trùng với static specs — label động lấy từ API (tiếng Việt)
    const staticSpecLabels = new Set(["Diện tích", "Phòng ngủ", "Phòng tắm", "Pháp lý"]);
    const basicInfoFields = getFieldsByGroupCode(schemas, dynamicValues, "basic_info");
    const dynamicSpecs = basicInfoFields
      .filter((f) => !staticSpecLabels.has(f.label))
      .map((f) => {
        const { icon, color } = findPropertyIcon(f.label);
        return { icon, color: color as IconColor, label: f.label, value: f.value as string | null };
      });

    return [...staticSpecs, ...dynamicSpecs].filter(
      (s) => s.value != null && s.value !== "" && s.value !== "—" && s.value !== "-",
    );
  }, [property, schemas]);

  if (specs.length === 0) return null;

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {specs.map((spec) => {
        const Icon = spec.icon;
        return (
          <div
            key={spec.label}
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-muted px-3 py-5 text-center"
          >
            <Icon size={24} className={iconColorClasses[spec.color]} />
            <span className="text-base font-bold text-foreground">{spec.value}</span>
            <span className="text-xs text-foreground-muted">{spec.label}</span>
          </div>
        );
      })}
    </section>
  );
}
