"use client";

import { useState } from "react";
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
import { usePostApiCustomer } from "@/lib/api/endpoints/customers";

const customerSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  types: z.array(z.string()).optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomerFormPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("BUYER");

  const { mutateAsync: createCustomer } = usePostApiCustomer();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { types: ["BUYER"] },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    try {
      await createCustomer({
        data: {
          fullName: data.fullName,
          phone: data.phone || undefined,
          email: data.email || undefined,
          types: data.types,
        },
      });
      toast.success("Đã tạo khách hàng mới");
      router.refresh();
      router.push(portalPath("/customers"));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra, vui lòng thử lại");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(portalPath("/customers"))} className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted" aria-label="Quay lại">
          <ArrowLeft size={20} />
        </button>
        <PageHeader eyebrow="CRM" title="Thêm khách hàng" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormSection title="Thông tin khách hàng">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Họ và tên" htmlFor="fullName" required error={errors.fullName?.message}>
              <Input id="fullName" placeholder="Nguyễn Văn An" {...register("fullName")} />
            </FormField>
            <FormField label="Số điện thoại" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" placeholder="0901234567" {...register("phone")} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" placeholder="an.nguyen@realhub.vn" {...register("email")} />
            </FormField>
            <FormField label="Loại khách hàng">
              <Select
                value={selectedType}
                items={{
                  BUYER: "Người mua",
                  SELLER: "Người bán",
                  TENANT: "Người thuê",
                  LANDLORD: "Cho thuê",
                  INVESTOR: "Nhà đầu tư",
                }}
                onValueChange={(v) => {
                  if (v) {
                    setSelectedType(v);
                    setValue("types", [v]);
                  }
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUYER" label="Người mua">Người mua</SelectItem>
                  <SelectItem value="SELLER" label="Người bán">Người bán</SelectItem>
                  <SelectItem value="TENANT" label="Người thuê">Người thuê</SelectItem>
                  <SelectItem value="LANDLORD" label="Cho thuê">Cho thuê</SelectItem>
                  <SelectItem value="INVESTOR" label="Nhà đầu tư">Nhà đầu tư</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </FormSection>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push(portalPath("/customers"))}>Hủy</Button>
          <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</Button>
        </div>
      </form>
    </div>
  );
}
