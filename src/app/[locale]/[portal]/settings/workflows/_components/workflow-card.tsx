"use client";

import { Archive, CheckCircle2, CircleDashed, Eye, GitBranch, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { entityTypeConfig, statusConfig, type WorkflowDefinition } from "./types";
import { formatDate } from "@/utils";

const statusActions = [
  { value: "ACTIVE", label: "Áp dụng", icon: CheckCircle2 },
  { value: "DRAFT", label: "Nháp", icon: CircleDashed },
  { value: "ARCHIVED", label: "Lưu trữ", icon: Archive },
];

export function WorkflowCard({
  workflow,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  workflow: WorkflowDefinition;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: (status: string) => void;
}) {
  const status = statusConfig[workflow.status] ?? statusConfig.ACTIVE;
  const entityCfg = entityTypeConfig[workflow.entityType];
  const stateCount = workflow.stateCount ?? 0;
  const transitionCount = workflow.transitionCount ?? 0;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border bg-surface-muted/40 py-(--card-spacing)">
        <CardTitle className="flex items-center gap-2">
          <GitBranch size={14} className="text-foreground-muted shrink-0" />
          <span className="truncate">{workflow.name}</span>
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          {entityCfg?.label ?? workflow.entityType}
          <Badge variant={status.variant} className="text-[10px]">
            <status.icon className="size-2.5" />
            {status.label}
          </Badge>
        </CardDescription>
        <CardAction>
          <Badge variant="default" className="text-[10px]">v{workflow.version}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-foreground-muted">Trạng thái</p>
            <p className="font-medium tabular-nums">{stateCount}</p>
          </div>
          <div>
            <p className="text-foreground-muted">Chuyển trạng thái</p>
            <p className="font-medium tabular-nums">{transitionCount}</p>
          </div>
          <div className="col-span-2">
            <p className="text-foreground-muted">Cập nhật</p>
            <p className="font-medium">{formatDate(workflow.updatedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye size={12} />
            Chi tiết
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil size={12} />
            Sửa
          </Button>
          {onStatusChange && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Đổi trạng thái" />
                }
              >
                <MoreVertical size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {statusActions
                  .filter((a) => a.value !== workflow.status)
                  .map((a) => (
                    <DropdownMenuItem key={a.value} onClick={() => onStatusChange(a.value)}>
                      <a.icon size={14} />
                      {a.label}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-destructive"
            onClick={onDelete}
          >
            <Trash2 size={12} />
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
