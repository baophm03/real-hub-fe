"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import {
  findPropertyIcon,
  getFieldsByGroupCode,
  type IconColor,
} from "@/constants/property-icons";

const iconColorClasses: Record<IconColor, string> = {
  blue: "bg-accent-blue text-accent-blue-text",
  purple: "bg-accent-purple text-accent-purple-text",
  green: "bg-accent-green text-accent-green-text",
  yellow: "bg-accent-yellow text-accent-yellow-text",
  red: "bg-accent-red text-accent-red-text",
};

interface PropertyHighlightsProps {
  property?: any;
  schemas?: any[];
  title?: string;
}

/** Đặc điểm nổi bật — cùng thiết kế với listing công khai. */
export function PropertyHighlights({ property, schemas = [], title = "Đặc điểm nổi bật" }: PropertyHighlightsProps) {
  const highlights = useMemo(() => {
    const dynamicValues = property?.dynamicValuesJson as Record<string, unknown> | undefined;
    const specialFields = getFieldsByGroupCode(schemas, dynamicValues, "special");
    return specialFields.map((f) => {
      const { icon, color } = findPropertyIcon(f.label);
      return { icon, color: color as IconColor, title: f.label, desc: f.value };
    });
  }, [property, schemas]);

  if (highlights.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl font-semibold text-primary border-b border-border pb-2">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {highlights.map((item) => {
          const Icon = item.icon ?? Star;
          return (
            <div key={item.title} className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-border">
              <div className={`flex size-10 items-center justify-center rounded-full ${iconColorClasses[item.color]}`}>
                <Icon size={20} />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="font-serif text-base font-medium text-primary">{item.title}</h3>
                <p className="text-xs text-foreground-muted">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
