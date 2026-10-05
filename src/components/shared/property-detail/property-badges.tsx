"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const CHIP_CLASS = "rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide";

/** Hàng badge Loại tin (Bán/Thuê) + Trạng thái (Đang bán/Đã cọc/Đã bán) — giống listing công khai. */
export function PropertyBadges({
  property,
  extra,
}: {
  property?: any;
  /** Badge bổ sung của từng trang (vd: trạng thái phụ trách) — cùng kiểu chip với các badge khác */
  extra?: { label: string; className?: string };
}) {
  const tp = useTranslations("public");
  if (!property) return extra ? <div className="flex items-center gap-2 mb-2"><span className={cn(CHIP_CLASS, extra.className)}>{extra.label}</span></div> : null;

  return (
    <div className="flex items-center gap-2 mb-2">
      {property.transactionType && (
        <span
          className={cn(
            CHIP_CLASS,
            property.transactionType === "SALE"
              ? "bg-[#FCEAEB] text-[#C57B7A]"
              : "bg-accent-blue text-accent-blue-text",
          )}
        >
          {tp(`enums.transaction.${property.transactionType}`)}
        </span>
      )}
      {property.businessStatus && (
        <span
          className={cn(
            CHIP_CLASS,
            property.businessStatus === "AVAILABLE"
              ? "bg-accent-green text-accent-green-text"
              : property.businessStatus === "RESERVED"
                ? "bg-accent-yellow text-accent-yellow-text"
                : property.businessStatus === "SOLD"
                  ? "bg-accent-red text-accent-red-text"
                  : "bg-surface-muted text-foreground-muted",
          )}
        >
          {tp(`enums.businessStatus.${property.businessStatus}`)}
        </span>
      )}
      {extra && <span className={cn(CHIP_CLASS, extra.className)}>{extra.label}</span>}
    </div>
  );
}
