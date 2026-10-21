"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalPath } from "@/lib/hooks/use-portal";
import {
  ArrowLeft,
  Clock,
  House,
  Info,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Ruler,
  SquareKanban,
  Tag,
  User,
  Users,
} from "lucide-react";
import { formatBudget, formatPrice } from "@/utils";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useGetApiCustomerId,
  usePatchApiCustomer,
  getGetApiCustomerIdQueryKey,
} from "@/lib/api/endpoints/customers";
import type { UpdateCustomerDtoStatus } from "@/lib/api/models/updateCustomerDtoStatus";

interface CustomerType {
  id: string;
  type: string;
}

interface CustomerNeed {
  id: string;
  purpose: string;
  budgetMin?: string;
  budgetMax?: string;
  propertyType?: { id: string; name: string };
  province?: { id: string; name: string };
  district?: { id: string; name: string };
  bedrooms?: number;
  status: string;
  createdAt: string;
}

interface Lead {
  id: string;
  leadCode?: string;
  status: string;
  source?: string;
  property?: {
    id: string;
    title: string;
    propertyCode: string;
    transactionType: string;
    price: string;
    area: number;
    province?: { id: string; name: string };
    district?: { id: string; name: string };
  };
  createdAt: string;
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
  needs?: CustomerNeed[];
  leads?: Lead[];
  createdAt?: string;
  updatedAt?: string;
}

const typeLabel: Record<string, string> = {
  BUYER: "Người mua",
  SELLER: "Người bán",
  TENANT: "Người thuê",
  LANDLORD: "Cho thuê",
  INVESTOR: "Nhà đầu tư",
};

const statusLabel: Record<string, { label: string; variant: "green" | "default" | "red" }> = {
  ACTIVE: { label: "Hoạt động", variant: "green" },
  INACTIVE: { label: "Không hoạt động", variant: "default" },
  BLACKLISTED: { label: "Blacklist", variant: "red" },
};

const customerStatusOptions: { value: UpdateCustomerDtoStatus; label: string }[] = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Không hoạt động" },
  { value: "BLACKLISTED", label: "Blacklist" },
];

const purposeLabel: Record<string, string> = {
  BUY: "Mua",
  RENT: "Thuê",
  INVEST: "Đầu tư",
  SELL: "Bán",
  LEASE_OUT: "Cho thuê",
};

const txLabel: Record<string, string> = {
  SALE: "Bán",
  RENT: "Cho thuê",
  TRANSFER: "Chuyển nhượng",
  INVESTMENT: "Đầu tư",
};

const leadStatusLabel: Record<string, { label: string; variant: "blue" | "yellow" | "purple" | "default" | "green" | "red" }> = {
  NEW: { label: "Mới", variant: "blue" },
  CONTACTED: { label: "Đã liên hệ", variant: "yellow" },
  INTERESTED: { label: "Quan tâm", variant: "purple" },
  NEGOTIATING: { label: "Đàm phán", variant: "default" },
  CONVERTED: { label: "Chuyển đổi", variant: "green" },
  LOST: { label: "Mất", variant: "red" },
};



