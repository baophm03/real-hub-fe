"use client";

import { ArrowRight, Flag, PlayCircle, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useGetApiWorkflowEntityStatusFields,
  useGetApiWorkflowIdStates,
  useGetApiWorkflowIdTransitions,
} from "@/lib/api/endpoints/workflow";
import { useGetApiRoles } from "@/lib/api/endpoints/roles";
import {
  entityTypeConfig,
  roleLabel,
  statusConfig,
  type WorkflowDefinition,
  type WorkflowState,
  type WorkflowTransition,
} from "./types";

interface StatusField {
  fieldKey: string;
  label: string;
}

interface RoleItem {
  id: string;
  code: string;
  name: string;
  status?: string;
}

export function WorkflowDetailDialog({
  workflow,
  open,
  onOpenChange,
}: {
  workflow: WorkflowDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: statusFieldsData } = useGetApiWorkflowEntityStatusFields(
    { entityType: (workflow?.entityType ?? "PROPERTY") as any },
    { query: { enabled: !!workflow } },
  );
  const raw = statusFieldsData as any;
  const statusFields: StatusField[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  // Lazy-load states + transitions only when dialog opens
  const { data: statesRaw, isLoading: loadingStates } = useGetApiWorkflowIdStates(
    workflow?.id ?? "",
    { query: { enabled: open && !!workflow } },
  );
  const { data: transitionsRaw, isLoading: loadingTransitions } = useGetApiWorkflowIdTransitions(
    workflow?.id ?? "",
    { query: { enabled: open && !!workflow } },
  );
  const states: WorkflowState[] = Array.isArray(statesRaw)
    ? statesRaw
    : ((statesRaw as any)?.data ?? []);
  const transitions: WorkflowTransition[] = Array.isArray(transitionsRaw)
    ? transitionsRaw
    : ((transitionsRaw as any)?.data ?? []);

  // Fetch tenant roles for label lookup
  const { data: rolesRaw } = useGetApiRoles(undefined, {
    query: { enabled: !!workflow },
  });
  const rolesData = (rolesRaw as any)?.data ?? (Array.isArray(rolesRaw) ? rolesRaw : []);
  for (const r of rolesData as RoleItem[]) {
    if (r?.code) roleLabel[r.code] = r.name || r.code;
  }

  // Build column label lookup (state values are free-form codes, shown as-is)
  const fieldLabelMap = new Map<string, string>();
  for (const sf of statusFields) {
    fieldLabelMap.set(sf.fieldKey, sf.label);
  }
  const getColumnLabel = (col: string) =>
    fieldLabelMap.get(col) ?? col;

  if (!workflow) return null;

  const status = statusConfig[workflow.status] ?? statusConfig.ACTIVE;
  const entityCfg = entityTypeConfig[workflow.entityType];
  const sortedStates = states.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {workflow.name}
            <Badge variant="default">v{workflow.version}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            {entityCfg?.label ?? workflow.entityType}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-1">
          {/* States section */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Trạng thái ({sortedStates.length})
            </h4>
            {loadingStates ? (
              <p className="text-sm text-foreground-muted">Đang tải trạng thái...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sortedStates.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                  >
                    <div
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: s.color ?? "#6b7280" }}
                    />
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">
                        {s.stateName}
                      </span>
                      <Badge variant="default" className="text-[10px] w-fit">
                        {getColumnLabel(s.columnName)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.isInitial && (
                        <Badge variant="blue" className="gap-1">
                          <PlayCircle size={10} />
                          Bắt đầu
                        </Badge>
                      )}
                      {s.isFinal && (
                        <Badge variant="purple" className="gap-1">
                          <Flag size={10} />
                          Kết thúc
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transitions section */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Chuyển trạng thái ({transitions.length})
            </h4>
            {loadingTransitions ? (
              <p className="text-sm text-foreground-muted">Đang tải chuyển trạng thái...</p>
            ) : transitions.length ? (
              <div className="flex flex-col gap-2">
                {transitions.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted/30 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {t.fromState.stateName}
                          </span>
                          <span className="text-[10px] text-foreground-muted truncate">
                            {getColumnLabel(t.fromState.columnName)}
                          </span>
                        </div>
                        <ArrowRight size={14} className="text-foreground-muted shrink-0" />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {t.toState.stateName}
                          </span>
                          <span className="text-[10px] text-foreground-muted truncate">
                            {getColumnLabel(t.toState.columnName)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="default">{t.actionLabel}</Badge>
                        {t.requireReason && (
                          <Badge variant="yellow" className="gap-1">
                            <Square size={8} />
                            Lý do
                          </Badge>
                        )}
                        {t.requireAttachment && (
                          <Badge variant="yellow" className="gap-1">
                            <Square size={8} />
                            Tệp
                          </Badge>
                        )}
                      </div>
                    </div>

                    {Array.isArray(t.requiredRoleJson) && (t.requiredRoleJson as string[]).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] uppercase tracking-wide text-foreground-muted">
                          Role:
                        </span>
                        {(t.requiredRoleJson as string[]).map((r) => (
                          <Badge key={r} variant="blue" className="text-[10px]">
                            {roleLabel[r] ?? r}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground-muted">Chưa có chuyển trạng thái nào.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
