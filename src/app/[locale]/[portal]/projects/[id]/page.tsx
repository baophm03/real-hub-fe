"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Camera,
  ChevronRight,
  Hash,
  Home,
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Square,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetApiProjectId } from "@/lib/api/endpoints/projects";
import { Project, ProjectProperty } from "@/lib/api/types/projects";
import { formatPriceWithTransaction } from "@/utils";
import { getProjectScale, getProjectImages, getPropertyImageUrl } from "@/utils/project-helpers";
import { pickDynamicValue } from "@/components/shared/property-utils";
import { formatLocationShort } from "@/utils";
import { DeleteProjectDialog } from "../_components/delete-project-dialog";
import { AuditLogSection } from "@/app/[locale]/[portal]/audit-logs/_components/audit-log-section";

const projectStatusLabels: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
};

const businessStatusBadge: Record<string, { label: string; class: string }> = {
  AVAILABLE: { label: "Sẵn có", class: "bg-accent-green text-accent-green-text" },
  RESERVED: { label: "Đặt cọc", class: "bg-accent-yellow text-accent-yellow-text" },
  SOLD: { label: "Đã bán", class: "bg-accent-red text-accent-red-text" },
  RENTED: { label: "Đã thuê", class: "bg-accent-blue text-accent-blue-text" },
  OFF_MARKET: { label: "Ngừng bán", class: "bg-surface-muted text-foreground-muted" },
};

const txLabel: Record<string, string> = {
  SALE: "Bán",
  RENT: "Cho thuê",
  TRANSFER: "Chuyển nhượng",
  INVESTMENT: "Đầu tư",
};

const badgeBase =
  "inline-flex h-6 min-w-[3.25rem] items-center justify-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-md shadow-sm whitespace-nowrap";

