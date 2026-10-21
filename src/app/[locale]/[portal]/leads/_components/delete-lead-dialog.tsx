"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDeleteApiLead,
  getGetApiLeadsAdminQueryKey,
} from "@/lib/api/endpoints/leads";

export interface LeadDeleteTarget {
  id: string;
  leadCode: string;
  customer?: {
    id: string;
    userId?: string | null;
    fullName?: string | null;
    phone?: string | null;
    user?: {
      id: string;
      fullName?: string | null;
      phone?: string | null;
      email?: string | null;
    } | null;
  } | null;
}

interface DeleteLeadDialogProps {
  lead: LeadDeleteTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch?: () => void;
}

export function DeleteLeadDialog({
  lead,
  open,
  onOpenChange,
  onRefetch,
}: DeleteLeadDialogProps) {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteLead, isPending } = useDeleteApiLead();
  const [deleting, setDeleting] = useState(false);
  const customerName = lead?.customer?.user?.fullName || lead?.customer?.fullName;

  const handleConfirm = async () => {
    if (!lead) return;
    setDeleting(true);
    try {
      await deleteLead({ id: lead.id });
      await queryClient.invalidateQueries({
        queryKey: getGetApiLeadsAdminQueryKey(),
      });
      toast.success(`Đã xóa "${lead.leadCode}"`);
      onOpenChange(false);
      onRefetch?.();
    } catch (err) {
      console.error(err);
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi xóa nguồn khách hàng");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa nguồn khách hàng</DialogTitle>
          <DialogDescription>
            {lead && (
              <span className="flex flex-col gap-1">
                <span>
                  Bạn có chắc muốn xóa{" "}
                  <strong className="text-foreground">
                    {lead.leadCode}
                  </strong>
                  {customerName ? (
                    <>
                      {" "}
                      (<strong className="text-foreground">{customerName}</strong>)
                    </>
                  ) : null}
                  ?
                </span>
                <span className="mt-2 text-xs text-foreground-muted">
                  Hành động này không thể hoàn tác. Nguồn khách hàng sẽ bị ẩn
                  (soft delete) và không hiển thị trên hệ thống.
                </span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending || deleting}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            loading={isPending || deleting}
          >
            <Trash2 size={14} />
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