export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const portalPath = usePortalPath();
  const id = params.id as string;
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<UpdateCustomerDtoStatus>("ACTIVE");

  const { data: customerData, isLoading } = useGetApiCustomerId(id);
  const customer = (customerData as unknown as { data: Customer })?.data;

  const { mutateAsync: patchCustomer, isPending: isUpdatingStatus } = usePatchApiCustomer();

  const openStatusDialog = () => {
    setSelectedStatus(((customer?.status as UpdateCustomerDtoStatus) || "ACTIVE"));
    setStatusOpen(true);
  };

  const handleStatusChange = async () => {
    if (!customer) return;
    if (selectedStatus === (customer.status as UpdateCustomerDtoStatus)) {
      setStatusOpen(false);
      return;
    }
    try {
      await patchCustomer({ id, data: { status: selectedStatus } });
      await queryClient.invalidateQueries({ queryKey: getGetApiCustomerIdQueryKey(id) });
      toast.success(
        `Đã đổi trạng thái khách hàng "${customer.user?.fullName || customer.fullName || ""}" thành "${statusLabel[selectedStatus]?.label ?? selectedStatus}"`,
      );
      setStatusOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Đổi trạng thái thất bại");
      console.error(err);
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

  if (!customer) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(portalPath("/customers"))} className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted" aria-label="Quay lại">
            <ArrowLeft size={20} />
          </button>
          <PageHeader eyebrow="CRM" title="Không tìm thấy" />
        </div>
      </div>
    );
  }

  const statusCfg = statusLabel[customer.status] ?? { label: customer.status, variant: "default" as const };
  const displayName = customer.user?.fullName || customer.fullName || "—";
  const displayPhone = customer.user?.phone || customer.phone || "—";
  const displayEmail = customer.user?.email || customer.email || "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(portalPath("/customers"))} className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted" aria-label="Quay lại">
            <ArrowLeft size={20} />
          </button>
          <PageHeader
            eyebrow="CRM"
            title={displayName}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(portalPath(`/customers/${id}/edit`))}>
            <Pencil size={16} />
            Chỉnh sửa
          </Button>
          <Button variant="secondary" onClick={openStatusDialog}>
            <RefreshCw size={16} />
            Đổi trạng thái
          </Button>
        </div>
      </div>

      {/* Overview */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-foreground-muted" />
          <h3 className="text-sm font-semibold">Thông tin cơ bản</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue text-accent-blue-text">
              <User size={16} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs text-foreground-muted">Họ và tên</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-yellow text-accent-yellow-text">
              <Phone size={16} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm tabular-nums">{displayPhone}</span>
              <span className="text-xs text-foreground-muted">Điện thoại</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-green text-accent-green-text">
              <Mail size={16} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm">{displayEmail}</span>
              <span className="text-xs text-foreground-muted">Email</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
              <Tag size={16} />
            </span>
            <div className="flex flex-col">
              <Badge variant={statusCfg.variant} className="w-fit text-[10px]">
                {statusCfg.label}
              </Badge>
              <span className="text-xs text-foreground-muted">Trạng thái</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-purple text-accent-purple-text">
              <Users size={16} />
            </span>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-1">
                {customer.types && customer.types.length > 0 ? (
                  customer.types.map((t) => (
                    <Badge key={t.id} variant="blue" className="text-[10px]">
                      {typeLabel[t.type] ?? t.type}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm">—</span>
                )}
              </div>
              <span className="text-xs text-foreground-muted">Loại khách</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
              <Clock size={16} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm tabular-nums">
                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("vi-VN") : "—"}
              </span>
              <span className="text-xs text-foreground-muted">Ngày tạo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Needs */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <House size={16} className="text-foreground-muted" />
          <h3 className="text-sm font-semibold">Nhu cầu khách hàng</h3>
          <Badge variant="secondary">{customer.needs?.length ?? 0}</Badge>
        </div>
        {customer.needs && customer.needs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {customer.needs.map((need) => (
              <div key={need.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple">{purposeLabel[need.purpose] ?? need.purpose}</Badge>
                    {need.status && need.status !== "ACTIVE" && (
                      <Badge variant="default" className="text-[10px]">{need.status}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-foreground-muted">
                      {new Date(need.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <span className="text-xs text-foreground-muted">Ngân sách</span>
                    <p className="font-medium tabular-nums">{formatBudget(need.budgetMin, need.budgetMax)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-foreground-muted">Loại BĐS</span>
                    <p className="font-medium">{need.propertyType?.name ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-foreground-muted">Khu vực</span>
                    <p className="font-medium">
                      {[need.district?.name, need.province?.name].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-foreground-muted">Phòng ngủ</span>
                    <p className="font-medium tabular-nums">{need.bedrooms ?? "—"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">Chưa có nhu cầu nào được ghi nhận</p>
        )}
      </div>

      {/* Recent Leads */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <SquareKanban size={16} className="text-foreground-muted" />
          <h3 className="text-sm font-semibold">Nguồn khách hàng</h3>
          <Badge variant="secondary">{customer.leads?.length ?? 0}</Badge>
        </div>
        {customer.leads && customer.leads.length > 0 ? (
          <div className="flex flex-col gap-2">
            {customer.leads.map((lead) => {
              const statusCfg = leadStatusLabel[lead.status] ?? { label: lead.status, variant: "default" as const };
              const location = [lead.property?.district?.name, lead.property?.province?.name]
                .filter(Boolean)
                .join(", ");
              return (
                <button
                  key={lead.id}
                  onClick={() => router.push(portalPath(`/leads/${lead.id}`))}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted/40 p-4 text-left transition-colors hover:bg-surface-muted"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{lead.property?.title}</span>
                      <span className="font-mono text-xs text-foreground-muted">
                        #{lead.property?.propertyCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      <span className="text-xs tabular-nums text-foreground-muted">
                        {new Date(lead.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                  {lead.property && (
                    <div className="flex flex-col gap-1 border-t border-border pt-2">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted">
                        <Badge variant="blue">{txLabel[lead.property.transactionType] ?? lead.property.transactionType}</Badge>
                        {lead.property.price && (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Tag size={12} aria-hidden="true" />
                            {formatPrice(lead.property.price)}
                          </span>
                        )}
                        {lead.property.area && (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Ruler size={12} aria-hidden="true" />
                            {lead.property.area} m²
                          </span>
                        )}
                        {location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} aria-hidden="true" />
                            {location}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">Chưa có nguồn khách hàng nào</p>
        )}
      </div>

      {/* Status dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Đổi trạng thái khách hàng</DialogTitle>
              <DialogDescription>
                Chọn trạng thái mới cho khách hàng này.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-surface-muted/40 p-4 text-sm">
                <p className="font-medium">{displayName}</p>
                {displayPhone !== "—" && (
                  <p className="text-foreground-muted tabular-nums">{displayPhone}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-foreground-muted">Hiện tại</span>
                  <Badge variant={statusCfg.variant} className="text-[10px]">
                    {statusCfg.label}
                  </Badge>
                </div>
              </div>
              <Select
                value={selectedStatus}
                items={customerStatusOptions}
                onValueChange={(v) => {
                  if (v) setSelectedStatus(v as UpdateCustomerDtoStatus);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerStatusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusOpen(false)} disabled={isUpdatingStatus}>
                Hủy
              </Button>
              <Button loading={isUpdatingStatus} onClick={handleStatusChange}>
                Lưu trạng thái
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
