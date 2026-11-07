"use client";

import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { FormField } from "@/components/shared/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useApiCommissionOptions } from "@/lib/api/endpoints/commission-meta";
import { getLeadSourceLabel } from "@/utils/lead-source-labels";
import {
  emptySplit,
  type Rule,
  type Split,
} from "./types";
import { SplitItem } from "./split-item";

const UNSCOPED = "__ANY__";

interface RuleSectionProps {
  rule: Rule;
  ruleIdx: number;
  rulesCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRuleChange: (patch: Partial<Rule>) => void;
  onRemoveRule: () => void;
  onAddSplit: () => void;
  onSplitChange: (splitIdx: number, patch: Partial<Split>) => void;
  onSplitRemove: (splitIdx: number) => void;
}

export function RuleSection({
  rule,
  ruleIdx,
  rulesCount,
  collapsed,
  onToggleCollapse,
  onRuleChange,
  onRemoveRule,
  onAddSplit,
  onSplitChange,
  onSplitRemove,
}: RuleSectionProps) {
  const splits = rule.splits ?? [];
  const totalPercent = splits
    .filter((s) => s.splitType === "PERCENT")
    .reduce((acc, s) => acc + (Number(s.splitValue) || 0), 0);

  const { data: optionsEnvelope } = useApiCommissionOptions();
  const options = optionsEnvelope?.data;
  const propertyTypes = options?.propertyTypes ?? [];
  const dealTypeOptions = options?.dealTypes ?? [];
  const sellingModeOptions = options?.sellingModes ?? [];
  const calculationTypeOptions = options?.calculationTypes ?? [];
  const calculationBaseOptions = options?.calculationBases ?? [];

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted/20 p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex flex-1 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted hover:text-foreground transition-colors min-w-0 cursor-pointer"
          onClick={onToggleCollapse}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          Rule {ruleIdx + 1}
          {collapsed && rule.name && (
            <span className="normal-case font-normal text-foreground-muted/70">
              · {rule.name}
            </span>
          )}
        </button>
        {rulesCount > 1 && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onRemoveRule}
            title="Xóa rule"
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      {!collapsed && (
        <>
          {/* 2 sub-columns: rule form | splits */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Sub-column left: rule form */}
            <div className="rounded-md border border-border bg-surface p-3 col-span-6">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tên rule" required className="col-span-2">
                  <Input
                    placeholder="VD: Bán căn hộ, Cho thuê nhà..."
                    value={rule.name}
                    onChange={(e) => onRuleChange({ name: e.target.value })}
                  />
                </FormField>

                <FormField label="Loại khoản hoa hồng" className="col-span-2" required>
                  <Select
                    value={rule.commissionType ?? options?.commissionTypes[0]?.value ?? ""}
                    onValueChange={(value) => onRuleChange({ commissionType: value as string })}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn loại khoản" /></SelectTrigger>
                    <SelectContent>
                      {(options?.commissionTypes ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value} label={option.label}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Loại giao dịch"
                  className="col-span-2"
                >
                  <Select
                    value={rule.dealType || UNSCOPED}
                    onValueChange={(v) =>
                      onRuleChange({ dealType: v === UNSCOPED ? "" : (v as string) ?? "" })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tất cả loại giao dịch">
                        {(value: string) =>
                          dealTypeOptions.find((o) => o.value === value)?.label ||
                          "Tất cả loại giao dịch"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSCOPED} label="Tất cả loại giao dịch">Tất cả loại giao dịch</SelectItem>
                      {dealTypeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value} label={o.label}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Loại BĐS"
                  className="col-span-2"
                >
                  <Select
                    value={rule.propertyTypeId || UNSCOPED}
                    onValueChange={(v) =>
                      onRuleChange({ propertyTypeId: v === UNSCOPED ? "" : (v as string) ?? "" })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tất cả loại BĐS">
                        {(value: string) =>
                          propertyTypes.find((pt: any) => pt.id === value)?.name ||
                          "Tất cả loại BĐS"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSCOPED} label="Tất cả loại BĐS">
                        Tất cả loại BĐS
                      </SelectItem>
                      {propertyTypes.map((pt: any) => (
                        <SelectItem
                          key={pt.id}
                          value={pt.id}
                          label={pt.name}
                        >
                          {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Khu vực" className="col-span-2">
                  <Select value={rule.zoneId || UNSCOPED} onValueChange={(value) => onRuleChange({ zoneId: value === UNSCOPED ? "" : value as string })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Tất cả khu vực" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSCOPED} label="Tất cả khu vực">Tất cả khu vực</SelectItem>
                      {(options?.zones ?? []).map((zone) => (
                        <SelectItem key={zone.id} value={zone.id} label={`${zone.name} · ${zone.code}`}>{zone.name} · {zone.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Dự án" className="col-span-2">
                  <Select value={rule.projectId || UNSCOPED} onValueChange={(value) => onRuleChange({ projectId: value === UNSCOPED ? "" : value as string })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Tất cả dự án" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSCOPED} label="Tất cả dự án">Tất cả dự án</SelectItem>
                      {(options?.projects ?? []).map((project) => (
                        <SelectItem key={project.id} value={project.id} label={`${project.name} · ${project.code}`}>{project.name} · {project.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Nguồn lead" className="col-span-2">
                  <Select value={rule.leadSource || UNSCOPED} onValueChange={(value) => onRuleChange({ leadSource: value === UNSCOPED ? "" : value as string })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Mọi nguồn lead" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSCOPED} label="Mọi nguồn lead">Mọi nguồn lead</SelectItem>
                      {(options?.leadSources ?? []).map((source) => {
                        const label = getLeadSourceLabel(source);
                        return <SelectItem key={source} value={source} label={label}>{label}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Chế độ khai thác"
                  className="col-span-2"
                >
                  <Select
                    value={rule.sellingMode || UNSCOPED}
                    onValueChange={(v) =>
                      onRuleChange({ sellingMode: v === UNSCOPED ? "" : (v as string) ?? "" })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tất cả chế độ khai thác">
                        {(value: string) =>
                          sellingModeOptions.find((o) => o.value === value)?.label ||
                          "Tất cả chế độ khai thác"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSCOPED} label="Tất cả chế độ khai thác">Tất cả chế độ khai thác</SelectItem>
                      {sellingModeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value} label={o.label}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Cách tính" required>
                  <Select
                    value={rule.calculationType}
                    onValueChange={(v) => v && onRuleChange({ calculationType: v as string })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn cách tính">
                        {(value: string) =>
                          calculationTypeOptions.find((o) => o.value === value)?.label || value
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {calculationTypeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value} label={o.label}>
                          <div className="flex flex-col">
                            <span>{o.label}</span>
                            {o.hint && <span className="text-[10px] text-foreground-muted">{o.hint}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label={
                    rule.calculationType === "PERCENT"
                      ? "Phần trăm (%)"
                      : rule.calculationType === "FIXED_AMOUNT"
                        ? "Số tiền (VNĐ)"
                        : "Giá trị (bỏ qua nếu tháng thuê)"
                  }
                  required
                >
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rule.calculationValue}
                    onChange={(e) =>
                      onRuleChange({ calculationValue: Number(e.target.value) })
                    }
                  />
                </FormField>

                <FormField label="Cơ sở tính" required>
                  <Select
                    value={rule.calculationBase}
                    onValueChange={(v) => v && onRuleChange({ calculationBase: v as string })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn cơ sở">
                        {(value: string) =>
                          calculationBaseOptions.find((o) => o.value === value)?.label || value
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {calculationBaseOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value} label={o.label}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Ưu tiên rule">
                  <Input
                    type="number"
                    value={rule.priority ?? 0}
                    onChange={(e) => onRuleChange({ priority: Number(e.target.value) })}
                  />
                </FormField>

                <FormField label="Hoa hồng tối thiểu (VND)" className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rule.minCommissionAmount ?? ""}
                    onChange={(e) =>
                      onRuleChange({
                        minCommissionAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </FormField>

                <FormField label="Hoa hồng tối đa (VND)" className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rule.maxCommissionAmount ?? ""}
                    onChange={(e) =>
                      onRuleChange({
                        maxCommissionAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </FormField>
              </div>
            </div>

            {/* Sub-column right: splits */}
            <div className="flex flex-col gap-2 col-span-6 overflow-y-auto max-h-[55vh]">
              {splits.map((split, sIdx) => (
                <SplitItem
                  key={sIdx}
                  split={split}
                  options={options}
                  splitsCount={splits.length}
                  totalPercent={totalPercent}
                  isLast={sIdx === splits.length - 1}
                  onChange={(patch) => onSplitChange(sIdx, patch)}
                  onRemove={() => onSplitRemove(sIdx)}
                />
              ))}

              <Button size="sm" variant="outline" className="w-full" onClick={onAddSplit}>
                <Plus size={12} />
                Thêm split
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export { emptySplit };
