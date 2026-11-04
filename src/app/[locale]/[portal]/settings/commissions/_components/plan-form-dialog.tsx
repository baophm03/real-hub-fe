"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { FormField } from "@/components/shared/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { CreateCommissionPlanDto } from "@/lib/api/models/createCommissionPlanDto";
import { useApiCommissionOptions, type CommissionOptions } from "@/lib/api/endpoints/commission-meta";
import {
  emptyRule,
  emptySplit,
  type Plan,
  type Rule,
  type Split,
} from "./types";
import { RuleSection } from "./rule-section";

export type PlanFormSubmission = Omit<CreateCommissionPlanDto, "effectiveTo"> & {
  effectiveTo?: string | null;
};

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (dto: PlanFormSubmission) => Promise<void>;
  isSubmitting: boolean;
  initialPlan?: Plan | null;
  mode?: "create" | "edit" | "clone";
}

function planToRules(plan: Plan, options?: CommissionOptions): Rule[] {
  if (!plan.rules || plan.rules.length === 0) return [emptyRule(options)];
  return plan.rules.map((r) => ({
    id: r.id,
    name: r.name,
    priority: r.priority ?? 0,
    commissionType: (r as any).commissionType ?? options?.commissionTypes[0]?.value,
    dealType: (r as any).dealType ?? "",
    propertyTypeId: (r as any).propertyTypeId ?? "",
    sellingMode: (r as any).sellingMode ?? "",
    zoneId: (r as any).zoneId ?? "",
    projectId: (r as any).projectId ?? "",
    leadSource: (r as any).leadSource ?? "",
    calculationType: r.calculationType,
    calculationValue: Number(r.calculationValue) || 0,
    calculationBase: r.calculationBase,
    minCommissionAmount: r.minCommissionAmount ? Number(r.minCommissionAmount) : undefined,
    maxCommissionAmount: r.maxCommissionAmount ? Number(r.maxCommissionAmount) : undefined,
    splits: (r.splits ?? []).map((s) => ({
      id: s.id,
      receiverType: s.receiverType,
      receiverRole: s.receiverRole,
      receiverUserId: s.receiverUserId,
      receiverName: (s as any).receiverName,
      splitType: s.splitType,
      splitValue: Number(s.splitValue) || 0,
      minAmount: s.minAmount ? Number(s.minAmount) : undefined,
      maxAmount: s.maxAmount ? Number(s.maxAmount) : undefined,
      priority: s.priority ?? 0,
    })),
  }));
}

function isoToDateInput(value?: string | null): string {
  if (!value) return "";
  // Effective dates are calendar dates. Keep the stored/API date component instead
  // of converting a legacy timestamp through the browser's timezone.
  const match = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(value);
  return match?.[1] ?? "";
}

