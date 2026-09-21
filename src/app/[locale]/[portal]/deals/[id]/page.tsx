"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalPath } from "@/lib/hooks/use-portal";
import {
  ArrowLeft,
  Clock,
  FileText,
  House,
  Layers,
  MessageSquare,
  Pencil,
  Plus,
  SquareKanban,
  Trash2,
  User,
} from "lucide-react";
import { formatPrice } from "@/utils";
import { Can } from "@casl/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  useGetApiDealId,
  useGetApiDealActivities,
  usePatchApiDeal,
  useDeleteApiDeal,
  usePostApiDealActivity,
  useGetApiReservations,
  usePostApiReservation,
  usePatchApiApproveReservation,
  usePatchApiRejectReservation,
  getGetApiDealsQueryKey,
  getGetApiDealIdQueryKey,
} from "@/lib/api/endpoints/deals-reservations";
import type { UpdateDealDtoStatus } from "@/lib/api/models/updateDealDtoStatus";
import { DeleteDealDialog } from "./_components/delete-deal-dialog";
import { CreateReservationDialog } from "./_components/create-reservation-dialog";
import { DealWorkflowActions } from "./_components/deal-workflow-actions";
import { DynamicValuesDisplay } from "@/components/shared/dynamic-values-display";
import { useGetApiDealCommissions } from "@/lib/api/endpoints/commission";

interface DealProperty {
  id: string;
  title: string;
  propertyCode: string;
}
interface DealCustomer {
  id: string;
  fullName: string;
}
interface DealLead {
  id: string;
  leadCode: string;
}
interface DealActivity {
  id: string;
  activityType: string;
  content?: string;
  createdAt: string;
  user?: { id: string; fullName: string };
  metadataJson?: {
    actionLabel?: string;
    oldStatus?: string;
    newStatus?: string;
  } | null;
}
interface Reservation {
  id: string;
  dealId: string;
  propertyId: string;
  reservationType: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  note?: string;
  property?: DealProperty | null;
}

interface Deal {
  id: string;
  dealCode: string;
  transactionType: string;
  expectedValue?: string;
  finalValue?: string;
  status: string;
  currentWorkflowState?: string | null;
  createdAt?: string;
  dynamicValuesJson?: Record<string, unknown> | null;
  property?: DealProperty | null;
  customer?: DealCustomer | null;
  lead?: DealLead | null;
  activities?: DealActivity[];
  reservations?: Reservation[];
}

const txLabel: Record<string, string> = {
  SALE: "Bán",
  RENT: "Cho thuê",
  TRANSFER: "Chuyển nhượng",
};

const statusVariant: Record<string, "blue" | "yellow" | "purple" | "default" | "green" | "red"> = {
  SOFT_RESERVED: "blue",
  NEGOTIATING: "yellow",
  SUCCESS: "green",
  FAILED: "red",
  CANCELLED: "default",
  DISPUTED: "purple",
};

const statusBorderClass: Record<string, string> = {
  blue: "border-l-accent-blue-text",
  yellow: "border-l-accent-yellow-text",
  purple: "border-l-accent-purple-text",
  green: "border-l-accent-green-text",
  red: "border-l-accent-red-text",
  default: "border-l-foreground-muted",
};

const statusLabel: Record<string, string> = {
  SOFT_RESERVED: "Đặt cọc",
  NEGOTIATING: "Đàm phán",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Hủy",
  DISPUTED: "Tranh chấp",
};

