"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Handshake,
  Link2,
  Loader2,
  MapPin,
  QrCode,
  XCircle,
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
import { formatDate } from "@/utils";

interface MyAssignment {
  id: string;
  assignmentType: string;
  source: string;
  startsAt: string;
  expiresAt: string;
  status: string;
  publicLinkCode: string | null;
  createdAt: string;
  property?: { id: string; title: string; propertyCode: string } | null;
}

const statusConfig: Record<string, { label: string; variant: "green" | "yellow" | "red" | "default" }> = {
  ACTIVE: { label: "Đang phụ trách", variant: "green" },
  EXPIRED: { label: "Hết hạn", variant: "yellow" },
  REVOKED: { label: "Đã huỷ", variant: "red" },
};

const statusChipClass: Record<string, string> = {
  green: "bg-accent-green text-accent-green-text",
  yellow: "bg-accent-yellow text-accent-yellow-text",
  red: "bg-accent-red text-accent-red-text",
  default: "bg-surface-muted text-foreground-muted",
};

function daysLeft(expiresAt: string): number {
  const now = new Date();
  const exp = new Date(expiresAt);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}


export default function MyPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<MyAssignment | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await customInstance<{ success: boolean; data: MyAssignment[] }>({
          url: "/api/assignments/mine",
          method: "GET",
          params: { limit: "100" },
        });
        const found = (res?.data ?? []).find((a) => a.id === assignmentId);
        if (!found) {
          toast.error("Không tìm thấy phụ trách");
          router.push("/vi/sales-portal/my-properties");
          return;
        }
        setAssignment(found);
      } catch {
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoadingAssignment(false);
      }
    })();
  }, [assignmentId]);

  const propertyId = assignment?.property?.id ?? "";

  const { data: propertyData, isLoading: loadingProperty } = useGetApiPropertyId(propertyId);
  const property = (propertyData as unknown as { data: Property })?.data;

  const { data: mediaData } = useGetApiPropertyMedia(propertyId);
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

  const handleRevoke = async () => {
    if (!assignment) return;
    if (!confirm("Bạn chắc chắn muốn huỷ phụ trách sản phẩm này?")) return;
    setRevoking(true);
    try {
      await customInstance({
        url: `/api/assignments/${assignment.id}/revoke`,
        method: "PATCH",
      });
      toast.success("Đã huỷ phụ trách");
      router.push("/vi/sales-portal/my-properties");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi khi huỷ");
    } finally {
      setRevoking(false);
    }
  };

  if (loadingAssignment || loadingProperty) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-[400px] animate-pulse rounded-lg bg-surface-muted" />
      </div>
    );
  }

  if (!assignment || !property) return null;

  const status = statusConfig[assignment.status] ?? statusConfig.REVOKED;
  const left = daysLeft(assignment.expiresAt);

  return (
    <div className="flex flex-col gap-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/vi/sales-portal/my-properties")}
          className="group inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-surface-muted transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-0.5">
            <ArrowLeft size={14} />
          </span>
          Quay lại danh sách
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/vi/listings/${property.propertyCode}`;
              navigator.clipboard.writeText(url);
              toast.success("Đã sao chép link chia sẻ");
            }}
            title="Sao chép link trang chủ"
          >
            <Link2 size={14} />
            Link
          </Button>
          <Button variant="outline" size="sm" disabled title="Mã QR (sắp có)">
            <QrCode size={14} />
            QR
          </Button>
          {assignment.status === "ACTIVE" && (
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleRevoke} disabled={revoking}>
              {revoking ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Huỷ phụ trách
            </Button>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <Link href="/vi/sales-portal/my-properties" className="transition-colors hover:text-foreground">
          Sản phẩm phụ trách
        </Link>
        <ChevronRight size={12} />
        <span>{property.propertyCode}</span>
      </div>

      {/* Assignment info bar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
          <Clock size={16} className="shrink-0 text-foreground-muted" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-foreground-muted">Bắt đầu</span>
            <span className="text-sm font-medium text-foreground">{formatDate(assignment.startsAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
          <Clock size={16} className="shrink-0 text-foreground-muted" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-foreground-muted">Hết hạn</span>
            <span className="text-sm font-medium text-foreground">{formatDate(assignment.expiresAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
          <Handshake size={16} className="shrink-0 text-foreground-muted" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-foreground-muted">Còn lại</span>
            <span className={`text-sm font-medium ${left <= 1 ? "text-destructive" : left <= 3 ? "text-accent-yellow-text" : "text-foreground"}`}>
              {assignment.status === "ACTIVE" ? (left > 0 ? `${left} ngày` : "Hết hôm nay") : "—"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
          <Link2 size={16} className="shrink-0 text-foreground-muted" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-foreground-muted">Link chia sẻ</span>
            <span className="truncate text-xs font-medium text-primary">
              /vi/listings/{property.propertyCode}
            </span>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <PropertyGallery images={gallery} propertyCode={property.propertyCode} />

      {/* Header: badges + title + address */}
      <div className="flex flex-col gap-2">
        <PropertyBadges
          property={property}
          extra={{ label: status.label, className: statusChipClass[status.variant] }}
        />
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-black md:text-4xl">
          {property.title}
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
    </div>
  );
}