const BEDROOM_KEYS = ["bed_room_count", "bedroom_count", "bedrooms", "beds", "phong_ngu"];
const BATHROOM_KEYS = ["bathroom_count", "bathrooms", "baths", "pathroom_count", "phong_tam"];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portalPath = usePortalPath();
  const id = params.id as string;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: projectData, isLoading } = useGetApiProjectId(id);
  const project = (projectData as unknown as { data: Project })?.data ?? null;
  const properties = project?.properties ?? [];

  const projectImages = useMemo(
    () => (project ? getProjectImages(project) : []),
    [project],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-8 md:py-12 lg:px-12">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-surface-muted" />
        <div className="mb-8 aspect-[16/9] animate-pulse rounded-lg bg-surface-muted" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-8 md:py-12 lg:px-12">
        <Link
          href={portalPath("/projects")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>
        <div className="mx-auto max-w-3xl py-20 text-center">
          <h1 className="mb-2 font-serif text-2xl font-semibold">Không tìm thấy dự án</h1>
          <p className="text-sm text-foreground-muted">
            Dự án bạn tìm kiếm không tồn tại hoặc đã bị xoá.
          </p>
        </div>
      </div>
    );
  }

  const location = formatLocationShort(project, "Đang cập nhật");
  const scale = getProjectScale(project);
  const heroImage = projectImages[0]?.url || null;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-8 md:py-12 lg:px-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={portalPath("/projects")}
          className="inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(portalPath(`/projects/${id}/edit`))}
        >
          <Pencil size={14} />
          Chỉnh sửa
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={14} />
          Xóa dự án
        </Button>
      </div>

      {/* Hero */}
      <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt={project.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-muted">
            <div className="flex flex-col items-center gap-2 text-foreground-muted">
              <Camera size={32} />
              <span className="text-sm">Chưa có hình ảnh cho dự án này</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-primary-foreground">
            {projectStatusLabels[project.status] ?? project.status}
          </span>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {project.name}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
            <MapPin size={14} />
            <span>{location}</span>
          </p>
        </div>
      </div>

      {/* Gallery */}
      {projectImages.length > 1 && (
        <div className="mb-8 grid grid-cols-2 gap-2 md:grid-cols-4">
          {projectImages.slice(1, 5).map((img, i) => (
            <div
              key={img.id || i}
              className="relative aspect-[4/3] overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption || project.name}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Description */}
        <div>
          <h2 className="mb-3 font-serif text-xl font-semibold">Giới thiệu dự án</h2>
          {project.description ? (
            <p className="whitespace-pre-line text-base leading-relaxed text-foreground-muted">
              {project.description}
            </p>
          ) : (
            <p className="text-base leading-relaxed text-foreground-muted">
              Đang cập nhật thông tin giới thiệu cho dự án {project.name}.
            </p>
          )}
        </div>

        {/* Details — gộp Quick Info + Thông tin chi tiết, mỗi mục có icon */}
        <div>
          <h2 className="mb-4 font-serif text-xl font-semibold">Thông tin chi tiết</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[
              { label: "Tên dự án", value: project.name, icon: Building2 },
              { label: "Mã dự án", value: project.code, icon: Hash },
              { label: "Vị trí", value: location, icon: MapPin },
              { label: "Chủ đầu tư", value: project.developer ?? "Đang cập nhật", icon: Building2 },
              { label: "Quy mô", value: scale, icon: Ruler },
              {
                label: "Trạng thái",
                value: projectStatusLabels[project.status] ?? project.status,
                icon: Tag,
              },
              { label: "Giá từ", value: "Đang cập nhật", icon: Wallet },
              { label: "Loại hình", value: "Đang cập nhật", icon: Home },
              { label: "Bàn giao", value: (project as any).handoverDate ?? "Đang cập nhật", icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Icon size={14} className="shrink-0 text-primary" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">
                    {label}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground line-clamp-2">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Properties in project */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-serif text-xl font-semibold">Bất động sản thuộc dự án</h2>
            <Button
              onClick={() => router.push(portalPath(`/properties/new?projectId=${id}`))}
              size="sm"
            >
              <Plus size={16} />
              Thêm BĐS vào dự án
            </Button>
          </div>

          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm text-foreground-muted">
                Chưa có bất động sản nào trong dự án này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => {
                const badge = businessStatusBadge[property.businessStatus ?? ""];
                const imageUrl = getPropertyImageUrl(property);
                const bedrooms = pickDynamicValue(property.dynamicValuesJson, BEDROOM_KEYS);
                const bathrooms = pickDynamicValue(property.dynamicValuesJson, BATHROOM_KEYS);
                const tx = property.transactionType ?? "";
                return (
                  <Link
                    key={property.id}
                    href={portalPath(`/properties/${property.id}`)}
                    className="group flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-primary transition-colors shadow-sm hover:shadow-md"
                  >
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={property.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-muted">
                          <span className="text-xs text-foreground-muted">
                            Không có hình ảnh
                          </span>
                        </div>
                      )}
                      {badge && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className={`${badgeBase} ${badge.class}`}>{badge.label}</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 z-10">
                        <span
                          className={`${badgeBase} ${tx === "SALE"
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent-blue text-accent-blue-text"
                            }`}
                        >
                          {txLabel[tx] ?? tx}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h3 className="font-serif text-lg font-medium text-primary truncate pr-2 group-hover:text-primary/80 transition-colors">
                        {property.title}
                      </h3>

                      <p className="text-sm text-foreground-muted flex items-center gap-1">
                        <MapPin size={16} />
                        <span>
                          {property?.district?.name ?? "Đang cập nhật"},{" "}
                          {property?.province?.name ?? "Đang cập nhật"}
                        </span>
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
                          {formatPriceWithTransaction(String(property.price ?? 0), tx)}
                        </div>
                      </div>

                      {/* Thông tin phòng ngủ, phòng tắm, diện tích */}
                      <div className="flex flex-wrap items-center justify-start gap-3 mt-auto pt-4 border-t border-border text-xs text-foreground-muted">
                        {bedrooms && (
                          <span className="flex items-center gap-1">
                            <BedDouble size={13} className="shrink-0" />
                            <span className="tabular-nums">{bedrooms}</span>
                            <span>PN</span>
                          </span>
                        )}
                        {bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath size={13} className="shrink-0" />
                            <span className="tabular-nums">{bathrooms}</span>
                            <span>WC</span>
                          </span>
                        )}
                        {property.area != null && (
                          <span className="flex items-center gap-1">
                            <Square size={13} className="shrink-0" />
                            <span className="tabular-nums">
                              {property.area.toLocaleString("vi-VN")}
                            </span>
                            <span>m²</span>
                          </span>
                        )}
                      </div>

                      {/* Xem chi tiết */}
                      <div className="flex items-center gap-1 pt-2 text-xs font-medium text-primary">
                        Xem chi tiết
                        <ArrowRight size={13} className="shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DeleteProjectDialog
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <AuditLogSection entityType="project" entityId={id} />
    </div>
  );
}