const statusOptions = [
  { value: "SOFT_RESERVED", label: "Đặt cọc" },
  { value: "NEGOTIATING", label: "Đàm phán" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Hủy" },
  { value: "DISPUTED", label: "Tranh chấp" },
];

const activityTypeLabel: Record<string, string> = {
  NOTE: "Ghi chú",
  STATUS_CHANGE: "Đổi trạng thái",
  CALL: "Gọi điện",
  EMAIL: "Email",
  MEETING: "Gặp mặt",
  DOCUMENT: "Tài liệu",
};

const reservationTypeLabel: Record<string, string> = {
  SOFT: "Cọc mềm",
  HARD: "Cọc cứng",
};

const reservationStatusLabel: Record<string, { label: string; variant: "blue" | "green" | "default" | "red" | "yellow" }> = {
  PENDING: { label: "Chờ duyệt", variant: "yellow" },
  APPROVED: { label: "Đã duyệt", variant: "green" },
  REJECTED: { label: "Từ chối", variant: "red" },
  ACTIVE: { label: "Hoạt động", variant: "blue" },
  EXPIRED: { label: "Hết hạn", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "default" },
  CONVERTED: { label: "Đã chuyển", variant: "green" },
};

const commissionStatusVariant: Record<string, "default" | "green" | "yellow" | "blue" | "red"> = {
  DRAFT: "default",
  ESTIMATED: "blue",
  CONFIRMED: "yellow",
  APPROVED: "green",
  PAID: "green",
  DISPUTED: "red",
  CANCELLED: "default",
};

const commissionStatusLabel: Record<string, string> = {
  DRAFT: "Nháp",
  ESTIMATED: "Đã ước tính",
  CONFIRMED: "Đã xác nhận",
  APPROVED: "Đã duyệt",
  PAID: "Đã thanh toán",
  DISPUTED: "Tranh chấp",
  CANCELLED: "Đã hủy",
};

const formatVnd = (v: string | null | undefined) => {
  if (!v) return "—";
  const n = Number(v);
  if (isNaN(n)) return v;
  return n.toLocaleString("vi-VN") + " ₫";
};

function DealCommissionsSection({ dealId }: { dealId: string }) {
  const router = useRouter();
  const portalPath = usePortalPath();
  const { data: dcsData, isLoading } = useGetApiDealCommissions(
    { dealId, status: undefined },
  );
  const dcs = ((dcsData as unknown as { data: any[] })?.data) || [];

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Hoa hồng</h3>
          <Badge variant="default" className="text-[10px]">{dcs.length}</Badge>
        </div>
        <Can I="CREATE" a="COMMISSION">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(portalPath(`/commission/deals/new?dealId=${dealId}`))}
          >
            <Plus size={14} className="mr-1" />
            Tạo ước tính
          </Button>
        </Can>
      </div>

      {isLoading ? (
        <p className="text-xs text-foreground-muted py-2">Đang tải...</p>
      ) : dcs.length === 0 ? (
        <p className="text-xs text-foreground-muted py-2">
          Chưa có hoa hồng nào cho giao dịch này.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {dcs.map((dc) => (
            <button
              key={dc.id}
              onClick={() => router.push(portalPath(`/commission/deals/${dc.id}`))}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/40 px-3 py-2 text-left transition-colors hover:border-foreground/20 hover:bg-surface-muted/50"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {dc.plan?.name ?? "—"}
                </span>
                <span className="text-[10px] text-foreground-muted">
                  ước tính: {formatVnd(dc.totalCommissionEstimated)} · thực tế: {formatVnd(dc.totalCommissionConfirmed)}
                </span>
              </div>
              <Badge variant={commissionStatusVariant[dc.status] ?? "default"} className="text-[10px]">
                {commissionStatusLabel[dc.status] ?? dc.status}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activityType, setActivityType] = useState("NOTE");
  const [activityContent, setActivityContent] = useState("");
  const [resvOpen, setResvOpen] = useState(false);

  const { data: dealData, isLoading, refetch } = useGetApiDealId(id);
  const deal = (dealData as unknown as { data: Deal })?.data;

  const { data: activitiesData, refetch: refetchActivities } = useGetApiDealActivities(id);
  const activities = ((activitiesData as unknown as { data: DealActivity[] })?.data) || [];

  const { data: reservationsData, refetch: refetchReservations } = useGetApiReservations({
    dealId: id,
    limit: "50",
    offset: "0",
  });
  const reservations = ((reservationsData as unknown as { data: Reservation[] })?.data) || [];

  const { mutateAsync: updateDeal, isPending: isUpdating } = usePatchApiDeal();
  const { mutateAsync: deleteDeal, isPending: isDeleting } = useDeleteApiDeal();
  const { mutateAsync: addActivity, isPending: isAddingActivity } = usePostApiDealActivity();
  const { mutateAsync: createReservation, isPending: isCreatingResv } = usePostApiReservation();
  const { mutateAsync: approveReservation } = usePatchApiApproveReservation();
  const { mutateAsync: rejectReservation } = usePatchApiRejectReservation();

  const handleStatusChange = async (newStatus: string) => {
    if (!deal || deal.status === newStatus) return;
    try {
      await updateDeal({ id, data: { status: newStatus as UpdateDealDtoStatus } });
      toast.success("Đã cập nhật trạng thái");
      void queryClient.invalidateQueries({ queryKey: getGetApiDealIdQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: getGetApiDealsQueryKey() });
      refetch();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Cập nhật trạng thái thất bại");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal({ id });
      toast.success(`Đã xóa giao dịch "${deal?.dealCode}"`);
      void queryClient.invalidateQueries({ queryKey: getGetApiDealsQueryKey() });
      router.refresh();
      router.push(portalPath("/deals"));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Xóa giao dịch thất bại");
      console.error(err);
    }
  };

  const handleAddActivity = async () => {
    if (!activityContent.trim()) return;
    try {
      await addActivity({
        id,
        data: {
          activityType: activityType as any,
          content: activityContent,
        },
      });
      toast.success("Đã thêm hoạt động");
      setActivityContent("");
      refetchActivities();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Thêm hoạt động thất bại");
      console.error(err);
    }
  };

  const handleCreateReservation = async (data: {
    reservationType: string;
    startsAt: string;
    expiresAt: string;
    note?: string;
  }) => {
    if (!deal || !data.startsAt || !data.expiresAt) return;
    try {
      await createReservation({
        data: {
          dealId: deal.id,
          propertyId: deal.property?.id ?? "",
          customerId: deal.customer?.id || undefined,
          reservationType: data.reservationType as any,
          startsAt: data.startsAt,
          expiresAt: data.expiresAt,
          note: data.note || undefined,
        },
      });
      toast.success("Đã tạo đặt cọc");
      setResvOpen(false);
      refetchReservations();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Tạo đặt cọc thất bại");
      console.error(err);
    }
  };

  const handleApprove = async (resvId: string) => {
    try {
      await approveReservation({ id: resvId });
      toast.success("Đã duyệt đặt cọc");
      refetchReservations();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Duyệt đặt cọc thất bại");
      console.error(err);
    }
  };

  const handleReject = async (resvId: string) => {
    try {
      await rejectReservation({ id: resvId });
      toast.success("Đã từ chối đặt cọc");
      refetchReservations();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Từ chối đặt cọc thất bại");
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

  if (!deal) {
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
          <PageHeader eyebrow="Giao dịch" title="Không tìm thấy" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(portalPath("/deals"))}
            className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted"
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} />
          </button>
          <PageHeader eyebrow="Giao dịch" title={deal.dealCode} />
        </div>
        <div className="flex items-center gap-2">
          <Can I="UPDATE_OWN" a="DEAL">
            <Button variant="outline" onClick={() => router.push(portalPath(`/deals/${id}/edit`))}>
              <Pencil size={16} />
              Chỉnh sửa
            </Button>
          </Can>
          <Can I="DELETE_OWN" a="DEAL">
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
              Xóa
            </Button>
          </Can>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="blue">{txLabel[deal.transactionType] ?? deal.transactionType}</Badge>
              <Badge variant={statusVariant[deal.status] ?? "default"}>
                {statusLabel[deal.status] ?? deal.status}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <SquareKanban size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Mã giao dịch</span>
                  <span className="text-sm font-medium tabular-nums">{deal.dealCode}</span>
                </div>
              </div>
              {deal.expectedValue && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Giá trị dự kiến</span>
                  <span className="text-sm tabular-nums font-medium">{formatPrice(deal.expectedValue)}</span>
                </div>
              )}
              {deal.finalValue && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Giá trị cuối</span>
                  <span className="text-sm tabular-nums font-medium">{formatPrice(deal.finalValue)}</span>
                </div>
              )}
              {deal.customer && (
                <div className="flex items-start gap-2">
                  <User size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Khách hàng</span>
                    <button
                      onClick={() => router.push(portalPath(`/customers/${deal.customer!.id}`))}
                      className="text-left text-sm text-primary hover:underline"
                    >
                      {deal.customer.fullName}
                    </button>
                  </div>
                </div>
              )}
              {deal.property && (
                <div className="flex items-start gap-2">
                  <House size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">BĐS</span>
                    <button
                      onClick={() => router.push(portalPath(`/properties/${deal.property!.id}`))}
                      className="text-left text-sm text-primary hover:underline"
                    >
                      {deal.property.title}
                    </button>
                    <span className="text-xs text-foreground-muted">#{deal.property.propertyCode}</span>
                  </div>
                </div>
              )}
              {deal.lead && (
                <div className="flex items-start gap-2">
                  <SquareKanban size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Nguồn khách hàng</span>
                    <button
                      onClick={() => router.push(portalPath(`/leads/${deal.lead!.id}`))}
                      className="text-left text-sm text-primary hover:underline"
                    >
                      {deal.lead.leadCode}
                    </button>
                  </div>
                </div>
              )}
              {deal.createdAt && (
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Ngày tạo</span>
                    <span className="text-sm tabular-nums">
                      {new Date(deal.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DynamicValuesDisplay
            entityType="DEAL"
            values={deal.dynamicValuesJson}
          />

          {/* Status update */}
          <Can I="UPDATE_OWN" a="DEAL">
            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold mb-4">Cập nhật trạng thái</h3>
              <div className="flex flex-wrap items-center gap-2">
                {statusOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={deal.status === opt.value ? "default" : "outline"}
                    size="sm"
                    disabled={isUpdating || deal.status === opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </Can>

          {/* Reservations */}
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SquareKanban size={16} className="text-foreground-muted" />
                <h3 className="text-sm font-semibold">Đặt cọc</h3>
                <Badge variant="secondary">{reservations.length}</Badge>
              </div>
              <Can I="CREATE" a="DEAL">
                <Button size="sm" variant="outline" onClick={() => setResvOpen(true)}>
                  Thêm đặt cọc
                </Button>
              </Can>
            </div>
            {reservations.length > 0 ? (
              <div className="flex flex-col gap-2">
                {reservations.map((resv) => {
                  const cfg = reservationStatusLabel[resv.status] ?? { label: resv.status, variant: "default" as const };
                  return (
                    <div
                      key={resv.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted/40 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-[10px]">
                            {reservationTypeLabel[resv.reservationType] ?? resv.reservationType}
                          </Badge>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <span className="text-xs tabular-nums text-foreground-muted">
                          {new Date(resv.startsAt).toLocaleDateString("vi-VN")} — {new Date(resv.expiresAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      {resv.note && <p className="text-sm whitespace-pre-wrap">{resv.note}</p>}
                      {resv.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Can I="APPROVE" a="DEAL">
                            <Button size="xs" variant="default" onClick={() => handleApprove(resv.id)}>
                              Duyệt
                            </Button>
                            <Button size="xs" variant="outline" onClick={() => handleReject(resv.id)}>
                              Từ chối
                            </Button>
                          </Can>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-foreground-muted">Chưa có đặt cọc nào</p>
            )}
          </div>

          {/* Activities */}
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-foreground-muted" />
              <h3 className="text-sm font-semibold">Lịch sử hoạt động</h3>
              <Badge variant="secondary">{activities.length}</Badge>
            </div>

            <div className="flex flex-col gap-2 mb-4 rounded-lg border border-border bg-surface-muted/40 p-3">
              <div className="flex items-center gap-2">
                <Select
                  value={activityType}
                  items={activityTypeLabel}
                  onValueChange={(v) => v && setActivityType(v)}
                >
                  <SelectTrigger size="sm" className="h-8 w-[180px] text-xs">
                    <SelectValue placeholder="Loại hoạt động" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(activityTypeLabel).map(([value, label]) => (
                      <SelectItem key={value} value={value} label={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Nội dung ghi chú / cuộc gọi..."
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                className="min-h-16"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={isAddingActivity || !activityContent.trim()}
                  onClick={handleAddActivity}
                >
                  {isAddingActivity ? "Đang lưu..." : "Thêm hoạt động"}
                </Button>
              </div>
            </div>

            {activities.length > 0 ? (
              <div className="flex flex-col gap-2">
                {activities.map((act) => {
                  const isStatusChange = act.activityType === "STATUS_CHANGE";
                  const meta = act.metadataJson;
                  const oldLabel = isStatusChange && meta ? (statusLabel[meta.oldStatus ?? ""] ?? meta.oldStatus ?? "—") : null;
                  const newLabel = isStatusChange && meta ? (statusLabel[meta.newStatus ?? ""] ?? meta.newStatus ?? "—") : null;
                  return (
                    <div
                      key={act.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted/40 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="text-[10px]">
                          {activityTypeLabel[act.activityType] ?? act.activityType}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs tabular-nums text-foreground-muted">
                          <Clock size={12} />
                          {new Date(act.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      {isStatusChange && oldLabel && newLabel ? (
                        <div className={`rounded-md border border-border border-l-2 ${statusBorderClass[statusVariant[meta?.newStatus ?? ""] ?? "default"]} bg-surface-muted/40 px-3 py-2 text-sm`}>
                          <span className="text-foreground-muted">{oldLabel}</span>
                          <span className="mx-1.5 text-foreground-muted">→</span>
                          <span className="font-medium text-primary">{newLabel}</span>
                        </div>
                      ) : act.content ? (
                        <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                          <p className="whitespace-pre-wrap">{act.content}</p>
                        </div>
                      ) : null}
                      {act.user && (
                        <span className="flex items-center gap-1 text-xs text-foreground-muted">
                          <User size={11} />
                          {act.user.fullName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-foreground-muted">Chưa có hoạt động nào</p>
            )}
          </div>
        </div>

        {/* Commissions for this deal */}
        <Can I="READ" a="COMMISSION">
          <DealCommissionsSection dealId={id} />
        </Can>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <DealWorkflowActions dealId={id} />
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-surface-muted/30 px-4 py-3">
              <Layers size={14} className="text-foreground-muted" />
              <h3 className="text-sm font-semibold">Thông tin liên quan</h3>
            </div>
            <div className="flex flex-col divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <SquareKanban size={14} className="text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Workflow state</span>
                </div>
                {deal.currentWorkflowState ? (
                  <Badge variant="blue" className="text-[10px]">{deal.currentWorkflowState}</Badge>
                ) : (
                  <span className="text-xs text-foreground-muted">—</span>
                )}
              </div>
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="flex flex-col items-center gap-1 px-3 py-3">
                  <MessageSquare size={14} className="text-foreground-muted" />
                  <span className="text-[10px] uppercase tracking-wide text-foreground-muted">Hoạt động</span>
                  <span className="text-sm font-semibold tabular-nums">{activities.length}</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-3 py-3">
                  <FileText size={14} className="text-foreground-muted" />
                  <span className="text-[10px] uppercase tracking-wide text-foreground-muted">Đặt cọc</span>
                  <span className="text-sm font-semibold tabular-nums">{reservations.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Ngày tạo</span>
                </div>
                <span className="text-xs font-medium tabular-nums">
                  {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <DeleteDealDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deal={deal}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />

      {/* Create reservation dialog */}
      <CreateReservationDialog
        open={resvOpen}
        onOpenChange={setResvOpen}
        isCreating={isCreatingResv}
        onSubmit={handleCreateReservation}
      />
    </div>
  );
}
