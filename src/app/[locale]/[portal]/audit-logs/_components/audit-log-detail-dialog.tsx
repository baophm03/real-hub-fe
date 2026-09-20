"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  actionLabel,
  entityTypeLabel,
  getActionBadgeVariant,
  type AuditLog,
} from "./types";
import { formatDateTimeSeconds } from "@/utils";

interface Props {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AuditLogDetailDialog({ log, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết audit log</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về thao tác {log ? actionLabel[log.action] ?? log.action : ""} trên{" "}
              {log ? entityTypeLabel[log.entityType] ?? log.entityType : ""}
            </DialogDescription>
          </DialogHeader>

          {log && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wide text-foreground-muted">
                    Hành động
                  </span>
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {actionLabel[log.action] ?? log.action}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wide text-foreground-muted">
                    Đối tượng
                  </span>
                  <span className="text-sm">
                    {entityTypeLabel[log.entityType] ?? log.entityType}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wide text-foreground-muted">
                    Người thực hiện
                  </span>
                  <span className="text-sm">
                    {log.user?.fullName ?? "—"}
                    {log.user?.email ? (
                      <span className="ml-1 text-xs text-foreground-muted">({log.user.email})</span>
                    ) : null}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wide text-foreground-muted">
                    Thời gian
                  </span>
                  <span className="text-sm">{formatDateTimeSeconds(log.createdAt)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wide text-foreground-muted">
                    IP address
                  </span>
                  <span className="font-mono text-xs">{log.ipAddress ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wide text-foreground-muted">
                    Entity ID
                  </span>
                  <span className="font-mono text-xs text-foreground-muted">{log.entityId}</span>
                </div>
              </div>

              {log.userAgent && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-wide text-foreground-muted">
                    User agent
                  </span>
                  <span className="font-mono text-xs text-foreground-muted break-all">
                    {log.userAgent}
                  </span>
                </div>
              )}

              {log.beforeJson != null && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold tracking-wide text-foreground-muted">
                    Trước khi thay đổi (before)
                  </span>
                  <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-surface-muted p-3 font-mono text-xs">
                    {JSON.stringify(log.beforeJson, null, 2)}
                  </pre>
                </div>
              )}

              {log.afterJson != null && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold tracking-wide text-foreground-muted">
                    Sau khi thay đổi (after)
                  </span>
                  <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-surface-muted p-3 font-mono text-xs">
                    {JSON.stringify(log.afterJson, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
