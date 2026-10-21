"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { Plus, UserX, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { usePagination } from "@/lib/hooks/use-pagination";
import {
  useGetApiCustomersAdmin,
} from "@/lib/api/endpoints/customers";
import type { ColumnDef } from "@tanstack/react-table";
import type { GetApiCustomersType } from "@/lib/api/models/getApiCustomersType";
import type { GetApiCustomersStatus } from "@/lib/api/models/getApiCustomersStatus";
import { Can } from '@casl/react';
import {
  DeleteCustomerDialog,
  type CustomerDeleteTarget,
} from "./_components/delete-customer-dialog";

interface CustomerType {
  id: string;
  type: string;
}

interface CustomerUser {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface CustomerRow extends CustomerDeleteTarget {
  userId?: string | null;
  user?: CustomerUser | null;
  email?: string;
  status: string;
  types: CustomerType[];
  _count?: { leads: number; needs: number };
  createdAt: string;
}

interface CustomersResponse {
  success: boolean;
  data: CustomerRow[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
  timestamp: string;
}

const typeLabel: Record<string, string> = {
  BUYER: "Người mua",
  SELLER: "Người bán",
  TENANT: "Người thuê",
  LANDLORD: "Cho thuê",
  INVESTOR: "Nhà đầu tư",
};

const statusLabel: Record<string, { label: string; variant: "green" | "default" | "red" }> = {
  ACTIVE: { label: "Hoạt động", variant: "green" },
  INACTIVE: { label: "Không hoạt động", variant: "default" },
  BLACKLISTED: { label: "Blacklist", variant: "red" },
};

const typeFilters: { value: GetApiCustomersType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả loại" },
  { value: "BUYER", label: "Người mua" },
  { value: "SELLER", label: "Người bán" },
  { value: "RENTER", label: "Người thuê" },
  { value: "LANDLORD", label: "Cho thuê" },
  { value: "INVESTOR", label: "Nhà đầu tư" },
];

const statusFilters: { value: GetApiCustomersStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Không hoạt động" },
  { value: "BLACKLISTED", label: "Blacklist" },
];

export default function CustomersPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<GetApiCustomersType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<GetApiCustomersStatus | "ALL">("ALL");
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);

  const pagination = usePagination(10);
  const { data: customersData, isLoading, refetch } = useGetApiCustomersAdmin({
    search: search.trim() || undefined,
    type: typeFilter === "ALL" ? undefined : (typeFilter as GetApiCustomersType),
    status: statusFilter === "ALL" ? undefined : (statusFilter as GetApiCustomersStatus),
    limit: pagination.limit,
    offset: pagination.offset,
  });
  const customers = ((customersData as unknown as CustomersResponse)?.data) || [];
  const meta = (customersData as unknown as CustomersResponse)?.meta;
  const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? 0) / pagination.pageSize));

  const columns = useMemo<ColumnDef<CustomerRow>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Khách hàng",
        cell: ({ row }) => {
          const name = row.original.user?.fullName || row.original.fullName || "—";
          const email = row.original.user?.email || row.original.email;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{name}</span>
              {email && (
                <span className="text-xs text-foreground-muted truncate max-w-[180px]">
                  {email}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Điện thoại",
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground-muted">
            {row.original.user?.phone || row.original.phone || "—"}
          </span>
        ),
      },
      {
        id: "types",
        header: "Loại",
        cell: ({ row }) => {
          const types = row.original.types || [];
          if (types.length === 0) return <span className="text-foreground-muted">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {types.map((t) => (
                <Badge key={t.id} variant="blue">
                  {typeLabel[t.type] ?? t.type}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const cfg = statusLabel[row.original.status] ?? { label: row.original.status, variant: "default" as const };
          return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        },
      },
      {
        id: "stats",
        header: "Tiềm năng / Nhu cầu",
        cell: ({ row }) => {
          const count = row.original._count;
          if (!count) return <span className="text-foreground-muted">—</span>;
          return (
            <span className="text-xs tabular-nums text-foreground-muted">
              {count.leads} / {count.needs}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
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
            <Can I="DELETE_OWN" a="CUSTOMER">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Đánh dấu không hoạt động"
                onClick={() =>
                  setDeleteTarget({
                    ...row.original,
                    fullName:
                      row.original.user?.fullName || row.original.fullName || "—",
                  })
                }
              >
                <UserX size={14} />
              </Button>
            </Can>
          </div>
        ),
      },
    ],
    [],
  );

  const totalCount = (customersData as unknown as CustomersResponse)?.meta?.total ?? customers.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Khách hàng"
        description="Quản lý danh sách khách hàng"
        actions={
          <Can I="CREATE" a="CUSTOMER">
            <Button onClick={() => router.push(portalPath("/customers/new"))}>
              <Plus size={16} />
              Thêm khách hàng
            </Button>
          </Can>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-auto min-w-0 sm:min-w-[260px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter((value as GetApiCustomersType | "ALL") ?? "ALL")}
            items={typeFilters}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              {typeFilters.map((f) => (
                <SelectItem key={f.value} value={f.value} label={f.label}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter((value as GetApiCustomersStatus | "ALL") ?? "ALL")}
            items={statusFilters}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((f) => (
                <SelectItem key={f.value} value={f.value} label={f.label}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />
      ) : customers.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            data={customers}
            onRowClick={(row) => router.push(portalPath(`/customers/${row.id}`))}
            emptyMessage="Không có khách hàng"
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
          icon={<Users size={24} />}
          title="Chưa có khách hàng"
          description="Thêm khách hàng đầu tiên để bắt đầu quản lý CRM"
          action={
            <Can I="CREATE" a="CUSTOMER">
              <Button onClick={() => router.push(portalPath("/customers/new"))}>
                <Plus size={16} />
                Thêm khách hàng
              </Button>
            </Can>
          }
        />
      )}

      {/* Delete confirmation dialog */}
      <DeleteCustomerDialog
        customer={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onRefetch={refetch}
      />
    </div>
  );
}
