import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  findPropertyIcon,
  getFieldsByGroupCode,
  type IconColor,
} from "@/constants/property-icons";

interface ListingHighlightsProps {
  property: any;
  schemas: any[];
  title?: string;
}

const iconColorClasses: Record<IconColor, string> = {
  blue: "bg-accent-blue text-accent-blue-text",
  purple: "bg-accent-purple text-accent-purple-text",
  green: "bg-accent-green text-accent-green-text",
  yellow: "bg-accent-yellow text-accent-yellow-text",
  red: "bg-accent-red text-accent-red-text",
};

export async function ListingHighlights({ property, schemas, title }: ListingHighlightsProps) {
  const t = await getTranslations("public.listingDetail");
  const resolvedTitle = title ?? t("highlights");
  const dynamicValues = property?.dynamicValuesJson as Record<string, unknown> | undefined;
  const specialFields = getFieldsByGroupCode(schemas, dynamicValues, "special");
  const highlights = specialFields.map((f) => {
    const { icon, color } = findPropertyIcon(f.label);
    return {
      icon: icon,
      color: color as IconColor,
      title: f.label,
      desc: f.value,
    };
  });

  if (highlights.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl font-semibold text-primary border-b border-border pb-2">{resolvedTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {highlights.map((item) => {
          const Icon = item.icon ?? Star;
          return (
            <div key={item.title} className="flex items-center gap-3 p-4 bg-surface-muted rounded-lg">
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
