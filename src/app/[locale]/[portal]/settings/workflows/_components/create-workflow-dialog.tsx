"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { FormField } from "@/components/shared/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { CreateWorkflowDto } from "@/lib/api/models/createWorkflowDto";
import type { UpdateWorkflowDtoStatus } from "@/lib/api/models/updateWorkflowDtoStatus";
import type { WorkflowStateDto } from "@/lib/api/models/workflowStateDto";
import type { WorkflowTransitionDto } from "@/lib/api/models/workflowTransitionDto";
import {
  useGetApiWorkflowEntityStatusFields,
  useGetApiWorkflowIdStates,
  useGetApiWorkflowIdTransitions,
} from "@/lib/api/endpoints/workflow";
import { useGetApiRoles } from "@/lib/api/endpoints/roles";
import {
  entityTypeOptions,
  statusFilters,
  emptyState,
  emptyTransition,
  roleLabel,
  stateColorPresets,
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

interface CreateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (dto: CreateWorkflowDto & { status?: UpdateWorkflowDtoStatus }) => Promise<void>;
  isSubmitting: boolean;
  /** When provided, dialog is in edit mode */
  initialData?: WorkflowDefinition | null;
}

export function CreateWorkflowDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: CreateWorkflowDialogProps) {
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("LEAD");
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState<UpdateWorkflowDtoStatus>("ACTIVE");
  const [states, setStates] = useState<WorkflowStateDto[]>([emptyState()]);
  const [transitions, setTransitions] = useState<WorkflowTransitionDto[]>([]);

  // Fetch status fields for the selected entity type
  const { data: statusFieldsData } = useGetApiWorkflowEntityStatusFields(
    { entityType: entityType as any },
    { query: { enabled: !!entityType } },
  );
  const raw = statusFieldsData as any;
  const statusFields: StatusField[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  const { data: rolesRaw } = useGetApiRoles(undefined, {
    query: { enabled: open },
  });
  const rolesData = (rolesRaw as any)?.data ?? (Array.isArray(rolesRaw) ? rolesRaw : []);
  const roleOptions: { value: string; label: string }[] = (rolesData as RoleItem[])
    .filter((r) => r?.code && r?.status !== "INACTIVE")
    .map((r) => ({ value: r.code, label: r.name || r.code }));
  for (const r of roleOptions) roleLabel[r.value] = r.label;

  // Lazy-load states + transitions when editing
  const { data: editStatesRaw } = useGetApiWorkflowIdStates(initialData?.id ?? "", {
    query: { enabled: open && !!initialData },
  });
  const { data: editTransitionsRaw } = useGetApiWorkflowIdTransitions(initialData?.id ?? "", {
    query: { enabled: open && !!initialData },
  });

  // Load initial data when editing
  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name);
      setEntityType(initialData.entityType);
      setVersion(initialData.version);
      setStatus((initialData.status as UpdateWorkflowDtoStatus) ?? "ACTIVE");
    }
  }, [open, initialData]);

  useEffect(() => {
    if (open && initialData && editStatesRaw) {
      const list: WorkflowState[] = Array.isArray(editStatesRaw)
        ? editStatesRaw
        : ((editStatesRaw as any)?.data ?? []);
      setStates(
        list.length
          ? list.map((s) => ({
            id: s.id,
            stateName: s.stateName,
            columnName: s.columnName,
            isInitial: s.isInitial,
            isFinal: s.isFinal,
            sortOrder: s.sortOrder,
            color: s.color ?? undefined,
          }))
          : [emptyState()],
      );
    }
  }, [open, initialData, editStatesRaw]);

  useEffect(() => {
    if (open && initialData && editTransitionsRaw) {
      const list: WorkflowTransition[] = Array.isArray(editTransitionsRaw)
        ? editTransitionsRaw
        : ((editTransitionsRaw as any)?.data ?? []);
      setTransitions(
        list.map((t) => ({
          fromStateName: t.fromState.stateName,
          toStateName: t.toState.stateName,
          actionCode: t.actionCode,
          actionLabel: t.actionLabel,
          requiredRoleJson: Array.isArray(t.requiredRoleJson)
            ? (t.requiredRoleJson as any)
            : ([] as any),
          requireReason: t.requireReason,
          requireAttachment: t.requireAttachment,
        })),
      );
    }
  }, [open, initialData, editTransitionsRaw]);

  const reset = () => {
    setName("");
    setEntityType("LEAD");
    setVersion(1);
    setStatus("ACTIVE");
    setStates([emptyState()]);
    setTransitions([]);
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) reset();
  };

  // ── State helpers ──────────────────────────────────
  const addState = () => setStates((s) => [...s, emptyState()]);
  const removeState = (idx: number) =>
    setStates((s) => (s.length === 1 ? s : s.filter((_, i) => i !== idx)));
  const updateState = (idx: number, patch: Partial<WorkflowStateDto>) =>
    setStates((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));

  // Only one initial state allowed
  const setInitialState = (idx: number) =>
    setStates((s) => s.map((st, i) => ({ ...st, isInitial: i === idx })));

  // ── Transition helpers ─────────────────────────────
  const addTransition = () => setTransitions((t) => [...t, emptyTransition()]);
  const removeTransition = (idx: number) =>
    setTransitions((t) => t.filter((_, i) => i !== idx));
  const updateTransition = (idx: number, patch: Partial<WorkflowTransitionDto>) =>
    setTransitions((t) => t.map((tr, i) => (i === idx ? { ...tr, ...patch } : tr)));

  // Build label lookup from registry (column labels only — state values are free-form codes)
  const fieldLabelMap = new Map<string, string>(); // fieldKey → label
  for (const sf of statusFields) {
    fieldLabelMap.set(sf.fieldKey, sf.label);
  }
  const getColumnLabel = (columnName: string) =>
    fieldLabelMap.get(columnName) ?? columnName;

  const stateOptions = states
    .filter((s) => (s.stateName ?? "").trim())
    .map((s) => ({
      value: s.stateName,
      label: s.stateName,
      columnLabel: getColumnLabel(s.columnName ?? ""),
    }));

  // Duplicate state names (transitions reference states by name)
  const nameCounts = new Map<string, number>();
  for (const s of states) {
    const n = s.stateName.trim();
    if (n) nameCounts.set(n, (nameCounts.get(n) ?? 0) + 1);
  }
  const isDuplicateName = (name: string) =>
    name.trim() !== "" && (nameCounts.get(name.trim()) ?? 0) > 1;

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên workflow");
      return;
    }
    const validStates = states.filter((s) => s.stateName.trim() && s.columnName.trim());
    if (validStates.length < 2) {
      toast.error("Cần ít nhất 2 trạng thái");
      return;
    }
    if (!validStates.some((s) => s.isInitial)) {
      toast.error("Cần chọn 1 trạng thái làm trạng thái bắt đầu");
      return;
    }
    const uniqueNames = new Set(validStates.map((s) => s.stateName.trim()));
    if (uniqueNames.size !== validStates.length) {
      toast.error("Tên trạng thái không được trùng nhau");
      return;
    }

    // Re-index sortOrder, strip id (not part of DTO)
    const statesWithOrder = validStates.map((s, i) => {
      const rest = { ...s } as any;
      delete rest.id;
      return {
        ...rest,
        stateName: s.stateName.trim(),
        sortOrder: s.sortOrder ?? i,
      };
    });

    const stateNames = new Set(statesWithOrder.map((s) => s.stateName));
    const validTransitions = transitions.filter(
      (t) =>
        t.fromStateName.trim() &&
        t.toStateName.trim() &&
        t.actionCode.trim() &&
        stateNames.has(t.fromStateName) &&
        stateNames.has(t.toStateName),
    );

    const dto: CreateWorkflowDto & { status?: UpdateWorkflowDtoStatus } = {
      name: name.trim(),
      entityType,
      version,
      ...(initialData ? { status } : {}),
      states: statesWithOrder,
      transitions: validTransitions.map((t) => ({
        ...t,
        actionCode: t.actionCode.trim().toUpperCase(),
        actionLabel: t.actionLabel.trim(),
        requiredRoleJson:
          Array.isArray(t.requiredRoleJson) && t.requiredRoleJson.length > 0
            ? (t.requiredRoleJson as any)
            : undefined,
      })),
    };

    await onSubmit(dto);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl h-[96vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{initialData ? "Chỉnh sửa workflow" : "Tạo workflow"}</DialogTitle>
          <DialogDescription>
            Định nghĩa trạng thái và chuyển trạng thái cho một loại đối tượng. Mỗi tenant có thể
            cấu hình workflow riêng.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left column: Workflow info */}
          <div className="flex flex-col gap-3 col-span-4 overflow-y-auto pr-1">
            <FormField label="Tên workflow" required>
              <Input
                placeholder="VD: Deal Pipeline 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
            <FormField label="Đối tượng áp dụng" required>
              <Select
                value={entityType}
                onValueChange={(v) => !initialData && setEntityType((v as string) ?? "LEAD")}
                disabled={!!initialData}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn đối tượng">
                    {(value: string) =>
                      entityTypeOptions.find((o) => o.value === value)?.label || value
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {entityTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Phiên bản" helper="Tăng khi tạo version mới">
              <Input
                type="number"
                min={1}
                value={version}
                onChange={(e) => setVersion(Number(e.target.value) || 1)}
              />
            </FormField>
            {initialData && (
              <FormField label="Trạng thái">
                <Select
                  value={status}
                  onValueChange={(v) => setStatus((v as UpdateWorkflowDtoStatus) ?? "ACTIVE")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn trạng thái">
                      {(value: string) =>
                        statusFilters.find((s) => s.value === value)?.label || value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusFilters
                      .filter((s) => s.value)
                      .map((s) => (
                        <SelectItem key={s.value} value={s.value} label={s.label}>
                          {s.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}

            {/* Quick stats */}
            <div className="mt-2 rounded-lg border border-border bg-surface-muted/30 p-3 text-xs text-foreground-muted">
              <div className="flex justify-between">
                <span>Trạng thái:</span>
                <span className="font-medium text-foreground">{states.length}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Chuyển trạng thái:</span>
                <span className="font-medium text-foreground">{transitions.length}</span>
              </div>
            </div>
          </div>

          {/* Right column: States + Transitions */}
          <div className="flex flex-col gap-4 col-span-8 overflow-y-auto pr-1">
            {/* States */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Trạng thái
                </h4>
                <Button size="sm" variant="outline" onClick={addState}>
                  <Plus size={12} />
                  Thêm trạng thái
                </Button>
              </div>
              {states.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3"
                >
                  <div className="flex flex-1 flex-wrap gap-2">
                    <FormField label="Cột áp dụng" required className="w-[180px]">
                      <Select
                        value={s.columnName || "__none__"}
                        onValueChange={(v) => {
                          const col = (v as string) === "__none__" ? "" : (v as string);
                          updateState(idx, { columnName: col, stateName: "" });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn cột...">
                            {(value: string) => {
                              if (!value || value === "__none__") return "Chọn cột...";
                              const f = statusFields.find((sf) => sf.fieldKey === value);
                              return f?.label || value;
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" label="— Chọn cột —">— Chọn cột —</SelectItem>
                          {statusFields.map((sf) => (
                            <SelectItem key={sf.fieldKey} value={sf.fieldKey} label={sf.label}>
                              {sf.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField
                      label="Trạng thái"
                      required
                      className="w-[180px]"
                      error={isDuplicateName(s.stateName) ? "Tên trạng thái bị trùng" : undefined}
                    >
                      <Input
                        placeholder="VD: NEW, FOLLOW_UP..."
                        value={s.stateName}
                        onChange={(e) => updateState(idx, { stateName: e.target.value })}
                        disabled={!s.columnName}
                        aria-invalid={isDuplicateName(s.stateName) || undefined}
                      />
                    </FormField>
                    <FormField label="Màu" className="w-[135px]">
                      <Select
                        value={s.color ?? ""}
                        onValueChange={(v) => updateState(idx, { color: (v as string) || undefined })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn màu">
                            {(value: string) => (
                              <span className="flex items-center gap-1.5">
                                {value && (
                                  <span
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: value }}
                                  />
                                )}
                                {stateColorPresets.find((c) => c.value === value)?.label || "Chọn màu"}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {stateColorPresets.map((c) => (
                            <SelectItem key={c.value} value={c.value} label={c.label}>
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="size-2.5 rounded-full"
                                  style={{ backgroundColor: c.value }}
                                />
                                {c.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  <FormField label="Tùy chọn" className="shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1.5 text-xs text-foreground-muted cursor-pointer">
                          <Checkbox
                            checked={s.isInitial}
                            onCheckedChange={(val) => val && setInitialState(idx)}
                          />
                          Bắt đầu
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-foreground-muted cursor-pointer">
                          <Checkbox
                            checked={s.isFinal}
                            onCheckedChange={(val) => updateState(idx, { isFinal: !!val })}
                          />
                          Kết thúc
                        </label>
                      </div>
                      {states.length > 1 && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => removeState(idx)}
                          title="Xóa trạng thái"
                          className="text-foreground-muted hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </FormField>
                </div>
              ))}
            </div>

            {/* Transitions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Chuyển trạng thái
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addTransition}
                  disabled={stateOptions.length < 2}
                >
                  <Plus size={12} />
                  Thêm chuyển
                </Button>
              </div>
              {stateOptions.length < 2 ? (
                <p className="text-xs text-foreground-muted rounded-lg border border-dashed border-border p-3">
                  Cần ít nhất 2 trạng thái (có tên) để tạo chuyển trạng thái.
                </p>
              ) : transitions.length === 0 ? (
                <p className="text-xs text-foreground-muted rounded-lg border border-dashed border-border p-3">
                  Chưa có chuyển trạng thái. Bấm "Thêm chuyển" để bắt đầu.
                </p>
              ) : (
                transitions.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted/20 p-3"
                  >
                    {/* Left: 2 rows of fields */}
                    <div className="flex flex-1 flex-col gap-2 min-w-0">
                      {/* Row 1: actionCode + actionLabel */}
                      <div className="flex items-end gap-2">
                        <FormField label="Mã hành động" required className="flex-[5] min-w-[100px]">
                          <Input
                            placeholder="PUBLISH"
                            value={t.actionCode}
                            onChange={(e) => updateTransition(idx, { actionCode: e.target.value })}
                          />
                        </FormField>

                        <FormField label="Nhãn hiển thị" required className="flex-[7] min-w-[140px]">
                          <Input
                            placeholder="Đăng tin"
                            value={t.actionLabel}
                            onChange={(e) => updateTransition(idx, { actionLabel: e.target.value })}
                          />
                        </FormField>
                      </div>

                      {/* Row 2: from → to + checkboxes + delete */}
                      <div className="flex items-end gap-2">
                        <FormField label="Từ trạng thái" required className="flex-1 min-w-[100px]">
                          <Select
                            value={t.fromStateName}
                            onValueChange={(v) => updateTransition(idx, { fromStateName: (v as string) ?? "" })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn...">
                                {(value: string) => {
                                  const o = stateOptions.find((o) => o.value === value);
                                  if (!o) return value;
                                  return (
                                    <span className="flex items-center gap-1.5">
                                      <span>{o.label}</span>
                                      {o.columnLabel && (
                                        <span className="text-[10px] text-foreground-muted">({o.columnLabel})</span>
                                      )}
                                    </span>
                                  );
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {stateOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value} label={o.label}>
                                  <span className="flex items-center gap-1.5">
                                    <span>{o.label}</span>
                                    {o.columnLabel && (
                                      <span className="text-[10px] text-foreground-muted">({o.columnLabel})</span>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        <div className="pb-2">
                          <ArrowRight size={16} className="text-foreground-muted" />
                        </div>

                        <FormField label="Đến trạng thái" required className="flex-1 min-w-[100px]">
                          <Select
                            value={t.toStateName}
                            onValueChange={(v) => updateTransition(idx, { toStateName: (v as string) ?? "" })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn...">
                                {(value: string) => {
                                  const o = stateOptions.find((o) => o.value === value);
                                  if (!o) return value;
                                  return (
                                    <span className="flex items-center gap-1.5">
                                      <span>{o.label}</span>
                                      {o.columnLabel && (
                                        <span className="text-[10px] text-foreground-muted">({o.columnLabel})</span>
                                      )}
                                    </span>
                                  );
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {stateOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value} label={o.label}>
                                  <span className="flex items-center gap-1.5">
                                    <span>{o.label}</span>
                                    {o.columnLabel && (
                                      <span className="text-[10px] text-foreground-muted">({o.columnLabel})</span>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField label="Tùy chọn" className="shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="flex items-center gap-1.5 text-xs text-foreground-muted cursor-pointer">
                                <Checkbox
                                  checked={t.requireReason}
                                  onCheckedChange={(val) => updateTransition(idx, { requireReason: !!val })}
                                />
                                Cần lý do
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-foreground-muted cursor-pointer">
                                <Checkbox
                                  checked={t.requireAttachment}
                                  onCheckedChange={(val) => updateTransition(idx, { requireAttachment: !!val })}
                                />
                                Cần tệp
                              </label>
                            </div>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => removeTransition(idx)}
                              title="Xóa chuyển"
                              className="text-foreground-muted hover:text-destructive"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </FormField>
                      </div>

                      {/* Row 3: required roles (multi-select) */}
                      <div className="flex items-end gap-2">
                        <FormField label="Role được phép thực hiện" className="flex-1">
                          <div className="flex flex-wrap gap-1.5 rounded-md border border-border bg-surface p-2 min-h-[36px]">
                            {roleOptions.map((r) => {
                              const selected = Array.isArray(t.requiredRoleJson)
                                ? (t.requiredRoleJson as string[]).includes(r.value)
                                : false;
                              return (
                                <button
                                  key={r.value}
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(t.requiredRoleJson)
                                      ? (t.requiredRoleJson as string[])
                                      : [];
                                    const next = selected
                                      ? current.filter((c) => c !== r.value)
                                      : [...current, r.value];
                                    updateTransition(idx, { requiredRoleJson: next as any });
                                  }}
                                  className={`rounded-full px-2 py-0.5 text-xs transition-colors ${selected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-surface-muted text-foreground-muted hover:bg-surface-muted/80"
                                    }`}
                                >
                                  {r.label}
                                </button>
                              );
                            })}
                            {(!t.requiredRoleJson ||
                              (Array.isArray(t.requiredRoleJson) && t.requiredRoleJson.length === 0)) && (
                                <span className="text-xs text-foreground-muted italic">
                                  Không chọn = tất cả role đều thực hiện được
                                </span>
                              )}
                          </div>
                        </FormField>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? initialData ? "Đang lưu..." : "Đang tạo..."
              : initialData ? "Lưu thay đổi" : "Tạo workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
