"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import {
  Eye,
  Filter,
  Headset,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useGetApiPropertyContacts } from "@/lib/api/endpoints/property-contacts";
import type { ColumnDef } from "@tanstack/react-table";
import type { GetApiPropertyContactsStatus } from "@/lib/api/models/getApiPropertyContactsStatus";
import {
  ConsultationDetailDialog,
  type PropertyContact,
} from "./_components/consultation-detail-dialog";

interface PropertyContactsResponse {
  success: boolean;
  data: PropertyContact[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
  timestamp: string;
}

const statusConfig: Record<
  PropertyContact["status"],
  { label: string; variant: "red" | "blue" | "green" | "default" }
> = {
  UNREAD: { label: "Chưa đọc", variant: "red" },
  READ: { label: "Đã đọc", variant: "blue" },
  REPLIED: { label: "Đã phản hồi", variant: "green" },
  ARCHIVED: { label: "Đã lưu trữ", variant: "default" },
};

export default function ConsultationsPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PropertyContact["status"] | "ALL">("UNREAD");
  const [detailContact, setDetailContact] = useState<PropertyContact | null>(null);

  // Query for counts (no status filter)
  const { data: allContactsData } = useGetApiPropertyContacts({
    limit: "50",
    offset: "0",
  });
  const allContacts =
    ((allContactsData as unknown as PropertyContactsResponse)?.data) || [];

  // Query for table (with filters)
  const pagination = usePagination(10);
  const { data: contactsData, isLoading, refetch } = useGetApiPropertyContacts({
    status: statusFilter === "ALL" ? undefined : (statusFilter as GetApiPropertyContactsStatus),
    search: search.trim() || undefined,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  const contacts =
    ((contactsData as unknown as PropertyContactsResponse)?.data) || [];
  const meta = (contactsData as unknown as PropertyContactsResponse)?.meta;
  const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? 0) / pagination.pageSize));

  const columns = useMemo<ColumnDef<PropertyContact>[]>(
    () => [
      {
        accessorKey: "propertyId",
        header: "Bất động sản",
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(portalPath(`/properties/${row.original.propertyId}`));
            }}
            className="group flex flex-col gap-0.5 text-left"
          >
            <span className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 max-w-[220px]">
              {row.original.propertyId}
            </span>
          </button>
        ),
      },
      {
        id: "people",
        header: "Người liên hệ",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium break-all">{row.original.createdBy || "—"}</span>
            <span className="text-xs break-all text-foreground-muted">
              Nhận xử lý: {row.original.receiverId || "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const cfg = statusConfig[row.original.status] ?? statusConfig.UNREAD;
          return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày gửi",
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground-muted text-xs">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString("vi-VN")
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailContact(row.original)}
              leftIcon={<Eye size={14} />}
            >
              Chi tiết
            </Button>
          </div>
        ),
      },
    ],
    [router, portalPath],
  );

  const filterTabs: { value: PropertyContact["status"] | "ALL"; label: string }[] = [
    { value: "ALL", label: "Tất cả" },
    { value: "UNREAD", label: "Chưa đọc" },
    { value: "READ", label: "Đã đọc" },
    { value: "REPLIED", label: "Đã phản hồi" },
    { value: "ARCHIVED", label: "Đã lưu trữ" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Tư vấn"
        description="Yêu cầu tư vấn từ khách hàng qua form liên hệ bất động sản"
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const count =
            tab.value === "ALL"
              ? allContacts.length
              : allContacts.filter((c) => c.status === tab.value).length;
          const active = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-foreground-muted hover:bg-surface-muted"
                }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${active
                  ? "bg-primary/20 text-primary"
                  : "bg-surface-muted text-foreground-muted"
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          type="search"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-auto min-w-0"
        />
        <Button variant="outline" size="icon" aria-label="Bộ lọc" className="shrink-0">
          <Filter size={16} />
        </Button>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />
      ) : contacts.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            data={contacts}
            onRowClick={(contact) => setDetailContact(contact)}
            emptyMessage="Không có yêu cầu tư vấn"
          />
          <PaginationBar
            pageSize={pagination.pageSize}
            setPageSize={pagination.setPageSize}
            currentPage={pagination.currentPage}
            setCurrentPage={pagination.setCurrentPage}
            totalPages={totalPages}
          />
        </>
      ) : (
        <EmptyState
          icon={<Headset size={24} />}
          title="Chưa có yêu cầu tư vấn"
          description="Các yêu cầu tư vấn từ form liên hệ trên trang bất động sản sẽ hiển thị tại đây"
        />
      )}

      <ConsultationDetailDialog
        contact={detailContact}
        onOpenChange={(open) => !open && setDetailContact(null)}
        onUpdated={(updated) => {
          setDetailContact(updated);
          refetch();
          router.refresh();
        }}
        onDeleted={() => {
          refetch();
          router.refresh();
        }}
      />
    </div>
  );
}
