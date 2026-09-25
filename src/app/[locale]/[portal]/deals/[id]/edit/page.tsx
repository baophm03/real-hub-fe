"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection, FormField } from "@/components/shared/form-section";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useGetApiDealId, usePatchApiDeal, getGetApiDealsQueryKey, getGetApiDealIdQueryKey } from "@/lib/api/endpoints/deals-reservations";
import { useGetApiPropertiesAdmin } from "@/lib/api/endpoints/properties";
import { txOptions } from "../../_components/type";
import { useUserStore } from "@/lib/stores/user-store";
import type { GetPropertiesResponse } from "@/lib/api/types/properties";
import { DynamicFieldsSection } from "@/components/shared/dynamic-fields-section";

interface Deal {
  id: string;
  dealCode: string;
  status: string;
  transactionType: string;
  expectedValue?: string;
  finalValue?: string;
  currentWorkflowState?: string | null;
  property?: { id: string; title: string; propertyCode: string } | null;
  salesUser?: { id: string; fullName: string } | null;
  dynamicValuesJson?: Record<string, unknown> | null;
}

const dealSchema = z.object({
  transactionType: z.string(),
  salesUserId: z.string().optional(),
  expectedValue: z.string().optional(),
  finalValue: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

export default function DealEditPage() {
  const params = useParams();
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState("");
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>({});

  const currentUser = useUserStore((s) => s.user);

  const { data: dealData, isLoading } = useGetApiDealId(id);
  const deal = (dealData as unknown as { data: Deal })?.data;

  const { data: propertiesData } = useGetApiPropertiesAdmin();
  const properties = ((propertiesData as unknown as GetPropertiesResponse)?.data) || [];

  const propertyItems = useMemo(() => {
    const map: Record<string, string> = { __none__: "— Không chọn —" };
    for (const p of properties) {
      map[p.id] = `${p.title} (#${p.propertyCode})`;
    }
    return map;
  }, [properties]);

  const { mutateAsync: updateDeal } = usePatchApiDeal();

  const { register, handleSubmit, setValue, reset } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: { transactionType: "" },
  });

  useEffect(() => {
    if (deal) {
      const salesUserId = deal.salesUser?.id || currentUser?.id || "";
      reset({
        transactionType: deal.transactionType || "",
        salesUserId,
        expectedValue: deal.expectedValue || "",
        finalValue: deal.finalValue || "",
      });
      setSelectedTx(deal.transactionType || "");
      setDynamicValues(deal.dynamicValuesJson || {});
    }
  }, [deal, reset, currentUser]);

  const onSubmit = async (data: DealFormData) => {
    setLoading(true);
    try {
      await updateDeal({
        id,
        data: {
          transactionType: data.transactionType || undefined,
          salesUserId: data.salesUserId || undefined,
          expectedValue: data.expectedValue || undefined,
          finalValue: data.finalValue || undefined,
          dynamicValuesJson: Object.keys(dynamicValues).length > 0 ? dynamicValues : undefined,
        } as any,
      });
      toast.success("Đã cập nhật giao dịch");
      void queryClient.invalidateQueries({ queryKey: getGetApiDealIdQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: getGetApiDealsQueryKey() });
      router.refresh();
      router.push(portalPath(`/deals/${id}`));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi cập nhật giao dịch, vui lòng thử lại");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-md bg-surface-muted" />
          <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-muted" />
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(portalPath(`/deals/${id}`))}
          className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <PageHeader eyebrow="Giao dịch" title={`Chỉnh sửa giao dịch ${deal?.dealCode ?? ""}`} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormSection
          title="Thông tin giao dịch"
          description="Có thể cập nhật loại giao dịch và giá trị giao dịch."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Loại giao dịch" required>
              <Select
                value={selectedTx}
                items={Object.fromEntries(txOptions.map((o) => [o.value, o.label]))}
                onValueChange={(v) => {
                  if (v) {
                    setSelectedTx(v);
                    setValue("transactionType", v);
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
            <FormField label="Bất động sản">
              <Select
                value={deal?.property?.id || "__none__"}
                items={propertyItems}
                disabled
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Bất động sản" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" label="— Không chọn —">— Không chọn —</SelectItem>
                  {properties.map((p) => {
                    const label = `${p.title} (#${p.propertyCode})`;
                    return (
                      <SelectItem key={p.id} value={p.id} label={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Giá trị dự kiến (VND)" htmlFor="expectedValue">
              <Input id="expectedValue" placeholder="5000000000" {...register("expectedValue")} />
            </FormField>
            <FormField label="Giá trị cuối (VND)" htmlFor="finalValue">
              <Input id="finalValue" placeholder="950000000" {...register("finalValue")} />
            </FormField>
          </div>
        </FormSection>

        <DynamicFieldsSection
          entityType="DEAL"
          initialValues={dynamicValues}
          onChange={setDynamicValues}
        />

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push(portalPath(`/deals/${id}`))}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : "Cập nhật giao dịch"}
          </Button>
        </div>
      </form>
    </div>
  );
}
