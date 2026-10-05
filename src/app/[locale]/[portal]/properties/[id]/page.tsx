"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetApiPropertyId, useGetApiPropertyMedia } from "@/lib/api/endpoints/properties";
import { useGetApiFormSchemas } from "@/lib/api/endpoints/dynamic-fields";
import { Property } from "@/lib/api/types/properties";
import { ContactSidebar } from "./_components/contact-sidebar";
import { PropertyGallery } from "@/components/shared/property-detail/property-gallery";
import { PropertyHighlights } from "@/components/shared/property-detail/property-highlights";
import { PropertySpecs } from "@/components/shared/property-detail/property-specs";
import { PropertyBadges } from "@/components/shared/property-detail/property-badges";
import { PropertyDescription } from "./_components/property-description";
import { PropertyMap } from "./_components/property-map";
import { WorkflowActions } from "./_components/workflow-actions";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portalPath = usePortalPath();
  const id = params.id as string;

  // server
  const { data: propertyData, isLoading } = useGetApiPropertyId(id);
  const property = (propertyData as unknown as { data: Property })?.data;

  // media
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

  const propertyTypeId = property?.propertyType?.id;

  const { data: schemaData } = useGetApiFormSchemas({ entityType: "PROPERTY" });
  const allSchemas = ((schemaData as any)?.data as any[]) || [];
  const schemas = useMemo(
    () => allSchemas.filter(
      (s) => !s.propertyType || s.propertyType?.id === undefined || s.propertyType?.id === propertyTypeId,
    ),
    [allSchemas, propertyTypeId],
  );

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
      {/* Back button + Edit */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(portalPath("/properties"))}
          className="group inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-surface-muted transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-0.5">
            <ArrowLeft size={14} />
          </span>
          Quay lại danh sách
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(portalPath(`/properties/${params.id}/edit`))}
        >
          <Pencil size={14} />
          Chỉnh sửa
        </Button>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <Link href={portalPath("/properties")} className="transition-colors hover:text-foreground">
          Bất động sản
        </Link>
        <ChevronRight size={12} />
        <span>{property?.province?.name ?? "-"}</span>
        <ChevronRight size={12} />
        <span>{property?.district?.name ?? "-"}</span>
      </div>

      {/* Image Gallery */}
      <PropertyGallery images={gallery} propertyCode={property?.propertyCode} />

      {/* Header: badges + title + address */}
      <div className="flex flex-col gap-2">
        <PropertyBadges property={property} />
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

        {/* Right Column: Workflow Actions + Contact Sidebar */}
        <div className="flex flex-col gap-4 w-full lg:w-1/3">
          <WorkflowActions propertyId={id} />
          <ContactSidebar property={property} />
        </div>
      </div>
    </div>
  );
}
