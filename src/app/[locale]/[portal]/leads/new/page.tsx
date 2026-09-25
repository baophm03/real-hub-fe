"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { usePostApiLead } from "@/lib/api/endpoints/leads";
import { useGetApiCustomers } from "@/lib/api/endpoints/customers";
import { useGetApiPropertiesAdmin } from "@/lib/api/endpoints/properties";
import { useGetApiWorkflows, useGetApiWorkflowIdStates } from "@/lib/api/endpoints/workflow";
import { DynamicFieldsSection } from "@/components/shared/dynamic-fields-section";
import type { CreateLeadDtoStatus } from "@/lib/api/models/createLeadDtoStatus";
import { sourceOptions, type Customer, type Property, type WorkflowState } from "../_components/type";

const leadSchema = z.object({
  customerId: z.string().optional(),
  propertyId: z.string().optional(),
  source: z.enum(["WEBSITE", "PROPERTY_DETAIL", "OWNER_PAGE", "SALES_LINK", "CTV_LINK", "AGENCY_MARKETING", "MANUAL_INPUT", "LEAD_POOL", "IMPORT"]),
  status: z.string(),
  phoneNormalized: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function LeadFormPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState("MANUAL_INPUT");
  const [selectedStatus, setSelectedStatus] = useState("NEW");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>({});

  const { mutateAsync: createLead } = usePostApiLead();

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

  const statusOptions = statusStates.map((s) => ({
    value: s.stateName,
    label: s.stateName,
  }));

  const { data: customersData } = useGetApiCustomers({ limit: "100", offset: "0" });
  const customers = ((customersData as unknown as { data: Customer[] })?.data) || [];

  const { data: propertiesData } = useGetApiPropertiesAdmin({ limit: "100", offset: "0" });
  const properties = ((propertiesData as unknown as { data: Property[] })?.data) || [];

  const customerItems = useMemo(() => {
    const map: Record<string, string> = { __none__: "— Không chọn —" };
    for (const c of customers) {
      map[c.id] = `${c.fullName}${c.phone ? ` · ${c.phone}` : ""}`;
    }
    return map;
  }, [customers]);

  const propertyItems = useMemo(() => {
    const map: Record<string, string> = { __none__: "— Không chọn —" };
    for (const p of properties) {
      map[p.id] = `${p.title} (#${p.propertyCode})`;
    }
    return map;
  }, [properties]);

  const { register, handleSubmit, setValue } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { source: "MANUAL_INPUT", status: "NEW" },
  });

  // Default status = initial workflow state
  useEffect(() => {
    const initial = statusStates.find((s) => s.isInitial) ?? statusStates[0];
    if (initial) {
      setSelectedStatus(initial.stateName);
      setValue("status", initial.stateName);
    }
  }, [statusStates, setValue]);

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true);
    try {
      await createLead({
        data: {
          source: data.source,
          status: data.status as CreateLeadDtoStatus,
          customerId: data.customerId || undefined,
          propertyId: data.propertyId || undefined,
          phoneNormalized: data.phoneNormalized || undefined,
          dynamicValuesJson: Object.keys(dynamicValues).length > 0 ? dynamicValues : undefined,
        },
      });
      toast.success("Đã tạo nguồn khách hàng mới");
      router.refresh();
      router.push(portalPath("/leads"));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi tạo nguồn khách hàng, vui lòng thử lại");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(portalPath("/leads"))}
          className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <PageHeader eyebrow="CRM" title="Thêm nguồn khách hàng" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormSection title="Thông tin nguồn khách hàng">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Khách hàng">
              <Select
                value={selectedCustomerId || "__none__"}
                items={customerItems}
                onValueChange={(v) => {
                  const val = (v ?? "") === "__none__" ? "" : (v ?? "");
                  setSelectedCustomerId(val);
                  setValue("customerId", val || undefined);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" label="— Không chọn —">— Không chọn —</SelectItem>
                  {customers.map((c) => {
                    const label = `${c.fullName}${c.phone ? ` · ${c.phone}` : ""}`;
                    return (
                      <SelectItem key={c.id} value={c.id} label={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="BĐS quan tâm">
              <Select
                value={selectedPropertyId || "__none__"}
                items={propertyItems}
                onValueChange={(v) => {
                  const val = (v ?? "") === "__none__" ? "" : (v ?? "");
                  setSelectedPropertyId(val);
                  setValue("propertyId", val || undefined);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn BĐS" />
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
            <FormField label="Nguồn" required>
              <Select
                value={selectedSource}
                items={Object.fromEntries(sourceOptions.map((o) => [o.value, o.label]))}
                onValueChange={(v) => {
                  if (v) {
                    setSelectedSource(v);
                    setValue("source", v as LeadFormData["source"]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn nguồn" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Trạng thái">
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
          </div>

          <FormField label="Số điện thoại" htmlFor="phoneNormalized">
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
          <Button type="button" variant="secondary" onClick={() => router.push(portalPath("/leads"))}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu nguồn khách hàng"}
          </Button>
        </div>
      </form>
    </div>
  );
}
