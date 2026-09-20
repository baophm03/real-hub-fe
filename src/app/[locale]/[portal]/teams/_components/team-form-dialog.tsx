"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useGetApiUsers } from "@/lib/api/endpoints/users";
import type { TeamFormValues } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  submitLabel: string;
  isSubmitting: boolean;
  initial: { name: string; leaderId: string } | null;
  onSubmit: (v: TeamFormValues) => Promise<void>;
}

export function TeamFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  isSubmitting,
  initial,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  // Reset state mỗi lần mở dialog
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setLeaderId(initial?.leaderId ?? "");
      setMemberIds(initial ? [] : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: usersRaw } = useGetApiUsers({ limit: "200" });
  type UserOption = { id: string; fullName: string; email: string; roles?: Array<{ code: string }> };
  const users: UserOption[] =
    ((usersRaw as unknown as { data?: UserOption[] })?.data ?? [])
      .filter((u) => u && u.id);
  const hasRole = (u: UserOption, code: string) => u.roles?.some((r) => r.code === code);

  const toggleMember = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId) ? memberIds.filter((id) => id !== userId) : [...memberIds, userId],
    );
  };

  const close = () => onOpenChange(false);

  const leaderOptions = users.filter((u) => hasRole(u, "TEAM_LEADER"));
  const selectableMembers = users.filter(
    (u) => u.id !== leaderId && hasRole(u, "SALES"),
  );

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onOpenChange(false) : onOpenChange(o))}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Team giúp phân nhóm sales: trưởng nhóm thấy lead/deal của thành viên trong team.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim()) {
                toast.error("Vui lòng nhập tên team");
                return;
              }
              if (!leaderId) {
                toast.error("Vui lòng chọn trưởng nhóm");
                return;
              }
              await onSubmit({
                name: name.trim(),
                leaderId,
                memberIds,
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-foreground-muted">
                Tên team <span className="text-accent-red-text">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Team Kinh doanh 1"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-foreground-muted">
                Trưởng nhóm <span className="text-accent-red-text">*</span>
              </label>
              <Select
                value={leaderId}
                onValueChange={(v) => {
                  const next = (v as string) ?? "";
                  setLeaderId(next);
                  if (next) setMemberIds((prev) => prev.filter((id) => id !== next));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trưởng nhóm">
                    {(value: string) =>
                      users.find((u) => u.id === value)?.fullName ?? "— Chưa chọn —"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {leaderOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id} label={u.fullName}>
                      {u.fullName} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-foreground-muted">
                Thành viên
              </label>
              <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                {selectableMembers.length === 0 ? (
                  <p className="p-3 text-xs text-foreground-muted">Không có user nào</p>
                ) : (
                  selectableMembers.map((u) => {
                    const checked = memberIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex cursor-pointer items-center gap-2.5 border-b border-border px-3 py-2 text-sm last:border-b-0 hover:bg-surface-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleMember(u.id)}
                        />
                        <span className="flex-1">{u.fullName}</span>
                        <span className="text-xs text-foreground-muted">{u.email}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
