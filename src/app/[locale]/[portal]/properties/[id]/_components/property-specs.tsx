"use client";

import { useMemo } from "react";
import {
  findPropertyIcon,
  findFieldValue,
  getFieldsByGroupCode,
  type IconColor,
} from "@/constants/property-icons";

export interface PropertySpec {
  icon: any;
  color: IconColor;
  label: string;
  value: string;
}

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

export function PropertySpecs({ property, schemas = [] }: PropertySpecsProps) {
  const specs = useMemo<PropertySpec[]>(() => {
    const dynamicValues = property?.dynamicValuesJson as Record<string, unknown> | undefined;
    const areaNum = property?.area ?? 0;

    const bedrooms = findFieldValue(schemas, dynamicValues, ["bedroom", "beds", "phong_ngu", "phòng ngủ"]);
    const bathrooms = findFieldValue(schemas, dynamicValues, ["bathroom", "baths", "phong_tam", "phòng tắm"]);
    const legalStatus = findFieldValue(schemas, dynamicValues, ["legal", "phap_ly", "pháp lý", "ownership"]);

    const staticSpecs: PropertySpec[] = [
      { icon: findPropertyIcon("diện tích").icon, color: findPropertyIcon("diện tích").color as IconColor, label: "Diện tích", value: property ? `${areaNum} m2` : "-" },
      { icon: findPropertyIcon("phòng ngủ").icon, color: findPropertyIcon("phòng ngủ").color as IconColor, label: "Phòng ngủ", value: bedrooms || "-" },
      { icon: findPropertyIcon("phòng tắm").icon, color: findPropertyIcon("phòng tắm").color as IconColor, label: "Phòng tắm", value: bathrooms || "-" },
      { icon: findPropertyIcon("pháp lý").icon, color: findPropertyIcon("pháp lý").color as IconColor, label: "Pháp lý", value: legalStatus || "-" },
    ];

    const staticSpecLabels = new Set(["Diện tích", "Phòng ngủ", "Phòng tắm", "Pháp lý"]);
    const basicInfoFields = getFieldsByGroupCode(schemas, dynamicValues, "basic_info");

    const dynamicSpecs: PropertySpec[] = basicInfoFields
      .filter((f) => !staticSpecLabels.has(f.label))
      .map((f) => {
        const { icon, color } = findPropertyIcon(f.label);
        return { icon, color: color as IconColor, label: f.label, value: f.value };
      });

    return [...staticSpecs, ...dynamicSpecs];
  }, [property, schemas]);

  if (!specs || specs.length === 0) return null;

  return (
    <section className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-6 md:grid-cols-4">
      {specs.map((spec) => {
        const Icon = spec.icon;
        return (
          <div key={spec.label} className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              {spec.label}
            </span>
            <div className="flex items-center gap-2">
              <Icon size={20} className={iconColorClasses[spec.color]} />
              <span className="font-serif text-xl font-medium text-foreground">
                {spec.value}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
