"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ability } from "@/config/casl/ability";
import {
  useGetApiTeams,
  usePostApiTeams,
  usePatchApiTeam,
  useDeleteApiTeam,
  getGetApiTeamsQueryKey,
} from "@/lib/api/endpoints/teams";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { usePagination } from "@/lib/hooks/use-pagination";
import type { TeamView, GetTeamsResponse } from "@/lib/api/types/teams";
import { formatDate } from "@/utils";
import type { TeamFormValues } from "./_components/types";
import { TeamFormDialog } from "./_components/team-form-dialog";
import { DeleteTeamDialog } from "./_components/delete-team-dialog";

export default function TeamsSettingsPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const canCreate = ability.can("CREATE", "TEAM");
  const canUpdate = ability.can("UPDATE", "TEAM");
  const canDelete = ability.can("DELETE", "TEAM");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamView | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamView | null>(null);

  const pagination = usePagination(10);
  const { data: raw, isLoading } = useGetApiTeams({
    limit: Number(pagination.limit),
    offset: Number(pagination.offset),
  });
  const response = raw as unknown as GetTeamsResponse | undefined;
  const teams: TeamView[] = response?.data ?? [];
  const meta = response?.meta;
  const totalPages =
    meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? 0) / pagination.pageSize));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetApiTeamsQueryKey() });

  const { mutateAsync: createTeam, isPending: isCreating } = usePostApiTeams({
    mutation: {
      onSuccess: () => {
        toast.success("Tạo team thành công");
        invalidate();
        setCreateOpen(false);
      },
      onError: (e: any) =>
        toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi tạo team"),
    },
  });

  const { mutateAsync: updateTeam, isPending: isUpdating } = usePatchApiTeam({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật team thành công");
        invalidate();
        setEditTarget(null);
      },
      onError: (e: any) => toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi cập nhật"),
    },
  });

  const { mutateAsync: deleteTeam, isPending: isDeleting } = useDeleteApiTeam({
    mutation: {
      onSuccess: () => {
        toast.success("Đã xóa team");
        invalidate();
        setDeleteTarget(null);
      },
      onError: (e: any) => toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi xóa"),
    },
  });

  const columns: ColumnDef<TeamView>[] = [
    {
      accessorKey: "name",
      header: "Tên team",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users size={14} className="text-foreground-muted" />
          <span className="text-sm font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "manager",
      header: "Trưởng nhóm",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.leader?.fullName ?? "—"}
        </span>
      ),
    },
    {
      id: "memberCount",
      header: "Thành viên",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.members.length}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "ACTIVE" ? "green" : "default"}>
          {row.original.status === "ACTIVE" ? "Active" : row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => (
        <span className="text-xs text-foreground-muted">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    ...(canUpdate || canDelete
      ? [
        {
          id: "actions",
          header: "",
          size: 140,
          cell: ({ row }: { row: { original: TeamView } }) => (
            <div
              className="flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTarget(row.original)}
                >
                  <Pencil size={12} />
                  Sửa
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  <Trash2 size={12} />
                </Button>
              )}
            </div>
          ),
        } satisfies ColumnDef<TeamView>,
      ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cài đặt"
        title="Nhóm"
        description="Tổ chức sales theo team. Trưởng nhóm thấy lead/deal/customer của thành viên trong team mình quản lý."
        actions={
          canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Tạo team
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-surface-muted" />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Chưa có team nào"
          description="Tạo team để phân nhóm sales. Trưởng nhóm sẽ thấy được lead, deal và khách hàng của thành viên trong team."
          action={
            canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Tạo team
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={teams}
            onRowClick={(row) => router.push(portalPath(`/teams/${row.id}`))}
            emptyMessage="Không tìm thấy team"
          />
          <PaginationBar
            pageSize={pagination.pageSize}
            setPageSize={pagination.setPageSize}
            currentPage={pagination.currentPage}
            setCurrentPage={pagination.setCurrentPage}
            totalPages={totalPages}
          />
        </>
      )}

      <TeamFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Tạo team"
        submitLabel="Tạo"
        isSubmitting={isCreating}
        initial={null}
        onSubmit={async (v: TeamFormValues) => {
          await createTeam({
            data: {
              name: v.name,
              leaderId: v.leaderId,
              memberIds: v.memberIds,
            },
          });
        }}
      />

      <TeamFormDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        title="Cập nhật team"
        submitLabel="Lưu"
        isSubmitting={isUpdating}
        initial={
          editTarget
            ? { name: editTarget.name, leaderId: editTarget.leaderId }
            : null
        }
        onSubmit={async (v: TeamFormValues) => {
          if (!editTarget) return;
          await updateTeam({
            id: editTarget.id,
            data: {
              name: v.name,
              leaderId: v.leaderId,
            },
          });
        }}
      />

      <DeleteTeamDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        teamName={deleteTarget?.name ?? ""}
        isSubmitting={isDeleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteTeam({ id: deleteTarget.id });
        }}
      />
    </div>
  );
}
