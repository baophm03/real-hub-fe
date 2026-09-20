"use client";

import { useState } from "react";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { ability } from "@/config/casl/ability";
import { useGetApiAuditLogs } from "@/lib/api/endpoints/audit-logs";
import {
  actionLabel,
  actionOptions,
  entityTypeLabel,
  entityTypeOptions,
  getActionBadgeVariant,
  type AuditLog,
  type AuditLogsResponse,
} from "./_components/types";
import { formatDateTimeSeconds } from "@/utils";
import { AuditLogDetailDialog } from "./_components/audit-log-detail-dialog";

export default function AuditLogsPage() {
  const canRead = ability.can("READ", "AUDIT");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const { data: raw, isLoading } = useGetApiAuditLogs({
    action: (actionFilter || undefined) as any,
    entityType: (entityTypeFilter || undefined) as any,
    page: String(page),
    pageSize: String(pageSize),
  });

  const res = raw as unknown as AuditLogsResponse | undefined;
  const logs: AuditLog[] = res?.items ?? [];
  const total = res?.total ?? 0;
  const totalPages = res?.totalPages ?? 1;

  const filtered = search.trim()
    ? logs.filter(
      (l) =>
        l.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        l.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.entityId?.toLowerCase().includes(search.toLowerCase()),
    )
    : logs;

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "createdAt",
      header: "Thời gian",
      cell: ({ row }) => (
        <span className="text-xs text-foreground-muted">
          {formatDateTimeSeconds(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "action",
      header: "Hành động",
      cell: ({ row }) => (
        <Badge variant={getActionBadgeVariant(row.original.action)}>
          {actionLabel[row.original.action] ?? row.original.action}
        </Badge>
      ),
    },
    {
      accessorKey: "entityType",
      header: "Đối tượng",
      cell: ({ row }) => (
        <span className="text-sm">
          {entityTypeLabel[row.original.entityType] ?? row.original.entityType}
        </span>
      ),
    },
    {
      accessorKey: "user",
      header: "Người thực hiện",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.original.user?.fullName ?? "Hệ thống"}
          </span>
          {row.original.user?.email && (
            <span className="text-xs text-foreground-muted">
              {row.original.user.email}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "ipAddress",
      header: "IP",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.original.ipAddress ?? "—"}
        </span>
      ),
    },
  ];

  if (!canRead) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Cài đặt"
          title="Audit logs"
          description="Lịch sử thao tác của người dùng trong hệ thống"
        />
        <EmptyState
          icon={<ScrollText size={24} />}
          title="Không có quyền"
          description="Bạn không có quyền xem audit logs."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cài đặt"
        title="Audit logs"
        description="Lịch sử thao tác của người dùng trong hệ thống. Xem trước/sau thay đổi, IP, thời gian."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Tìm theo người dùng hoặc entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-[280px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter((v as string) ?? "");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Tất cả hành động">
                {(value: string) =>
                  actionOptions.find((o) => o.value === value)?.label ?? "Tất cả hành động"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} label={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={entityTypeFilter}
            onValueChange={(v) => {
              setEntityTypeFilter((v as string) ?? "");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tất cả đối tượng">
                {(value: string) =>
                  entityTypeOptions.find((o) => o.value === value)?.label ?? "Tất cả đối tượng"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {entityTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} label={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={24} />}
          title="Không có audit log"
          description="Chưa có log nào phù hợp với bộ lọc hiện tại."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => setDetailLog(row)}
            emptyMessage="Không tìm thấy log"
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground-muted">
              Trang <span className="font-medium text-foreground">{page}</span> / {totalPages}
              {" — "}
              <span className="font-medium text-foreground">{total}</span> log tổng cộng
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}

      <AuditLogDetailDialog
        log={detailLog}
        open={!!detailLog}
        onOpenChange={(o) => !o && setDetailLog(null)}
      />
    </div>
  );
}
