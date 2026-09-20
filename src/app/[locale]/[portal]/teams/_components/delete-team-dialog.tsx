"use client";

import { Loader2, Trash2 } from "lucide-react";
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

interface Props {
  teamName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
}

export function DeleteTeamDialog({
  teamName,
  open,
  onOpenChange,
  isSubmitting,
  onConfirm,
}: {
  teamName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onOpenChange(false) : onOpenChange(o))}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa team</DialogTitle>
            <DialogDescription>
              Bạn chắc chắn muốn xóa team &quot;{teamName}&quot;? Thành viên sẽ bị gỡ khỏi team.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await onConfirm();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Xóa team
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
