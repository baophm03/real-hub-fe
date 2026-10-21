"use client";

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

interface DeleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: {
    leadCode: string;
    customer?: {
      fullName?: string | null;
      user?: { id: string; fullName?: string | null } | null;
    } | null;
  } | null;
  isDeleting?: boolean;
  onConfirm: () => void;
}

export function DeleteLeadDialog({
  open,
  onOpenChange,
  lead,
  isDeleting,
  onConfirm,
}: DeleteLeadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa nguồn khách hàng</DialogTitle>
            <DialogDescription>
              Hành động này sẽ ẩn nguồn khách hàng (soft delete). Bạn có chắc chắn?
            </DialogDescription>
          </DialogHeader>
          {lead && (
            <div className="rounded-lg border border-border bg-surface-muted/40 p-4 text-sm">
              <p className="font-medium">{lead.leadCode}</p>
              {(lead.customer?.user?.fullName || lead.customer?.fullName) && (
                <p className="text-foreground-muted">
                  {lead.customer?.user?.fullName || lead.customer?.fullName}
                </p>
              )}
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button variant="destructive" disabled={isDeleting} onClick={onConfirm}>
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
