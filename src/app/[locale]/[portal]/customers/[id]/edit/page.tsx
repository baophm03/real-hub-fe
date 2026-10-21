"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
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
import { useGetApiCustomerId, usePatchApiCustomer } from "@/lib/api/endpoints/customers";
import type { UpdateCustomerDtoStatus } from "@/lib/api/models/updateCustomerDtoStatus";

interface CustomerType {
  id: string;
  type: string;
}

interface Customer {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  userId?: string | null;
  user?: {
    id: string;
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  status: string;
  types?: CustomerType[];
}

const typeOptions = [
  { value: "BUYER", label: "Người mua" },
  { value: "SELLER", label: "Người bán" },
  { value: "TENANT", label: "Người thuê" },
  { value: "LANDLORD", label: "Cho thuê" },
  { value: "INVESTOR", label: "Nhà đầu tư" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Không hoạt động" },
  { value: "BLACKLISTED", label: "Blacklist" },
];

const customerSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  status: z.custom<UpdateCustomerDtoStatus>(),
  types: z.array(z.string()).optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomerEditPage() {
  const params = useParams();
  const router = useRouter();
  const portalPath = usePortalPath();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("BUYER");
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");

  const { data: customerData, isLoading } = useGetApiCustomerId(id);
  const customer = (customerData as unknown as { data: Customer })?.data;

  // Khách hàng đã liên kết tài khoản người dùng -> họ tên/SĐT/email thuộc về tài khoản đó
  const hasLinkedUser = Boolean(customer?.userId ?? customer?.user?.id);

  const { mutateAsync: updateCustomer } = usePatchApiCustomer();

  const { register, handleSubmit, setValue, getValues, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { status: "ACTIVE", types: ["BUYER"] },
  });

  useEffect(() => {
    if (customer) {
      const firstType = customer.types?.[0]?.type ?? "BUYER";
      const status = (customer.status || "ACTIVE") as UpdateCustomerDtoStatus;
      reset({
        fullName: customer.user?.fullName || customer.fullName || "",
        phone: customer.user?.phone || customer.phone || "",
        email: customer.user?.email || customer.email || "",
        status,
        types: customer.types?.map((t) => t.type) || [firstType],
      });
      setSelectedType(firstType);
      setSelectedStatus(customer.status || "ACTIVE");
    }
  }, [customer, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    try {
      await updateCustomer({
        id,
        data: {
          ...(hasLinkedUser
            ? {}
            : {
                fullName: data.fullName,
                phone: data.phone || undefined,
                email: data.email || undefined,
              }),
          status: data.status,
          types: data.types,
        },
      });
      toast.success("Đã cập nhật khách hàng");
      router.refresh();
      router.push(portalPath(`/customers/${id}`));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi cập nhật, vui lòng thử lại");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    if (!hasLinkedUser) {
      void handleSubmit(onSubmit)(event);
      return;
    }
    // Họ tên/SĐT/email bị khoá nên bỏ qua validate cho các trường này
    event.preventDefault();
    void onSubmit({
      fullName: getValues("fullName") ?? "",
      phone: getValues("phone") ?? "",
      email: getValues("email") ?? "",
      status: selectedStatus as UpdateCustomerDtoStatus,
      types: [selectedType],
    });
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
        <button onClick={() => router.push(portalPath(`/customers/${id}`))} className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted" aria-label="Quay lại">
          <ArrowLeft size={20} />
        </button>
        <PageHeader eyebrow="CRM" title="Chỉnh sửa khách hàng" />
      </div>

      <form onSubmit={submitForm} className="flex flex-col gap-4">
        <FormSection
          title="Thông tin khách hàng"
          {...(hasLinkedUser
            ? {
                description:
                  "Khách hàng này đã liên kết tài khoản người dùng. Họ tên, số điện thoại và email được đồng bộ từ tài khoản đó nên không thể chỉnh sửa ở đây.",
              }
            : {})}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Họ và tên" htmlFor="fullName" required={!hasLinkedUser} error={errors.fullName?.message}>
              <Input id="fullName" placeholder="Nguyễn Văn An" disabled={hasLinkedUser} {...register("fullName")} />
            </FormField>
            <FormField label="Số điện thoại" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" placeholder="0901234567" disabled={hasLinkedUser} {...register("phone")} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" placeholder="an.nguyen@realhub.vn" disabled={hasLinkedUser} {...register("email")} />
            </FormField>
            <FormField label="Loại khách hàng">
              <Select
                value={selectedType}
                items={typeOptions}
                onValueChange={(v) => {
                  if (v) {
                    setSelectedType(v);
                    setValue("types", [v]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Trạng thái">
              <Select
                value={selectedStatus}
                items={statusOptions}
                onValueChange={(v) => {
                  if (v) {
                    setSelectedStatus(v);
                    setValue("status", v as UpdateCustomerDtoStatus);
                  }
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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
        </FormSection>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push(portalPath(`/customers/${id}`))}>Hủy</Button>
          <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Cập nhật"}</Button>
        </div>
      </form>
    </div>
  );
}
