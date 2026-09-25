"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Ruler,
  SquareKanban,
  Tag,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { formatBudget, formatPrice } from "@/utils";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { useGetApiCustomerId, useDeleteApiCustomer } from "@/lib/api/endpoints/customers";

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
  assignedSales?: { id: string; fullName: string };
  createdAt: string;
}

interface Customer {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
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
  const portalPath = usePortalPath();
  const id = params.id as string;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: customerData, isLoading } = useGetApiCustomerId(id);
  const customer = (customerData as unknown as { data: Customer })?.data;

  const { mutateAsync: deleteCustomer, isPending: isDeleting } = useDeleteApiCustomer();

  const handleDelete = async () => {
    try {
      await deleteCustomer({ id });
      toast.success(`Đã xóa khách hàng "${customer?.fullName}"`);
      router.refresh();
      router.push(portalPath("/customers"));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Xóa khách hàng thất bại");
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(portalPath("/customers"))} className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted" aria-label="Quay lại">
            <ArrowLeft size={20} />
          </button>
          <PageHeader
            eyebrow="CRM"
            title={customer.fullName}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(portalPath(`/customers/${id}/edit`))}>
            <Pencil size={16} />
            Chỉnh sửa
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={16} />
            Xóa
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
              <span className="text-sm font-medium">{customer.fullName}</span>
              <span className="text-xs text-foreground-muted">Họ và tên</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-yellow text-accent-yellow-text">
              <Phone size={16} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm tabular-nums">{customer.phone || "—"}</span>
              <span className="text-xs text-foreground-muted">Điện thoại</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-green text-accent-green-text">
              <Mail size={16} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm">{customer.email || "—"}</span>
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

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Xóa khách hàng</DialogTitle>
              <DialogDescription>
                Hành động này sẽ ẩn khách hàng (soft delete). Bạn có chắc chắn?
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border bg-surface-muted/40 p-4 text-sm">
              <p className="font-medium">{customer.fullName}</p>
              {customer.phone && <p className="text-foreground-muted tabular-nums">{customer.phone}</p>}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
              <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
