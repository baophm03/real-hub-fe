"use client";

import { useState, useMemo } from "react";
import { Plus, Building2, MoreVertical, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Can } from "@casl/react";
import { ability } from "@/config/casl/ability";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  useGetApiTenants,
  getGetApiTenantsQueryKey,
} from "@/lib/api/endpoints/tenants";
import { useQueryClient } from "@tanstack/react-query";
import {
  typeLabel,
  typeOptions,
  statusConfig,
  statusFilters,
  type Tenant,
} from "./_components/types";
import { formatDate } from "@/utils";
import { TenantFormDialog } from "./_components/tenant-form-dialog";
import { TenantDetailDialog } from "./_components/tenant-detail-dialog";

export default function TenantsPage() {
  const canCreate = ability.can("CREATE", "TENANT");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Tenant | null>(null);

  const { data: tenantsRaw, isLoading } = useGetApiTenants({
    search: search.trim() || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });
  const tenants: Tenant[] = Array.isArray(tenantsRaw) ? tenantsRaw : [];

  const columns = useMemo<ColumnDef<Tenant>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tên tenant",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.logoUrl ? (
              <img
                src={row.original.logoUrl}
                alt={row.original.name}
                className="size-8 rounded object-contain"
              />
            ) : (
              <div className="flex size-8 items-center justify-center rounded bg-primary/10">
                <Building2 size={16} className="text-primary" />
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{row.original.name}</span>
              <span className="text-xs text-foreground-muted">
                {row.original._count?.domains ?? 0} domains ·{" "}
                {row.original._count?.features ?? 0} features
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "code",
        header: "Mã",
        cell: ({ row }) => (
          <span className="font-mono text-sm tabular-nums">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Loại",
        cell: ({ row }) => (
          <span className="text-sm">{typeLabel[row.original.type] ?? row.original.type}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const cfg = statusConfig[row.original.status] ?? statusConfig.ACTIVE;
          const Icon = cfg.icon;
          return (
            <Badge variant={cfg.variant}>
              <Icon size={10} />
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs text-foreground-muted">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-surface-muted"
                    aria-label="Thao tác"
                  />
                }
              >
                <MoreVertical size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e: any) => {
                    e.stopPropagation();
                    setDetailTarget(row.original);
                  }}
                >
                  <Eye size={14} />
                  Chi tiết
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Quản lý tenant"
        description="Danh sách agency / chủ đầu tư / đơn vị phân phối trên nền tảng"
        actions={
          <Can I="CREATE" a="TENANT">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Tạo tenant
            </Button>
          </Can>
        }
      />

      {/* Count + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{tenants.length}</span> tenant
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Tìm theo tên / mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-[240px]"
          />
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter((v as string) ?? "")}
          >
            <SelectTrigger className="w-[160px] shrink-0">
              <SelectValue placeholder="Tất cả loại">
                {(value: string) =>
                  typeOptions.find((o) => o.value === value)?.label ?? "Tất cả loại"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} label={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v as string) ?? "")}
          >
            <SelectTrigger className="w-[160px] shrink-0">
              <SelectValue placeholder="Tất cả trạng thái">
                {(value: string) =>
                  statusFilters.find((s) => s.value === value)?.label ?? "Tất cả trạng thái"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((s) => (
                <SelectItem key={s.value || "ALL"} value={s.value || "ALL"} label={s.label}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-surface-muted" />
      ) : tenants.length > 0 ? (
        <DataTable
          columns={columns}
          data={tenants}
          onRowClick={(t) => setDetailTarget(t)}
          emptyMessage="Không tìm thấy tenant"
        />
      ) : (
        <EmptyState
          icon={<Building2 size={24} />}
          title="Chưa có tenant"
          description="Tạo tenant đầu tiên để bắt đầu quản lý agency / chủ đầu tư"
          action={
            canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Tạo tenant đầu tiên
              </Button>
            ) : undefined
          }
        />
      )}

      <TenantFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => queryClient.invalidateQueries({ queryKey: getGetApiTenantsQueryKey() })}
      />

      <TenantDetailDialog
        tenant={detailTarget}
        open={!!detailTarget}
        onOpenChange={(o) => !o && setDetailTarget(null)}
      />
    </div>
  );
}
