"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useGetApiLeadId, usePatchApiLead } from "@/lib/api/endpoints/leads";
import type { UpdateLeadDtoStatus } from "@/lib/api/models/updateLeadDtoStatus";
import { DynamicFieldsSection } from "@/components/shared/dynamic-fields-section";
import { useGetApiWorkflows, useGetApiWorkflowIdStates } from "@/lib/api/endpoints/workflow";
import type { WorkflowState } from "../../_components/type";

interface Lead {
  id: string;
  leadCode: string;
  status: string;
  phoneNormalized: string | null;
  dynamicValuesJson?: Record<string, unknown> | null;
}

const leadSchema = z.object({
  status: z.string(),
  phoneNormalized: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function LeadEditPage() {
  const params = useParams();
  const router = useRouter();
  const portalPath = usePortalPath();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("NEW");
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>({});

  const { data: leadData, isLoading } = useGetApiLeadId(id);
  const lead = (leadData as unknown as { data: Lead })?.data;

  const { mutateAsync: updateLead } = usePatchApiLead();

  // Active LEAD workflow → status options from its states
  const { data: workflowsRaw } = useGetApiWorkflows({
    entityType: "LEAD" as any,
    status: "ACTIVE" as any,
  });
  const workflows = Array.isArray(workflowsRaw)
    ? workflowsRaw
    : ((workflowsRaw as any)?.data ?? []);
  const leadWorkflow = workflows[0];

  const { data: wfStatesRaw } = useGetApiWorkflowIdStates(leadWorkflow?.id ?? "", {
    query: { enabled: !!leadWorkflow },
  });
  const statusStates = useMemo(() => {
    const states: WorkflowState[] = (Array.isArray(wfStatesRaw)
      ? wfStatesRaw
      : ((wfStatesRaw as any)?.data ?? [])
    ).filter((s: WorkflowState) => s.columnName === "status");
    return states
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [wfStatesRaw]);

  const statusOptions = useMemo(() => {
    const opts = statusStates.map((s) => ({ value: s.stateName, label: s.stateName }));
    if (lead?.status && !opts.some((o) => o.value === lead.status)) {
      return [...opts, { value: lead.status, label: lead.status }];
    }
    return opts;
  }, [statusStates, lead?.status]);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { status: "NEW", phoneNormalized: "" },
  });

  useEffect(() => {
    if (lead) {
      reset({
        status: (lead.status as LeadFormData["status"]) || "NEW",
        phoneNormalized: lead.phoneNormalized || "",
      });
      setSelectedStatus(lead.status || "NEW");
      setDynamicValues(lead.dynamicValuesJson || {});
    }
  }, [lead, reset]);

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true);
    try {
      await updateLead({
        id,
        data: {
          status: data.status as UpdateLeadDtoStatus,
          phoneNormalized: data.phoneNormalized || undefined,
          dynamicValuesJson: Object.keys(dynamicValues).length > 0 ? dynamicValues : undefined,
        },
      });
      toast.success("Đã cập nhật nguồn khách hàng");
      router.refresh();
      router.push(portalPath(`/leads/${id}`));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi cập nhật nguồn khách hàng, vui lòng thử lại");
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
          onClick={() => router.push(portalPath(`/leads/${id}`))}
          className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <PageHeader eyebrow="CRM" title={`Chỉnh sửa nguồn khách hàng ${lead?.leadCode ?? ""}`} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormSection
          title="Thông tin nguồn khách hàng"
          description="Cập nhật trạng thái và số điện thoại."
        >
          <FormField label="Trạng thái" required>
            <Select
              value={selectedStatus}
              items={Object.fromEntries(statusOptions.map((o) => [o.value, o.label]))}
              onValueChange={(v) => {
                if (v) {
                  setSelectedStatus(v);
                  setValue("status", v as LeadFormData["status"]);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} label={o.label}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Số điện thoại" htmlFor="phoneNormalized" error={errors.phoneNormalized?.message}>
            <Input
              id="phoneNormalized"
              placeholder="0901234567"
              {...register("phoneNormalized")}
            />
          </FormField>
        </FormSection>

        <DynamicFieldsSection
          entityType="LEAD"
          initialValues={dynamicValues}
          onChange={setDynamicValues}
        />

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push(portalPath(`/leads/${id}`))}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : "Cập nhật nguồn khách hàng"}
          </Button>
        </div>
      </form>
    </div>
  );
}
