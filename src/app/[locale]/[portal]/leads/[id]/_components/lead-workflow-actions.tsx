"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, GitBranch, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetApiLeadTransitions,
  usePostApiLeadTransition,
} from "@/lib/api/endpoints/leads";

interface AvailableTransition {
  transitionId: string;
  actionCode: string;
  actionLabel: string;
  fromStateName: string;
  toStateName: string;
  fromColumnName: string;
  toColumnName: string;
  requireReason: boolean;
  requireAttachment: boolean;
}

export function LeadWorkflowActions({ leadId }: { leadId: string }) {
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState<AvailableTransition | null>(null);
  const [reason, setReason] = useState("");
  const [executing, setExecuting] = useState(false);

  const { data: transData, isLoading } = useGetApiLeadTransitions(leadId);
  const rawTrans = transData as any;
  const actions: AvailableTransition[] = rawTrans?.data ?? rawTrans ?? [];

  const { mutateAsync: executeTransition } = usePostApiLeadTransition({
    mutation: {
      onSuccess: () => {
        toast.success("Chuyển trạng thái thành công");
        queryClient.invalidateQueries();
        setSelectedAction(null);
        setReason("");
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || "Có lỗi khi chuyển trạng thái";
        toast.error(msg);
      },
    },
  });

  const handleExecute = async () => {
    if (!selectedAction) return;
    if (selectedAction.requireReason && !reason.trim()) {
      toast.error("Hành động này yêu cầu lý do");
      return;
    }
    setExecuting(true);
    try {
      await executeTransition({
        id: leadId,
        data: {
          transitionId: selectedAction.transitionId,
          reason: reason || undefined,
        },
      });
    } finally {
      setExecuting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Loader2 size={14} className="animate-spin" />
            Đang tải hành động...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch size={14} className="text-foreground-muted" />
          <h3 className="text-sm font-semibold">Hành động</h3>
          <Badge variant="default" className="text-[10px]">{actions.length}</Badge>
        </div>

        {actions.length === 0 ? (
          <p className="text-xs text-foreground-muted py-2">
            Không có hành động nào khả dụng từ trạng thái hiện tại.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {actions.map((a) => (
              <button
                key={a.transitionId}
                onClick={() => {
                  setSelectedAction(a);
                  setReason("");
                }}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-foreground/20 hover:bg-surface-muted/50"
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{a.actionLabel}</span>
                  <span className="text-[10px] text-foreground-muted truncate">
                    {a.fromStateName} → {a.toStateName}
                    {a.fromColumnName !== a.toColumnName && (
                      <span className="ml-1">({a.toColumnName})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {a.requireReason && (
                    <Badge variant="yellow" className="text-[9px]">Lý do</Badge>
                  )}
                  {a.requireAttachment && (
                    <Badge variant="yellow" className="text-[9px]">Tệp</Badge>
                  )}
                  <ArrowRight size={12} className="text-foreground-muted" />
                </div>
              </button>
            ))}
          </div>
        )}

        <Dialog open={!!selectedAction} onOpenChange={(open) => !open && setSelectedAction(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedAction?.actionLabel}</DialogTitle>
              <DialogDescription>
                Bạn có chắc muốn thực hiện hành động này? Trạng thái sẽ chuyển từ{" "}
                <span className="font-medium text-foreground">
                  {selectedAction?.fromStateName}
                </span>{" "}
                sang{" "}
                <span className="font-medium text-foreground">
                  {selectedAction?.toStateName}
                </span>
                {selectedAction && selectedAction.fromColumnName !== selectedAction.toColumnName && (
                  <>
                    {" "}trên cột{" "}
                    <span className="font-medium text-foreground">
                      {selectedAction.toColumnName}
                    </span>
                  </>
                )}
                .
              </DialogDescription>
            </DialogHeader>

            {selectedAction?.requireReason && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground-muted">
                  Lý do <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do chuyển trạng thái..."
                  rows={3}
                />
              </div>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
              <Button onClick={handleExecute} disabled={executing}>
                {executing ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
