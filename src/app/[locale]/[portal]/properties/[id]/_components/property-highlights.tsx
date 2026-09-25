"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import {
  findPropertyIcon,
  getFieldsByGroupCode,
  type IconColor,
} from "@/constants/property-icons";

export interface PropertyHighlight {
  icon?: any;
  color: IconColor;
  title: string;
  desc: string;
}

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

export function PropertyHighlights({ property, schemas = [], title = "Đặc điểm nổi bật" }: PropertyHighlightsProps) {
  const highlights = useMemo<PropertyHighlight[]>(() => {
    const dynamicValues = property?.dynamicValuesJson as Record<string, unknown> | undefined;
    const specialFields = getFieldsByGroupCode(schemas, dynamicValues, "special");
    return specialFields.map((f) => {
      const { icon, color } = findPropertyIcon(f.label);
      return { icon, color: color as IconColor, title: f.label, desc: f.value };
    });
  }, [property, schemas]);

  if (!highlights || highlights.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-serif text-xl font-medium tracking-tight text-foreground border-b border-border pb-3">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {highlights.map((item) => {
          const Icon = item.icon ?? Star;
          return (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-primary/20 hover:shadow-[0_4px_16px_-8px_rgba(45,95,63,0.12)]"
            >
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconColorClasses[item.color]}`}>
                <Icon size={20} />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-xs text-foreground-muted">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
