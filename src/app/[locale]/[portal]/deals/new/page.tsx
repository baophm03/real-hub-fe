"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection, FormField } from "@/components/shared/form-section";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { usePostApiDeal, getGetApiDealsQueryKey } from "@/lib/api/endpoints/deals-reservations";
import { useGetApiLeadsAdmin } from "@/lib/api/endpoints/leads";
import { txOptions } from "../_components/type";
import { DynamicFieldsSection } from "@/components/shared/dynamic-fields-section";
import { useUserStore } from "@/lib/stores/user-store";
import type { GetLeadsResponse, Lead } from "@/lib/api/types/leads";

const dealSchema = z.object({
  leadId: z.string().min(1, "Vui lòng chọn nguồn khách hàng"),
  transactionType: z.string(),
  expectedValue: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

export default function DealFormPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState("SALE");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>({});

  const currentUser = useUserStore((s) => s.user);

  const { mutateAsync: createDeal } = usePostApiDeal();

  const { data: leadsData } = useGetApiLeadsAdmin({
    status: "CONVERTED",
    limit: "100",
    offset: "0",
  });
  const leads = ((leadsData as unknown as GetLeadsResponse)?.data) || [];

  const leadItems = useMemo(() => {
    const map: Record<string, string> = { __none__: "— Không chọn —" };
    for (const l of leads) {
      const parts = [l.leadCode, l.customer?.fullName, l.property?.title].filter(Boolean);
      map[l.id] = parts.join(" · ");
    }
    return map;
  }, [leads]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: { transactionType: "SALE" },
  });

  const handleSelectLead = (v: string | null) => {
    const val = (v ?? "") === "__none__" ? "" : (v ?? "");
    setSelectedLeadId(val);
    setValue("leadId", val);
    const lead = leads.find((l) => l.id === val) ?? null;
    setSelectedLead(lead);
  };

  const onSubmit = async (data: DealFormData) => {
    if (!selectedLead) {
      toast.error("Vui lòng chọn nguồn khách hàng");
      return;
    }
    setLoading(true);
    try {
      await createDeal({
        data: {
          propertyId: selectedLead.property?.id ?? "",
          transactionType: data.transactionType,
          customerId: selectedLead.customer?.id || undefined,
          leadId: selectedLead.id,
          expectedValue: data.expectedValue || undefined,
          salesUserId: currentUser?.id,
          dynamicValuesJson: Object.keys(dynamicValues).length > 0 ? dynamicValues : undefined,
        } as any,
      });
      toast.success("Đã tạo giao dịch mới");
      void queryClient.invalidateQueries({ queryKey: getGetApiDealsQueryKey() });
      router.refresh();
      router.push(portalPath("/deals"));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi tạo giao dịch, vui lòng thử lại");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(portalPath("/deals"))}
          className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <PageHeader eyebrow="Giao dịch" title="Tạo giao dịch" />
      </div>

      {leads.length === 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm">
          <p className="font-medium text-yellow-700">Chưa có nguồn khách hàng nào ở trạng thái "Đã chuyển đổi"</p>
          <p className="text-foreground-muted mt-1">
            Vui lòng chuyển nguồn khách hàng sang trạng thái đã chuyển đổi ở trang Nguồn khách hàng trước khi tạo deal.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormSection title="Thông tin giao dịch">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Loại giao dịch" required>
              <Select
                value={selectedTx}
                items={Object.fromEntries(txOptions.map((o) => [o.value, o.label]))}
                onValueChange={(v) => {
                  if (v) {
                    setSelectedTx(v);
                    setValue("transactionType", v as DealFormData["transactionType"]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại giao dịch" />
                </SelectTrigger>
                <SelectContent>
                  {txOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Giá trị dự kiến (VND)" htmlFor="expectedValue">
              <Input id="expectedValue" placeholder="5000000000" {...register("expectedValue")} />
            </FormField>
          </div>
          <FormField label="Nguồn khách hàng" required error={errors.leadId?.message}>
            <Select
              value={selectedLeadId || "__none__"}
              items={leadItems}
              onValueChange={handleSelectLead}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn nguồn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" label="— Không chọn —">— Không chọn —</SelectItem>
                {leads.map((l) => {
                  const parts = [l.leadCode, l.customer?.fullName, l.property?.title].filter(Boolean);
                  const label = parts.join(" · ");
                  return (
                    <SelectItem key={l.id} value={l.id} label={label}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </FormField>
        </FormSection>

        {selectedLead && (
          <FormSection title="Thông tin từ nguồn khách hàng">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  <User size={14} />
                  Khách hàng
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {selectedLead.customer?.fullName ?? "—"}
                  </p>
                  {selectedLead.customer?.phone && (
                    <p className="text-xs text-foreground-muted">{selectedLead.customer.phone}</p>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  <Building2 size={14} />
                  Bất động sản
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {selectedLead.property?.title ?? "—"}
                  </p>
                  {selectedLead.property?.propertyCode && (
                    <p className="text-xs text-foreground-muted">#{selectedLead.property.propertyCode}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Mã nguồn</p>
                <p className="mt-1 text-sm font-medium tabular-nums">{selectedLead.leadCode}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Nguồn</p>
                <p className="mt-1 text-sm font-medium">{selectedLead.source}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Sales phụ trách</p>
                <p className="mt-1 text-sm font-medium">
                  {selectedLead.assignedSales?.fullName ?? "—"}
                </p>
              </div>
            </div>
          </FormSection>
        )}

        <DynamicFieldsSection
          entityType="DEAL"
          initialValues={dynamicValues}
          onChange={setDynamicValues}
        />

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push(portalPath("/deals"))}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading || !selectedLead}>
            {loading ? "Đang lưu..." : "Lưu giao dịch"}
          </Button>
        </div>
      </form>
    </div>
  );
}
