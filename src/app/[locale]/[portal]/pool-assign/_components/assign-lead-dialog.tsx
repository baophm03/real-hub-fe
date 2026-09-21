"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useGetApiTeams } from "@/lib/api/endpoints/teams";
import { usePostApiLeadAssign } from "@/lib/api/endpoints/leads";
import type { PoolLead } from "@/lib/api/types/pool";
import type { GetTeamsResponse } from "@/lib/api/types/teams";

type UserOption = { id: string; fullName: string; email: string; roles?: Array<{ code: string }> };

interface Props {
  lead: PoolLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

export function AssignLeadDialog({ lead, open, onOpenChange, onAssigned }: Props) {
  const [target, setTarget] = useState("");

  const { data: usersRaw } = useGetApiUsers({ limit: "200" });
  const salesOptions: UserOption[] = (
    (usersRaw as unknown as { data?: UserOption[] })?.data ?? []
  ).filter((u) => u && u.id && u.roles?.some((r) => r.code === "SALES" || r.code === "TEAM_LEADER"));

  const { data: teamsRaw } = useGetApiTeams({ limit: 100 });
  const teams = ((teamsRaw as unknown as GetTeamsResponse)?.data ?? []).filter(
    (t) => t.status === "ACTIVE",
  );

  const { mutateAsync: assignLead, isPending } = usePostApiLeadAssign();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !target) return;
    const [kind, id] = target.split(":");
    try {
      await assignLead({
        id: lead.id,
        data: kind === "team" ? { teamId: id } : { salesId: id },
      });
      toast.success("Đã phân bổ lead");
      setTarget("");
      onOpenChange(false);
      onAssigned();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Phân bổ thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phân bổ lead</DialogTitle>
            <DialogDescription>
              {lead?.leadCode} — gán cho sales hoặc team
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold tracking-wide text-foreground-muted">
                Người nhận / Nhóm <span className="text-accent-red-text">*</span>
              </label>
              <Select value={target} onValueChange={(v) => setTarget((v as string) ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn sales hoặc team" />
                </SelectTrigger>
                <SelectContent>
                  {salesOptions.map((u) => (
                    <SelectItem key={u.id} value={`sales:${u.id}`} label={u.fullName}>
                      {u.fullName} ({u.email})
                    </SelectItem>
                  ))}
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={`team:${t.id}`} label={t.name}>
                      Team: {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending || !target}>
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang phân bổ...
                  </>
                ) : (
                  "Phân bổ"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
