"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { taskStatusLabel, taskStatusVariant, taskResultLabel, type RevalidationTask } from "./types";

interface Props {
  tasks: RevalidationTask[];
  isLoading: boolean;
  canUpdate: boolean;
  isCompleting: boolean;
  onComplete: (t: RevalidationTask) => void;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

export function TasksList({ tasks, isLoading, canUpdate, isCompleting, onComplete }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {t.property?.title ?? t.property?.propertyCode ?? "—"}
            </p>
            <p className="text-xs text-foreground-muted">
              {t.property?.propertyCode} · Hạn: {formatDate(t.dueAt)}
              {t.assignee ? ` · ${t.assignee.fullName}` : ""}
              {t.result ? ` · ${taskResultLabel[t.result] ?? t.result}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={taskStatusVariant[t.status] ?? "default"}>
              {taskStatusLabel[t.status] ?? t.status}
            </Badge>
            {canUpdate && (t.status === "PENDING" || t.status === "IN_PROGRESS") && (
              <Button
                variant="outline"
                size="sm"
                disabled={isCompleting}
                onClick={() => onComplete(t)}
              >
                <CheckCircle2 size={14} />
                Hoàn thành
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
