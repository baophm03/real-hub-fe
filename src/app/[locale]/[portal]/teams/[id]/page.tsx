"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ability } from "@/config/casl/ability";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { useGetApiUsers } from "@/lib/api/endpoints/users";
import {
  useGetApiTeam,
  usePatchApiTeam,
  useDeleteApiTeam,
  usePostApiTeamMember,
  useDeleteApiTeamMember,
  getGetApiTeamsQueryKey,
  getGetApiTeamQueryKey,
} from "@/lib/api/endpoints/teams";
import type { TeamView, GetTeamResponse } from "@/lib/api/types/teams";
import { formatDate } from "@/utils";
import { type TeamFormValues } from "../_components/types";
import { MemberDetailPanel } from "./_components/member-detail-panel";
import { TeamFormDialog } from "../_components/team-form-dialog";
import { DeleteTeamDialog } from "../_components/delete-team-dialog";

type MemberRow = TeamView["members"][number];

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();

  const canUpdate = ability.can("UPDATE", "TEAM");
  const canDelete = ability.can("DELETE", "TEAM");
  const canManage = ability.can("MANAGE_MEMBERS", "TEAM");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMemberId, setNewMemberId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: raw, isLoading } = useGetApiTeam(teamId);
  const team = (raw as unknown as GetTeamResponse | undefined)?.data;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetApiTeamsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetApiTeamQueryKey(teamId) });
  };

  const { data: usersRaw } = useGetApiUsers({ limit: "200" });
  type UserOption = { id: string; fullName: string; email: string; roles?: Array<{ code: string }> };
  const allUsers: UserOption[] =
    (usersRaw as unknown as { data?: UserOption[] })?.data ?? [];
  const memberIds = new Set((team?.members ?? []).map((m) => m.userId));
  const addableUsers = allUsers.filter(
    (u) =>
      u && u.id &&
      !memberIds.has(u.id) &&
      u.id !== team?.leaderId &&
      u.roles?.some((r) => r.code === "SALES"),
  );

  const { mutateAsync: updateTeam, isPending: isUpdating } = usePatchApiTeam({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật team thành công");
        invalidate();
        setEditOpen(false);
      },
      onError: (e: any) => toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi cập nhật"),
    },
  });

  const { mutateAsync: deleteTeam, isPending: isDeleting } = useDeleteApiTeam({
    mutation: {
      onSuccess: () => {
        toast.success("Đã xóa team");
        queryClient.invalidateQueries({ queryKey: getGetApiTeamsQueryKey() });
        router.push(portalPath("/teams"));
      },
      onError: (e: any) => toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi xóa"),
    },
  });

  const { mutateAsync: addMember, isPending: isAdding } = usePostApiTeamMember({
    mutation: {
      onSuccess: () => {
        toast.success("Đã thêm thành viên");
        setNewMemberId("");
        invalidate();
      },
      onError: (e: any) =>
        toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi thêm thành viên"),
    },
  });

  const { mutateAsync: removeMember, isPending: isRemoving } = useDeleteApiTeamMember({
    mutation: {
      onSuccess: (_d, vars) => {
        toast.success("Đã xóa thành viên");
        if (selectedUserId === vars.userId) setSelectedUserId(null);
        invalidate();
      },
      onError: (e: any) =>
        toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi xóa thành viên"),
    },
  });

  const memberColumns: ColumnDef<MemberRow>[] = [
    {
      accessorKey: "user",
      header: "Thành viên",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.original.user?.fullName ?? row.original.userId}
          </span>
          {row.original.user?.email && (
            <span className="text-xs text-foreground-muted">{row.original.user.email}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày vào team",
      cell: ({ row }) => (
        <span className="text-xs text-foreground-muted">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    ...(canManage
      ? [
        {
          id: "actions",
          header: "",
          size: 50,
          cell: ({ row }: { row: { original: MemberRow } }) => (
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={isRemoving}
                onClick={() =>
                  removeMember({ id: teamId, userId: row.original.userId })
                }
              >
                <UserMinus size={14} />
              </Button>
            </div>
          ),
        } satisfies ColumnDef<MemberRow>,
      ]
      : []),
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-10 w-64 animate-pulse rounded bg-surface-muted" />
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="h-80 animate-pulse rounded-lg bg-surface-muted" />
          <div className="h-80 animate-pulse rounded-lg bg-surface-muted" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-foreground-muted">Không tìm thấy team hoặc bạn không có quyền xem.</p>
        <Button variant="outline" onClick={() => router.push(portalPath("/teams"))}>
          <ArrowLeft size={14} />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Nhóm"
        title={team.name}
        description={
          team.leader
            ? `Trưởng nhóm: ${team.leader.fullName} · ${team.members.length} thành viên · Tạo ngày ${formatDate(team.createdAt)}`
            : `${team.members.length} thành viên · Tạo ngày ${formatDate(team.createdAt)}`
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(portalPath("/teams"))}>
              <ArrowLeft size={14} />
              Quay lại
            </Button>
            {canUpdate && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil size={14} />
                Sửa
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={14} />
                Xóa
              </Button>
            )}
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
        {/* Trái: thông tin team + members */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-foreground-muted" />
              <h2 className="text-sm font-semibold">Thành viên</h2>
              <Badge variant={team.status === "ACTIVE" ? "green" : "default"}>
                {team.status === "ACTIVE" ? "Active" : team.status}
              </Badge>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <Select
                  value={newMemberId}
                  onValueChange={(v) => setNewMemberId((v as string) ?? "")}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Chọn user thêm vào team">
                      {(value: string) =>
                        allUsers.find((u) => u.id === value)?.fullName ?? "Chọn user thêm vào team"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {addableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id} label={u.fullName}>
                        {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!newMemberId || isAdding}
                  onClick={() => addMember({ id: teamId, data: { userId: newMemberId } })}
                >
                  {isAdding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Thêm
                </Button>
              </div>
            )}
          </div>

          <DataTable
            columns={memberColumns}
            data={team.members}
            onRowClick={(row) => setSelectedUserId(row.userId)}
            emptyMessage="Chưa có thành viên nào"
          />
        </div>

        {/* Phải: chi tiết member được chọn */}
        <MemberDetailPanel teamId={teamId} userId={selectedUserId} />
      </div>

      <TeamFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Cập nhật team"
        submitLabel="Lưu"
        isSubmitting={isUpdating}
        initial={{ name: team.name, leaderId: team.leaderId }}
        onSubmit={async (v: TeamFormValues) => {
          await updateTeam({
            id: teamId,
            data: { name: v.name, leaderId: v.leaderId },
          });
        }}
      />

      <DeleteTeamDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        teamName={team.name}
        isSubmitting={isDeleting}
        onConfirm={async () => {
          await deleteTeam({ id: teamId });
        }}
      />
    </div>
  );
}