function todayDateInput(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function PlanFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialPlan,
  mode = initialPlan ? "edit" : "create",
}: PlanFormDialogProps) {
  const { data: optionsEnvelope } = useApiCommissionOptions();
  const options = optionsEnvelope?.data;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [collapsedRules, setCollapsedRules] = useState<Set<number>>(new Set());

  // Hydrate a copy from the source policy for edit/clone. Clone always starts as a new draft.
  useEffect(() => {
    if (open && initialPlan) {
      setName(mode === "clone" ? `${initialPlan.name} – bản sao` : initialPlan.name);
      setDescription(initialPlan.description ?? "");
      setPriority(initialPlan.priority ?? 0);
      setEffectiveFrom(mode === "clone"
        ? options?.businessTimezone ? todayDateInput(options.businessTimezone) : ""
        : isoToDateInput(initialPlan.effectiveFrom));
      setEffectiveTo(mode === "clone" ? "" : isoToDateInput(initialPlan.effectiveTo));
      setRules(planToRules(initialPlan, options));
      setCollapsedRules(new Set());
    } else if (open && !initialPlan && options) {
      setRules((current) => current.length === 0 || !current[0]?.calculationType
        ? [emptyRule(options)]
        : current);
    }
  }, [open, initialPlan, options, mode]);

  const toggleRule = (idx: number) =>
    setCollapsedRules((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const reset = () => {
    setName("");
    setDescription("");
    setPriority(0);
    setEffectiveFrom("");
    setEffectiveTo("");
    setRules(options ? [emptyRule(options)] : []);
    setCollapsedRules(new Set());
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) reset();
  };

  const addRule = () => setRules((r) => [...r, emptyRule(options)]);
  const removeRule = (idx: number) =>
    setRules((r) => (r.length === 1 ? r : r.filter((_, i) => i !== idx)));
  const updateRule = (idx: number, patch: Partial<Rule>) =>
    setRules((current) => current.map((rule, i) => {
      if (i !== idx) return rule;
      const next = { ...rule, ...patch };
      return next;
    }));

  const addSplit = (ruleIdx: number) =>
    updateRule(ruleIdx, {
      splits: [...(rules[ruleIdx].splits ?? []), emptySplit(options)],
    });
  const removeSplit = (ruleIdx: number, splitIdx: number) =>
    updateRule(ruleIdx, {
      splits:
        (rules[ruleIdx].splits?.length ?? 0) <= 1
          ? rules[ruleIdx].splits
          : rules[ruleIdx].splits?.filter((_, i) => i !== splitIdx),
    });
  const updateSplit = (ruleIdx: number, splitIdx: number, patch: Partial<Split>) =>
    updateRule(ruleIdx, {
      splits: rules[ruleIdx].splits?.map((s, i) => (i === splitIdx ? { ...s, ...patch } : s)),
    });

  const handleSubmit = async () => {
    if (!options) {
      toast.error("Đang tải cấu hình hoa hồng từ hệ thống");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên kế hoạch");
      return;
    }
    if (!effectiveFrom) {
      toast.error("Vui lòng chọn ngày bắt đầu");
      return;
    }
    for (const rule of rules) {
      if (!rule.name.trim()) {
        toast.error("Mọi rule cần có tên");
        return;
      }
      if (!rule.splits?.length) {
        toast.error(`Rule "${rule.name}" cần ít nhất 1 split`);
        return;
      }
    }

    const dto = {
      name: name.trim(),
      description: description.trim() || undefined,
      priority,
      effectiveFrom,
      effectiveTo: effectiveTo || (mode === "edit" && initialPlan?.effectiveTo ? null : undefined),
      rules: rules.map((r) => ({
        name: r.name.trim(),
        priority: r.priority ?? 0,
        commissionType: r.commissionType,
        dealType: (r as any).dealType || undefined,
        propertyTypeId: (r as any).propertyTypeId || undefined,
        sellingMode: (r as any).sellingMode || undefined,
        zoneId: r.zoneId || undefined,
        projectId: r.projectId || undefined,
        leadSource: r.leadSource || undefined,
        calculationType: r.calculationType,
        calculationValue: Number(r.calculationValue) || 0,
        calculationBase: r.calculationBase,
        minCommissionAmount: r.minCommissionAmount ? Number(r.minCommissionAmount) : undefined,
        maxCommissionAmount: r.maxCommissionAmount ? Number(r.maxCommissionAmount) : undefined,
        splits: r.splits.map((s) => ({
          receiverType: s.receiverType,
          receiverRole: s.receiverType === "ROLE" ? s.receiverRole : undefined,
          receiverUserId: s.receiverType === "USER" ? s.receiverUserId : undefined,
          receiverName: s.receiverType === "EXTERNAL" ? s.receiverName?.trim() : undefined,
          splitType: s.splitType,
          splitValue: Number(s.splitValue) || 0,
          minAmount: s.minAmount ? Number(s.minAmount) : undefined,
          maxAmount: s.maxAmount ? Number(s.maxAmount) : undefined,
          priority: s.priority,
        })),
      })),
    };

    await onSubmit(dto as PlanFormSubmission);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-7xl h-[96vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === "clone" ? "Nhân bản chính sách hoa hồng" : mode === "edit" ? "Sửa kế hoạch hoa hồng" : "Tạo kế hoạch hoa hồng"}</DialogTitle>
          <DialogDescription>
            {mode === "clone"
              ? "Tạo một bản nháp mới từ rule và split hiện có. Bản gốc và lịch sử hoa hồng không bị thay đổi. Kiểm tra lại ngày hiệu lực trước khi gửi duyệt."
              : `Kế hoạch chứa nhiều rule — ngày hiệu lực theo múi giờ ${options?.businessTimezone ?? "được cấu hình cho tenant"}; mỗi rule áp dụng theo điều kiện và chia hoa hồng cho các role`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 flex-1 min-h-0">
          {/* Left column: Plan info */}
          <div className="flex flex-col gap-3 col-span-3 overflow-y-auto pr-1">
            <FormField label="Tên kế hoạch" required>
              <Input
                placeholder="VD: Hoa hồng 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
            <FormField label="Mô tả">
              <Textarea
                placeholder="Mô tả ngắn gọn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="field-sizing-fixed min-h-25"
              />
            </FormField>
            <FormField label="Ngày bắt đầu" required>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </FormField>
            <FormField label="Ngày kết thúc" helper="Để trống = vô thời hạn">
              <Input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </FormField>
            <FormField label="Ưu tiên" helper="Số cao hơn áp dụng trước">
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </FormField>
          </div>

          {/* Right column: Rule sections */}
          <div className="flex flex-col gap-4 col-span-7 overflow-y-auto pr-1">
            {rules.map((rule, rIdx) => (
              <RuleSection
                key={rIdx}
                rule={rule}
                ruleIdx={rIdx}
                rulesCount={rules.length}
                collapsed={collapsedRules.has(rIdx)}
                onToggleCollapse={() => toggleRule(rIdx)}
                onRuleChange={(patch) => updateRule(rIdx, patch)}
                onRemoveRule={() => removeRule(rIdx)}
                onAddSplit={() => addSplit(rIdx)}
                onSplitChange={(sIdx, patch) => updateSplit(rIdx, sIdx, patch)}
                onSplitRemove={(sIdx) => removeSplit(rIdx, sIdx)}
              />
            ))}

            {/* Add rule button at the bottom of the rules column */}
            <Button variant="outline" className="w-full" onClick={addRule}>
              <Plus size={14} />
              Tạo rule
            </Button>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : mode === "clone" ? "Tạo bản nháp" : "Tạo kế hoạch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
