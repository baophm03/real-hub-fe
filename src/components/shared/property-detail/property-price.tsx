"use client";

import { formatPriceWithTransaction, formatPricePerSqm } from "@/utils";

interface PropertyPriceProps {
  property?: any;
  title?: string;
}

/** Khối giá BĐS trong sidebar portal — heading serif kèm đường kẻ đồng bộ với các section khác của sidebar. */
export function PropertyPrice({ property, title = "Giá bán" }: PropertyPriceProps) {
  const priceStr = property?.price != null ? String(property.price) : "";
  const areaNum = property?.area ?? 0;
  const perSqm = formatPricePerSqm(priceStr, areaNum);

  return (
    <div>
      <h2 className="font-serif text-lg font-medium tracking-tight text-foreground border-b border-border pb-3 mb-4">
        {title}
      </h2>
      <p className="font-serif text-2xl font-bold text-foreground">
        {priceStr ? formatPriceWithTransaction(priceStr, property?.transactionType ?? "") : "—"}
      </p>
      {perSqm && <p className="mt-1 text-sm text-foreground-muted">{perSqm}</p>}
    </div>
  );
}
