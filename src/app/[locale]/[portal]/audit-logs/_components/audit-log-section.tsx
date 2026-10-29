"use client";

import { useState } from "react";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetApiAuditLogs } from "@/lib/api/endpoints/audit-logs";
import {
  actionLabel,
  entityTypeLabel,
  getActionBadgeVariant,
  type AuditLog,
  type AuditLogsResponse,
} from "./types";
import { AuditLogDetailDialog } from "./audit-log-detail-dialog";
import { formatDateTimeSeconds } from "@/utils";

interface Props {
  entityType: "news" | "project" | "property";
  entityId: string;
}

export function AuditLogSection({ entityType, entityId }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const { data: raw, isLoading } = useGetApiAuditLogs({
    entityType,
    entityId,
    page: String(page),
    pageSize: String(pageSize),
  });

  const res = raw as unknown as AuditLogsResponse | undefined;
  const logs: AuditLog[] = res?.data ?? [];
  const totalPages = res?.meta?.totalPages ?? 1;
  const total = res?.meta?.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <ScrollText size={16} className="text-foreground-muted" />
        <h2 className="font-serif text-xl font-semibold">Lịch sử thay đổi</h2>
        {total > 0 && (
          <span className="ml-auto text-xs text-foreground-muted">
            {total} thay đổi
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="py-6 text-center text-sm text-foreground-muted">
          Chưa có lịch sử thay đổi nào.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <button
                key={log.id}
                onClick={() => setDetailLog(log)}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-primary hover:bg-surface-muted"
              >
                <Badge variant={getActionBadgeVariant(log.action)} className="shrink-0">
                  {actionLabel[log.action] ?? log.action}
                </Badge>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {log.user?.fullName ?? "Hệ thống"}
                  </span>
                  {log.user?.email && (
                    <span className="truncate text-xs text-foreground-muted">
                      {log.user.email}
                    </span>
                  )}
                </div>
                <span className="ml-auto shrink-0 text-xs text-foreground-muted">
                  {formatDateTimeSeconds(log.createdAt)}
                </span>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-foreground-muted">
                Trang {page} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AuditLogDetailDialog
        log={detailLog}
        open={!!detailLog}
        onOpenChange={(o) => !o && setDetailLog(null)}
      />
    </div>
  );
}
