"use client";

import { toast } from "sonner";
import { Can } from "@casl/react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  usePatchApiContactRequestsId,
  useDeleteApiContactRequestsId,
  getGetApiContactRequestsQueryKey,
} from "@/lib/api/endpoints/contact-requests";
import {
  statusConfig,
  User,
  Mail,
  Phone,
  MessageCircle,
  type ContactRequest,
} from "./types";
import { formatDateTime } from "@/utils";

interface Props {
  request: ContactRequest | null;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (req: ContactRequest) => void;
  onDeleted?: (id: string) => void;
}

export function ContactRequestDetailDialog({
  request,
  onOpenChange,
  onUpdated,
  onDeleted,
}: Props) {
  const queryClient = useQueryClient();
  const { mutateAsync: updateRequest, isPending: isUpdating } = usePatchApiContactRequestsId();
  const { mutateAsync: deleteRequest, isPending: isDeleting } = useDeleteApiContactRequestsId();

  const handleStatusChange = async (id: string, status: ContactRequest["status"]) => {
    try {
      await updateRequest({ id, data: { status } });
      await queryClient.invalidateQueries({
        queryKey: getGetApiContactRequestsQueryKey(),
      });
      toast.success(`Đã cập nhật: ${statusConfig[status].label}`);
      onUpdated?.({ ...request!, status });
    } catch (err) {
      toast.error(
        (err as any)?.response?.data?.error?.message?.[0] || "Cập nhật trạng thái thất bại",
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRequest({ id });
      await queryClient.invalidateQueries({
        queryKey: getGetApiContactRequestsQueryKey(),
      });
      toast.success("Đã lưu trữ yêu cầu");
      onDeleted?.(id);
      onOpenChange(false);
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Lưu trữ thất bại");
    }
  };

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu liên hệ</DialogTitle>
            <DialogDescription>Thông tin khách hàng liên hệ qua form trang Contact</DialogDescription>
          </DialogHeader>

          {request && (
            <div className="flex flex-col gap-5">
              {/* Status + date */}
              <div className="flex items-center justify-between">
                <Badge variant={statusConfig[request.status]?.variant ?? "default"}>
                  {statusConfig[request.status]?.label ?? request.status}
                </Badge>
                <span className="text-xs tabular-nums text-foreground-muted">
                  {formatDateTime(request.createdAt)}
                </span>
              </div>

              {/* Customer info */}
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted/40 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  <User size={14} />
                  Khách liên hệ
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">{request.fullName}</span>
                  <div className="flex items-center gap-2 text-sm text-foreground-muted">
                    <Phone size={14} />
                    <span className="tabular-nums">{request.phone}</span>
                  </div>
                  {request.email && (
                    <div className="flex items-center gap-2 text-sm text-foreground-muted">
                      <Mail size={14} />
                      <span>{request.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject */}
              {request.subject && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    Chủ đề
                  </span>
                  <p className="text-sm font-medium rounded-lg border border-border bg-surface-muted/40 p-3">
                    {request.subject}
                  </p>
                </div>
              )}

              {/* Message */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  <MessageCircle size={14} />
                  Nội dung
                </div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap rounded-lg border border-border bg-surface-muted/40 p-4">
                  {request.message || "—"}
                </p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <Calendar size={14} />
                <span>
                  Cập nhật lúc:{" "}
                  <span className="tabular-nums">{formatDateTime(request.updatedAt)}</span>
                </span>
              </div>

              {/* Status actions */}
              <Can I="UPDATE_OWN" a="CONTACT_REQUEST">
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <span className="text-xs font-medium text-foreground-muted mr-auto">
                    Cập nhật trạng thái:
                  </span>
                  <Button
                    variant={request.status === "UNREAD" ? "default" : "outline"}
                    size="sm"
                    disabled={isUpdating || request.status === "UNREAD"}
                    onClick={() => handleStatusChange(request.id, "UNREAD")}
                  >
                    Chưa đọc
                  </Button>
                  <Button
                    variant={request.status === "READ" ? "default" : "outline"}
                    size="sm"
                    disabled={isUpdating || request.status === "READ"}
                    onClick={() => handleStatusChange(request.id, "READ")}
                    leftIcon={<Check size={14} />}
                  >
                    Đã đọc
                  </Button>
                  <Button
                    variant={request.status === "REPLIED" ? "default" : "outline"}
                    size="sm"
                    disabled={isUpdating || request.status === "REPLIED"}
                    onClick={() => handleStatusChange(request.id, "REPLIED")}
                    leftIcon={<CheckCheck size={14} />}
                  >
                    Đã phản hồi
                  </Button>
                </div>
              </Can>
              <Can I="DELETE_OWN" a="CONTACT_REQUEST">
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDeleting || request.status === "ARCHIVED"}
                    onClick={() => handleDelete(request.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 size={14} />
                    Lưu trữ
                  </Button>
                </div>
              </Can>
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
