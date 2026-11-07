"use client";

import { X } from "lucide-react";
import { useState } from "react";
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
import {
  type Split,
} from "./types";
import { useApiCommissionRecipients, type CommissionOptions } from "@/lib/api/endpoints/commission-meta";

interface SplitItemProps {
  split: Split;
  options?: CommissionOptions;
  splitsCount: number;
  totalPercent: number;
  isLast: boolean;
  onChange: (patch: Partial<Split>) => void;
  onRemove: () => void;
}

export function SplitItem({
  split,
  options,
  splitsCount,
  totalPercent,
  isLast,
  onChange,
  onRemove,
}: SplitItemProps) {
  const [recipientSearch, setRecipientSearch] = useState("");
  const recipientsQuery = useApiCommissionRecipients(recipientSearch, split.receiverType === "USER");
  const recipients = recipientsQuery.data?.data ?? [];
  const receiverTypeOptions = options?.receiverTypes ?? [];
  const receiverRoleOptions = options?.receiverRoles ?? [];
  const splitTypeOptions = options?.splitTypes ?? [];

  return (
    <div className="relative flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
      {splitsCount > 1 && (
        <Button
          size="icon-sm"
          variant="ghost"
          className="absolute top-1 right-1 z-10"
          onClick={onRemove}
          title="Xóa split"
        >
          <X size={12} />
        </Button>
      )}

      {/* Row 1: Receiver + role/userId */}
      <div className="grid grid-cols-12 gap-2 items-end">
        <FormField label="Chia" className="col-span-5">
          <Select
            value={split.receiverType}
            onValueChange={(v) => {
              if (!v) return;
              const rt = v as string;
              onChange({
                receiverType: rt,
                receiverRole: rt === "ROLE" ? receiverRoleOptions[0]?.value : undefined,
                receiverUserId: rt === "USER" ? "" : undefined,
                receiverName: rt === "EXTERNAL" ? "" : undefined,
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Kiểu">
                {(value: string) =>
                  receiverTypeOptions.find((o) => o.value === value)?.label || value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {receiverTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} label={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {split.receiverType === "ROLE" && (
          <FormField label="Vai trò" className="col-span-7">
            <Select
              value={split.receiverRole ?? receiverRoleOptions[0]?.value ?? ""}
              onValueChange={(v) => v && onChange({ receiverRole: v as string })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Role">
                  {(value: string) =>
                    receiverRoleOptions.find((o) => o.value === value)?.label || value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {receiverRoleOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} label={o.label}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}

        {split.receiverType === "USER" && (
          <FormField label="Thành viên nhận" className="col-span-7">
            <Input
              className="mb-1"
              placeholder="Tìm theo tên thành viên"
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
            />
            <Select
              value={split.receiverUserId || null}
              onValueChange={(value) => onChange({ receiverUserId: value as string })}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Chọn thành viên" /></SelectTrigger>
              <SelectContent>
                {recipients.map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id} label={recipient.fullName}>
                    {recipient.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {recipientsQuery.isLoading && <span className="text-xs text-foreground-muted">Đang tải thành viên…</span>}
          </FormField>
        )}

        {split.receiverType === "EXTERNAL" && (
          <FormField label="Tên bên nhận" className="col-span-7" required>
            <Input
              placeholder="Tên cá nhân hoặc tổ chức nhận"
              value={split.receiverName ?? ""}
              onChange={(e) => onChange({ receiverName: e.target.value })}
            />
          </FormField>
        )}
      </div>

      {/* Row 2: Loại + số tiền */}
      <div className="grid grid-cols-12 gap-2 items-end">
        <FormField label="Loại" className="col-span-5">
          <Select
            value={split.splitType}
            onValueChange={(v) => v && onChange({ splitType: v as string })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Loại">
                {(value: string) =>
                  splitTypeOptions.find((o) => o.value === value)?.label || value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {splitTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} label={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label={split.splitType === "PERCENT" ? "%" : "Số tiền"}
          className="col-span-7"
        >
          <Input
            type="number"
            min="0"
            step="0.01"
            value={split.splitValue}
            onChange={(e) => onChange({ splitValue: Number(e.target.value) })}
          />
        </FormField>
      </div>

      {isLast && split.splitType === "PERCENT" && totalPercent > 100 && (
        <p className="text-[10px] text-accent-red-text">Tổng tỷ lệ đang vượt quá 100%; API sẽ từ chối cấu hình này.</p>
      )}
    </div>
  );
}
