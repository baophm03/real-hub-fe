"use client";

import { useState, useMemo } from "react";
import { Mail, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useGetApiContactRequests } from "@/lib/api/endpoints/contact-requests";
import type { GetApiContactRequestsStatus } from "@/lib/api/models/getApiContactRequestsStatus";
import {
  statusConfig,
  filterTabs,
  type ContactRequest,
  type ContactRequestsResponse,
} from "./_components/types";
import { formatDateTime } from "@/utils";
import { ContactRequestDetailDialog } from "./_components/contact-request-detail-dialog";

export default function ContactRequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactRequest["status"] | "ALL">("UNREAD");
  const [detailRequest, setDetailRequest] = useState<ContactRequest | null>(null);

  // Query for counts (no status filter)
  const { data: allData } = useGetApiContactRequests({ limit: "50", offset: "0" });
  const allRequests =
    ((allData as unknown as ContactRequestsResponse)?.data) ?? [];

  // Query for table (with filters)
  const pagination = usePagination(10);
  const { data: requestsData, isLoading, refetch } = useGetApiContactRequests({
    status: statusFilter === "ALL" ? undefined : (statusFilter as GetApiContactRequestsStatus),
    search: search.trim() || undefined,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  const requests = ((requestsData as unknown as ContactRequestsResponse)?.data) ?? [];
  const meta = (requestsData as unknown as ContactRequestsResponse)?.meta;
  const totalPages =
    meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? 0) / pagination.pageSize));

  const columns = useMemo<ColumnDef<ContactRequest>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Khách hàng",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.fullName}</span>
            {row.original.email && (
              <span className="text-xs text-foreground-muted">{row.original.email}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Số điện thoại",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">{row.original.phone}</span>
        ),
      },
      {
        accessorKey: "subject",
        header: "Chủ đề",
        cell: ({ row }) => (
          <span className="text-sm text-foreground-muted line-clamp-1 max-w-[240px]">
            {row.original.subject || "—"}
          </span>
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
            {formatDateTime(row.original.createdAt)}
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
              onClick={() => setDetailRequest(row.original)}
              leftIcon={<Eye size={14} />}
            >
              Chi tiết
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Yêu cầu liên hệ"
        description="Yêu cầu liên hệ từ khách hàng qua form trang Contact"
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const count =
            tab.value === "ALL"
              ? allRequests.length
              : allRequests.filter((r) => r.status === tab.value).length;
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
          className="w-full sm:w-auto min-w-0 sm:min-w-[260px]"
        />
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />
      ) : requests.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            data={requests}
            onRowClick={(req) => setDetailRequest(req)}
            emptyMessage="Không có yêu cầu liên hệ"
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
          icon={<Mail size={24} />}
          title="Chưa có yêu cầu liên hệ"
          description="Các yêu cầu từ form liên hệ trên trang Contact sẽ hiển thị tại đây"
        />
      )}

      <ContactRequestDetailDialog
        request={detailRequest}
        onOpenChange={(open) => !open && setDetailRequest(null)}
        onUpdated={(updated) => {
          setDetailRequest(updated);
          refetch();
        }}
        onDeleted={() => {
          refetch();
        }}
      />
    </div>
  );
}
