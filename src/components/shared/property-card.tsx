"use client";

import type { Property } from "@/lib/api/types/properties";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MapPin, Square, BedDouble, Bath, ArrowRight } from "lucide-react";
import { formatPriceWithTransaction as formatPrice } from "@/utils";
import { cn } from "@/lib/utils";
import {
  propertyStatusBadgeMap,
  transactionLabelMap,
  propertyBadgeBase,
  extractFirstImageUrlFromMedia,
  getPropertyLocation,
  getPropertyBedrooms,
  getPropertyBathrooms,
} from "@/components/shared/property-utils";
import { FavoriteButton } from "@/components/shared/favorite-button";

// Re-export for backward compatibility
export {
  propertyStatusBadgeMap,
  transactionLabelMap,
  propertyBadgeBase,
  BEDROOM_KEYS,
  BATHROOM_KEYS,
  pickDynamicValue,
  extractFirstImageUrlFromMedia,
  getPropertyLocation,
  getPropertyBedrooms,
  getPropertyBathrooms,
} from "@/components/shared/property-utils";

// ── PropertyCard component ────────────────────────────────

interface PropertyCardProps {
  property: Property;
  imageUrl?: string | null;
  bedrooms?: string | null;
  bathrooms?: string | null;
  className?: string;
}

export function PropertyCard({
  property,
  imageUrl,
  bedrooms,
  bathrooms,
  className,
}: PropertyCardProps) {
  const t = useTranslations("public");
  const badge = propertyStatusBadgeMap[property.businessStatus ?? ""];
  const resolvedImageUrl = imageUrl ?? extractFirstImageUrlFromMedia(property.media);
  const resolvedBedrooms = bedrooms !== undefined ? bedrooms : getPropertyBedrooms(property);
  const resolvedBathrooms = bathrooms !== undefined ? bathrooms : getPropertyBathrooms(property);
  const location = getPropertyLocation(property);

  return (
    <Link
      href={`/listings/${property.propertyCode}`}
      className={cn(
        "group flex h-full flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-primary transition-colors",
        className,
      )}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-surface-muted">
        {resolvedImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedImageUrl}
            alt={property.title}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.endsWith("/image-fallback.jpg")) return;
              img.src = "/image-fallback.jpg";
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/image-fallback.jpg"
            alt={property.title}
            className="h-full w-full object-cover"
          />
        )}
        {/* Favorite toggle — top right */}
        <FavoriteButton propertyId={property.id} />
        {/* Transaction badge — top left */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              propertyBadgeBase,
              property.transactionType === "SALE"
                ? "bg-[#FCEAEB] text-[#C57B7A]"
                : "bg-accent-blue text-accent-blue-text",
            )}
          >
            {transactionLabelMap[property.transactionType]
              ? t(transactionLabelMap[property.transactionType])
              : property.transactionType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-serif text-lg font-medium text-black truncate pr-2 group-hover:text-black/80 transition-colors">
            {property.title}
          </h3>
        </div>

        <p className="text-sm text-foreground-muted flex items-center gap-1">
          <MapPin size={16} className="shrink-0" />
          <span>{location}</span>
        </p>

        {property.propertyType?.name && (
          <div className="flex gap-2 mt-1">
            <span className="bg-surface-muted text-xs px-2 py-1 rounded text-foreground-muted">
              {property.propertyType.name}
            </span>
          </div>
        )}

        {/* Giá tiền */}
        <div className="flex flex-col items-start justify-start gap-1 mt-1">
          <div className="font-serif text-2xl font-bold text-primary">
            {formatPrice(property.price, property.transactionType)}
          </div>
        </div>

        {/* Thông tin phòng ngủ, phòng tắm, diện tích */}
        <div className="flex flex-wrap items-center justify-start gap-3 mt-auto pt-4 border-t border-border text-xs text-foreground-muted">
          {resolvedBedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble size={13} className="shrink-0" />
              <span className="tabular-nums">{resolvedBedrooms}</span>
              <span>{t("common.bedroom")}</span>
            </span>
          )}
          {resolvedBathrooms && (
            <span className="flex items-center gap-1">
              <Bath size={13} className="shrink-0" />
              <span className="tabular-nums">{resolvedBathrooms}</span>
              <span>{t("common.bathroom")}</span>
            </span>
          )}
          {property.area != null && (
            <span className="flex items-center gap-1">
              <Square size={13} className="shrink-0" />
              <span className="tabular-nums">{property.area.toLocaleString("vi-VN")}</span>
              <span>{t("common.sqm")}</span>
            </span>
          )}
        </div>

        {/* Xem chi tiết */}
        <div className="flex items-center gap-1 pt-2 text-xs font-medium text-primary">
          {t("common.viewDetail")}
          <ArrowRight size={13} className="shrink-0" />
        </div>
      </div>
    </Link>
  );
}
