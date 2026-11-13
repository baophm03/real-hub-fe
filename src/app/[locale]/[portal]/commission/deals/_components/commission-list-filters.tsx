"use client";

import { useMemo } from "react";
import { FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CommissionOptions } from "@/lib/api/endpoints/commission-meta";
import { getLeadSourceLabel } from "@/utils/lead-source-labels";

const ALL = "ALL";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterFieldProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  disabled?: boolean;
  hint?: string;
}

function FilterField({ label, value, options, onChange, disabled, hint }: FilterFieldProps) {
  const items = useMemo(
    () => Object.fromEntries(options.map((option) => [option.value, option.label])),
    [options],
  );

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground-muted">{label}</span>
      <Select value={value} items={items} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} label={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <span className="text-[11px] text-foreground-muted">{hint}</span>}
    </div>
  );
}

interface CommissionListFiltersProps {
  options?: CommissionOptions;
  optionsError: boolean;
  optionsLoading: boolean;
  status: string;
  commissionType: string;
  zoneId: string;
  projectId: string;
  teamId: string;
  leadSource: string;
  hasActiveFilters: boolean;
  onStatusChange: (value: string | null) => void;
  onCommissionTypeChange: (value: string | null) => void;
  onZoneChange: (value: string | null) => void;
  onProjectChange: (value: string | null) => void;
  onTeamChange: (value: string | null) => void;
  onLeadSourceChange: (value: string | null) => void;
  onClear: () => void;
}

export function CommissionListFilters({
  options,
  optionsError,
  optionsLoading,
  status,
  commissionType,
  zoneId,
  projectId,
  teamId,
  leadSource,
  hasActiveFilters,
  onStatusChange,
  onCommissionTypeChange,
  onZoneChange,
  onProjectChange,
  onTeamChange,
  onLeadSourceChange,
  onClear,
}: CommissionListFiltersProps) {
  const statusOptions = [
    { value: ALL, label: "Tất cả trạng thái" },
    ...(options?.commissionStatuses ?? []).map(({ value, label }) => ({ value, label })),
  ];
  const typeOptions = [
    { value: ALL, label: "Tất cả loại hoa hồng" },
    ...(options?.commissionTypes ?? []).map(({ value, label }) => ({ value, label })),
  ];
  const zoneOptions = [
    { value: ALL, label: "Tất cả khu vực" },
    ...(options?.zones ?? []).map((zone) => ({ value: zone.id, label: zone.name })),
  ];
  const zones = options?.zones ?? [];
  const zoneHint = optionsLoading && zones.length === 0
    ? "Đang tải danh sách khu vực."
    : optionsError
      ? zones.length > 0
        ? "Không làm mới được; đang dùng danh sách khu vực đã tải trước đó."
        : "Không tải được danh sách khu vực. Hãy thử tải lại tùy chọn."
      : options && zones.length === 0
        ? "Tenant chưa có khu vực đang hoạt động."
        : undefined;
  const projectOptions = [
    { value: ALL, label: "Tất cả dự án" },
    ...(options?.projects ?? []).map((project) => ({ value: project.id, label: project.name })),
  ];
  const teamOptions = [
    { value: ALL, label: "Tất cả đội nhóm" },
    ...(options?.teams ?? []).map((team) => ({ value: team.id, label: team.name })),
  ];
  const sourceOptions = [
    { value: ALL, label: "Tất cả nguồn lead" },
    ...(options?.leadSources ?? []).map((source) => ({ value: source, label: getLeadSourceLabel(source) })),
  ];

  return (
    <section aria-labelledby="commission-filters-title" className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="commission-filters-title" className="text-sm font-semibold">Lọc danh sách</h2>
          <p className="mt-1 text-xs text-foreground-muted">Thu hẹp theo trạng thái, loại khoản và phạm vi áp dụng.</p>
        </div>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <FilterX size={14} />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FilterField label="Trạng thái" value={status} options={statusOptions} onChange={onStatusChange} />
        <FilterField label="Loại hoa hồng" value={commissionType} options={typeOptions} onChange={onCommissionTypeChange} />
        <FilterField
          label="Khu vực"
          value={zoneId}
          options={zoneOptions}
          onChange={onZoneChange}
          disabled={optionsLoading || zones.length === 0}
          hint={zoneHint}
        />
        <FilterField label="Dự án" value={projectId} options={projectOptions} onChange={onProjectChange} disabled={!options?.projects.length} />
        <FilterField label="Đội nhóm" value={teamId} options={teamOptions} onChange={onTeamChange} disabled={!options?.teams.length} />
        <FilterField label="Nguồn lead" value={leadSource} options={sourceOptions} onChange={onLeadSourceChange} disabled={!options?.leadSources.length} />
      </div>
    </section>
  );
}
