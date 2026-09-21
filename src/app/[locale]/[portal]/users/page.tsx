"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, UserCog, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@casl/react";
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
import type { ColumnDef } from "@tanstack/react-table";
import {
  useGetApiMemberships,
  usePatchApiMembershipsId,
  getGetApiMembershipsQueryKey,
} from "@/lib/api/endpoints/memberships";
import type { GetApiMembershipsStatus } from "@/lib/api/models/getApiMembershipsStatus";
import { CreateUserDialog } from "./_components/create-user-dialog";
import {
  EditUserDialog,
  type MembershipRow,
} from "./_components/edit-user-dialog";

interface MembershipsListResponse {
  data: MembershipRow[];
  total: number;
  limit: number;
  offset: number;
  meta?: { total: number; totalPages: number };
}

const statusLabel: Record<string, { label: string; variant: "green" | "default" }> = {
  ACTIVE: { label: "Hoạt động", variant: "green" },
  INACTIVE: { label: "Tắt", variant: "default" },
};

const statusFilters: { value: GetApiMembershipsStatus; label: string }[] = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Tắt" },
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<GetApiMembershipsStatus>("ACTIVE");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MembershipRow | null>(null);

  const pagination = usePagination(10);
  const { data: membershipsData, isLoading } = useGetApiMemberships({
    search: search.trim() || undefined,
    status: statusFilter,
    limit: pagination.limit,
    offset: pagination.offset,
  });

  const { mutate: patchMembership, isPending: isDisabling } = usePatchApiMembershipsId({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getGetApiMembershipsQueryKey() });
        router.refresh();
        toast.success("Đã vô hiệu hóa người dùng");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message?.[0] ?? "Vô hiệu hóa thất bại");
      },
    },
  });
  const memberships: MembershipRow[] =
    (membershipsData as unknown as MembershipsListResponse)?.data ?? [];
  const total =
    (membershipsData as unknown as MembershipsListResponse)?.total ?? memberships.length;
  const meta = (membershipsData as unknown as MembershipsListResponse)?.meta;
  const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? total) / pagination.pageSize));

  const columns = useMemo<ColumnDef<MembershipRow>[]>(
    () => [
      {
        id: "user",
        header: "Người dùng",
        cell: ({ row }) => {
          const u = row.original.user;
          if (!u) {
            return <span className="text-foreground-muted">—</span>;
          }
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{u.fullName}</span>
              <span className="text-xs text-foreground-muted truncate max-w-[220px]">
                {u.email}
              </span>
              {u.username && (
                <span className="text-xs font-mono text-foreground-muted/80 truncate max-w-[220px]">
                  @{u.username}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "phone",
        header: "Điện thoại",
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground-muted">
            {row.original.user?.phone || "—"}
          </span>
        ),
      },
      {
        id: "roles",
        header: "Vai trò",
        cell: ({ row }) => {
          const roles = row.original.roles;
          if (!roles || roles.length === 0) {
            return <span className="text-foreground-muted">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {roles.map((r) => (
                <Badge key={r.id} variant="blue" className="font-mono">
                  {r.code}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const cfg = statusLabel[row.original.status] ?? {
            label: row.original.status,
            variant: "default" as const,
          };
          return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        },
      },
      {
        id: "lastLoginAt",
        header: "Đăng nhập cuối",
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground-muted text-xs">
            {row.original.user?.lastLoginAt
              ? new Date(row.original.user.lastLoginAt).toLocaleString("vi-VN")
              : "—"}
          </span>
        ),
      },
      {
        id: "joinedAt",
        header: "Ngày tham gia",
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground-muted text-xs">
            {row.original.joinedAt
              ? new Date(row.original.joinedAt).toLocaleDateString("vi-VN")
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Can I="UPDATE" a="USER">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Chỉnh sửa"
                onClick={() => setEditTarget(row.original)}
                title="Chỉnh sửa vai trò"
              >
                <Pencil size={14} />
              </Button>
              {row.original.status === "ACTIVE" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Vô hiệu hóa"
                  disabled={isDisabling}
                  onClick={() =>
                    patchMembership({ id: row.original.id, data: { status: "INACTIVE" } })
                  }
                  title="Vô hiệu hóa người dùng"
                  className="text-accent-red-text hover:text-accent-red-text"
                >
                  <UserX size={14} />
                </Button>
              )}
            </Can>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Hệ thống"
        title="Người dùng"
        description="Quản lý thành viên và vai trò trong tenant"
        actions={
          <Can I="CREATE" a="USER">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus size={16} />
              Thêm người dùng
            </Button>
          </Can>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-auto min-w-0"
        />
        <Select
          value={statusFilter}
          items={statusFilters}
          onValueChange={(value) =>
            setStatusFilter(value as GetApiMembershipsStatus)
          }
        >
          <SelectTrigger className="w-[180px]">
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-foreground-muted">
          <Loader2 size={20} className="mr-2 animate-spin" />
          Đang tải...
        </div>
      ) : memberships.length > 0 ? (
        <>
          <DataTable
            columns={columns}
            data={memberships}
            emptyMessage="Không tìm thấy người dùng"
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
          icon={<UserCog size={24} />}
          title="Chưa có người dùng"
          description="Thành viên trong tenant sẽ được hiển thị tại đây"
          action={
            <Can I="CREATE" a="USER">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <UserPlus size={16} />
                Thêm người dùng
              </Button>
            </Can>
          }
        />
      )}

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditUserDialog
        membership={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </div>
  );
}
