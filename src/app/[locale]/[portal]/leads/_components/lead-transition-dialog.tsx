"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export interface LeadTransition {
  transitionId: string;
  actionCode: string;
  actionLabel: string;
  toStateName: string;
  toColumnName: string;
  requireReason: boolean;
  requireAttachment: boolean;
}

interface LeadTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transition?: LeadTransition;
  executing?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
}

export function LeadTransitionDialog({
  open,
  onOpenChange,
  transition,
  executing,
  onConfirm,
}: LeadTransitionDialogProps) {
  const [reason, setReason] = useState("");

  const handleOpenChange = (o: boolean) => {
    if (!o) setReason("");
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transition?.actionLabel}</DialogTitle>
          <DialogDescription>
            Hành động này yêu cầu nhập lý do trước khi chuyển sang{" "}
            <span className="font-medium text-foreground">"{transition?.toStateName}"</span>.
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
          <Button
            disabled={executing || !reason.trim()}
            onClick={() => onConfirm(reason)}
          >
            {executing ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
