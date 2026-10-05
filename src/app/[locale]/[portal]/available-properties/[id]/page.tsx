"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { formatPrice } from "@/utils";
import {
  ArrowLeft,
  ChevronRight,
  Handshake,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetApiPropertyId, useGetApiPropertyMedia } from "@/lib/api/endpoints/properties";
import { useGetApiFormSchemas } from "@/lib/api/endpoints/dynamic-fields";
import { Property } from "@/lib/api/types/properties";
import { PropertyGallery } from "@/components/shared/property-detail/property-gallery";
import { PropertyHighlights } from "@/components/shared/property-detail/property-highlights";
import { PropertySpecs } from "@/components/shared/property-detail/property-specs";
import { PropertyBadges } from "@/components/shared/property-detail/property-badges";
import { PropertyDescription } from "./_components/property-description";
import { PropertyMap } from "./_components/property-map";
import { OwnerContactSidebar } from "./_components/owner-contact-sidebar";
import { customInstance } from "@/lib/api/mutator/custom-instance";

const txLabel: Record<string, string> = {
  SALE: "Bán",
  RENT: "Cho thuê",
  TRANSFER: "Chuyển nhượng",
  INVESTMENT: "Đầu tư",
};

const sellingModeLabel: Record<string, string> = {
  SELF_SELL: "Tự bán",
  SALES_DISTRIBUTION: "Sales bán hộ",
  HYBRID: "Kết hợp",
  INTERNAL_ONLY: "Chỉ nội bộ",
  MARKETPLACE_PUBLIC: "Sàn công khai",
};

export default function AvailablePropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: propertyData, isLoading } = useGetApiPropertyId(id);
  const property = (propertyData as unknown as { data: Property })?.data;

  const { data: mediaData } = useGetApiPropertyMedia(id);
  const mediaItems = useMemo(() => {
    const raw = (mediaData as any)?.data;
    if (!raw) return [];
    const items = Array.isArray(raw) ? raw : [];
    return items
      .filter((m: any) => m.type === "IMAGE" || m.file?.mimeType?.startsWith("image/"))
      .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [mediaData]);

  const gallery = mediaItems.map((m: any) => m.file?.url).filter(Boolean) as string[];

  const [claiming, setClaiming] = useState(false);

  const priceNum = Number(property?.price || 0);

  const propertyTypeId = property?.propertyType?.id;

  const { data: schemaData } = useGetApiFormSchemas({ entityType: "PROPERTY" });
  const allSchemas = ((schemaData as any)?.data as any[]) || [];
  const schemas = useMemo(
    () => allSchemas.filter(
      (s) => !s.propertyType || s.propertyType?.id === undefined || s.propertyType?.id === propertyTypeId,
    ),
    [allSchemas, propertyTypeId],
  );

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await customInstance({
        url: "/api/assignments",
        method: "POST",
        data: {
          propertyId: id,
          assignmentType: "SALES",
          source: "SELF_ASSIGN",
        },
      });
      toast.success("Nhận phụ trách thành công");
      router.push("/vi/sales-portal/available-properties");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Có lỗi khi nhận phụ trách";
      toast.error(msg);
    } finally {
      setClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-muted" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-surface-muted" />
        </div>
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-[400px] animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/vi/sales-portal/available-properties")}
          className="group inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-surface-muted transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-0.5">
            <ArrowLeft size={14} />
          </span>
          Quay lại danh sách
        </button>
        <Button onClick={handleClaim} disabled={claiming}>
          {claiming ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang nhận...
            </>
          ) : (
            <>
              <Handshake size={16} />
              Nhận phụ trách
            </>
          )}
        </Button>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <Link href="/vi/sales-portal/available-properties" className="transition-colors hover:text-foreground">
          Nhận phụ trách
        </Link>
        <ChevronRight size={12} />
        <span>{property?.propertyCode ?? "-"}</span>
      </div>

      {/* Image Gallery */}
      <PropertyGallery images={gallery} propertyCode={property?.propertyCode} />

      {/* Header: badges + title + address */}
      <div className="flex flex-col gap-2">
        <PropertyBadges
          property={property}
          extra={{
            label: sellingModeLabel[property?.sellingMode ?? ""] ?? property?.sellingMode ?? "",
            className: "bg-accent-blue text-accent-blue-text",
          }}
        />
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-black md:text-4xl">
          {property?.title ?? "-"}
        </h1>
        <p className="flex items-center gap-2 text-sm text-foreground-muted md:text-base">
          <MapPin size={16} className="text-primary" />
          {property?.district?.name ?? "-"}, {property?.province?.name ?? "-"}
        </p>
      </div>

      {/* Main Layout: Content + Sidebar */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left Column: Details */}
        <div className="flex-grow space-y-10 w-full lg:w-2/3">
          <PropertySpecs property={property} schemas={schemas} />

          <PropertyDescription property={property} />

          <PropertyHighlights property={property} schemas={schemas} />

          <PropertyMap property={property} />
        </div>

        {/* Right Column: Owner Contact Sidebar */}
        <OwnerContactSidebar property={property} />
      </div>

      {/* CTA bottom */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-lg border border-border bg-surface/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-xl font-medium text-primary">
            {property ? formatPrice(priceNum) : "-"}
          </span>
          <span className="text-xs text-foreground-muted">
            {property?.propertyType?.name} · {txLabel[property?.transactionType ?? ""] ?? property?.transactionType}
          </span>
        </div>
        <Button onClick={handleClaim} disabled={claiming} size="lg">
          {claiming ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang nhận...
            </>
          ) : (
            <>
              <Handshake size={16} />
              Nhận phụ trách
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
