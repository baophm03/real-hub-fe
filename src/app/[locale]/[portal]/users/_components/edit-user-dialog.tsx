"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  usePutApiMembershipsId,
  getGetApiMembershipsQueryKey,
} from "@/lib/api/endpoints/memberships";
import { useGetApiRoles } from "@/lib/api/endpoints/roles";
import type { ReplaceMembershipDto } from "@/lib/api/models/replaceMembershipDto";

export interface MembershipUser {
  id: string;
  fullName: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  avatar?: { id: string; name: string; url: string } | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface MembershipRole {
  id: string;
  code: string;
  name: string;
}

export interface MembershipRow {
  id: string;
  tenantId?: string;
  status: string;
  joinedAt: string;
  invitedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  user: MembershipUser | null;
  roles: MembershipRole[];
}

interface RolesResponse {
  success: boolean;
  data: MembershipRole[];
  timestamp: string;
}

interface EditUserDialogProps {
  membership: MembershipRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ membership, open, onOpenChange }: EditUserDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync: putMembership, isPending } = usePutApiMembershipsId();

  const { data: rolesData } = useGetApiRoles();
  const roles: MembershipRole[] =
    (rolesData as unknown as RolesResponse)?.data ?? [];

  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  useEffect(() => {
    if (membership) {
      setSelectedRoleIds(new Set((membership.roles ?? []).map((r) => r.id)));
      setStatus((membership.status as "ACTIVE" | "INACTIVE") ?? "ACTIVE");
    }
  }, [membership]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!membership) return;
    try {
      const dto: ReplaceMembershipDto = {
        status,
        roleIds: Array.from(selectedRoleIds),
      };
      await putMembership({ id: membership.id, data: dto });
      await queryClient.invalidateQueries({
        queryKey: getGetApiMembershipsQueryKey(),
      });
      router.refresh();
      toast.success(
        `Đã cập nhật vai trò cho "${membership.user?.fullName ?? membership.id}"`,
      );
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message?.[0] ?? "Cập nhật thất bại";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={18} />
              Chỉnh sửa người dùng
            </DialogTitle>
            <DialogDescription>
              Thay đổi vai trò và trạng thái thành viên trong tenant.
            </DialogDescription>
          </DialogHeader>

          {membership?.user && (
            <div className="rounded-lg border border-border bg-surface-muted/40 p-3 text-sm">
              <p className="font-medium">{membership.user.fullName}</p>
              <p className="text-xs text-foreground-muted">{membership.user.email}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Vai trò</Label>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto -mx-1 px-1">
                {roles.map((r) => {
                  const checked = selectedRoleIds.has(r.id);
                  return (
                    <label
                      key={r.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-surface/50 px-3 py-2 text-sm hover:bg-surface-muted"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleRole(r.id)}
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <span className="font-medium">{r.name}</span>
                        <span className="font-mono text-xs text-foreground-muted">
                          ({r.code})
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-status">Trạng thái hoạt động</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus((value as "ACTIVE" | "INACTIVE") ?? "ACTIVE")}
                items={[
                  { value: "ACTIVE", label: "Hoạt động" },
                  { value: "INACTIVE", label: "Tắt" },
                ]}
              >
                <SelectTrigger id="edit-status" className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" label="Hoạt động">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE" label="Tắt">Tắt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Pencil size={14} />
                  Lưu
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
