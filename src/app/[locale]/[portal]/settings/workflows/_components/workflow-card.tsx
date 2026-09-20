"use client";

import { Eye, GitBranch, Layers, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetApiWorkflowEntityStatusFields } from "@/lib/api/endpoints/workflow";
import { entityTypeConfig, statusConfig, type WorkflowDefinition } from "./types";
import { formatDate } from "@/utils";

interface StatusFieldValue {
  code: string;
  label: string;
  color?: string;
}

interface StatusField {
  fieldKey: string;
  label: string;
  values: StatusFieldValue[];
}

export function WorkflowCard({
  workflow,
  onView,
  onEdit,
  onDelete,
}: {
  workflow: WorkflowDefinition;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: statusFieldsData } = useGetApiWorkflowEntityStatusFields(
    { entityType: workflow.entityType as any },
    { query: { enabled: !!workflow.entityType } },
  );
  const raw = statusFieldsData as any;
  const statusFields: StatusField[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  // Build label lookup: { fieldKey → { code → label } }
  const valueLabelMap = new Map<string, Map<string, string>>();
  for (const sf of statusFields) {
    const inner = new Map<string, string>();
    for (const v of sf.values) inner.set(v.code, v.label);
    valueLabelMap.set(sf.fieldKey, inner);
  }
  const getStateLabel = (col: string, name: string) =>
    valueLabelMap.get(col)?.get(name) ?? name;

  const status = statusConfig[workflow.status] ?? statusConfig.ACTIVE;
  const entityCfg = entityTypeConfig[workflow.entityType];
  const stateCount = workflow.states?.length ?? 0;
  const transitionCount = workflow.transitions?.length ?? 0;
  const initialState = workflow.states?.find((s) => s.isInitial);
  const sortedStates = workflow.states?.slice().sort((a, b) => a.sortOrder - b.sortOrder) ?? [];

  return (
    <Card className="py-0">
      <CardContent className="p-4">
        {/* Row 1: name + entity + status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-sm truncate">{workflow.name}</h3>
            <Badge variant="default" className="shrink-0 text-[10px]">v{workflow.version}</Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-foreground-muted">{entityCfg?.label ?? workflow.entityType}</span>
            <Badge variant={status.variant} className="text-[10px]">
              <status.icon className="size-2.5" />
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Row 2: state flow preview (single line, truncate) */}
        {stateCount > 0 && (
          <div className="mt-2.5 flex items-center gap-1 overflow-hidden">
            {sortedStates.slice(0, 6).map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ArrowRight size={9} className="text-foreground-muted" />}
                <span
                  className="inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0 text-[10px] font-medium"
                  style={s.color ? { borderLeftWidth: 2, borderLeftColor: s.color } : undefined}
                >
                  {s.isInitial && <span className="text-[7px] text-foreground-muted">●</span>}
                  {getStateLabel(s.columnName, s.stateName)}
                  {s.isFinal && <span className="text-[7px] text-foreground-muted">■</span>}
                </span>
              </div>
            ))}
            {stateCount > 6 && (
              <span className="text-[10px] text-foreground-muted shrink-0">+{stateCount - 6}</span>
            )}
          </div>
        )}

        {/* Row 3: stats + actions */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <Layers size={11} />
              {stateCount} trạng thái
            </span>
            <span className="flex items-center gap-1">
              <GitBranch size={11} />
              {transitionCount} chuyển
            </span>
            {initialState && (
              <span className="hidden sm:inline">
                Bắt đầu: <span className="font-medium text-foreground">{getStateLabel(initialState.columnName, initialState.stateName)}</span>
              </span>
            )}
            <span className="text-foreground-muted/60">{formatDate(workflow.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="ghost" onClick={onEdit} title="Chỉnh sửa" className="h-7 px-2">
              <Pencil size={13} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              title="Xóa"
              className="h-7 px-2 text-foreground-muted hover:text-destructive"
            >
              <Trash2 size={13} />
            </Button>
            <Button size="sm" variant="outline" onClick={onView} className="h-7">
              <Eye size={13} />
              Chi tiết
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
