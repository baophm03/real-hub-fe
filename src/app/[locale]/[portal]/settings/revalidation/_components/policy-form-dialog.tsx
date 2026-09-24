"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useGetApiPropertyTypes } from "@/lib/api/endpoints/properties";
import { CreateRevalidationPolicyDtoSellingMode } from "@/lib/api/models/createRevalidationPolicyDtoSellingMode";
import { sellingModeLabel, defaultPolicyForm, type PolicyFormValues } from "./types";

interface PropertyType {
  id: string;
  name: string;
  code?: string;
}

const sellingModeOptions = Object.entries(CreateRevalidationPolicyDtoSellingMode).map(([k]) => ({
  value: k,
  label: sellingModeLabel[k] ?? k,
}));

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  submitLabel: string;
  isSubmitting: boolean;
  isEdit?: boolean;
  initial: PolicyFormValues | null;
  onSubmit: (v: PolicyFormValues) => Promise<void>;
}

export function PolicyFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  isSubmitting,
  isEdit = false,
  initial,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<PolicyFormValues>(initial ?? defaultPolicyForm);

  const { data: propertyTypesData } = useGetApiPropertyTypes();
  const propertyTypes: PropertyType[] = ((propertyTypesData as any)?.data as PropertyType[]) || [];

  // Sync khi mở edit
  if (open && initial && form.propertyTypeId !== initial.propertyTypeId && form.revalidateAfterDays === defaultPolicyForm.revalidateAfterDays) {
    setForm(initial);
  }

  const close = () => {
    setForm(defaultPolicyForm);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? close() : onOpenChange(o))}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Quy định chu kỳ revalidate BĐS công khai và thời hạn phản hồi của task.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              await onSubmit(form);
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wide text-foreground-muted">Loại BĐS</label>
                <Select
                  value={form.propertyTypeId}
                  onValueChange={(v) => setForm({ ...form, propertyTypeId: (v as string) ?? "" })}
                  disabled={isEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mọi loại BĐS">
                      {(value: string) =>
                        propertyTypes.find((t) => t.id === value)?.name ?? "Mọi loại BĐS"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id} label={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wide text-foreground-muted">Selling mode</label>
                <Select
                  value={form.sellingMode}
                  onValueChange={(v) => setForm({ ...form, sellingMode: (v as string) ?? "" })}
                  disabled={isEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mọi selling mode">
                      {(value: string) =>
                        sellingModeOptions.find((o) => o.value === value)?.label ?? "Mọi selling mode"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sellingModeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value} label={o.label}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wide text-foreground-muted">
                  Revalidate sau (ngày)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.revalidateAfterDays}
                  onChange={(e) =>
                    setForm({ ...form, revalidateAfterDays: Number(e.target.value) })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wide text-foreground-muted">
                  Hết hạn task sau (ngày)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.expireIfNoResponseDays}
                  onChange={(e) =>
                    setForm({ ...form, expireIfNoResponseDays: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {isEdit && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wide text-foreground-muted">Trạng thái</label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: (v as string) ?? "ACTIVE" })}
                >
                  <SelectTrigger>
                    <SelectValue>{(value: string) => value || form.status}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {["ACTIVE", "DRAFT", "ARCHIVED"].map((s) => (
                      <SelectItem key={s} value={s} label={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
