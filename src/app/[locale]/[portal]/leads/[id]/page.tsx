"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import {
  ArrowLeft,
  Clock,
  FileText,
  House,
  Layers,
  MessageSquare,
  Pencil,
  Phone,
  SquareKanban,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { Can } from "@casl/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  useGetApiLeadId,
  useGetApiLeadActivities,
  usePatchApiLead,
  useDeleteApiLead,
  usePostApiLeadActivity,
} from "@/lib/api/endpoints/leads";
import type { UpdateLeadDtoStatus } from "@/lib/api/models/updateLeadDtoStatus";
import { DeleteLeadDialog } from "./_components/delete-lead-dialog";
import { LeadWorkflowActions } from "./_components/lead-workflow-actions";
import { DynamicValuesDisplay } from "@/components/shared/dynamic-values-display";

interface LeadCustomer {
  id: string;
  fullName: string;
  phone: string;
}
interface LeadProperty {
  id: string;
  title: string;
  propertyCode: string;
  price?: string;
}
interface LeadSales {
  id: string;
  fullName: string;
  email?: string;
}
interface LeadActivity {
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

interface Lead {
  id: string;
  leadCode: string;
  customerId: string | null;
  propertyId: string | null;
  source: string;
  assignedSalesId: string | null;
  phoneNormalized: string | null;
  status: string;
  createdAt: string;
  dynamicValuesJson?: Record<string, unknown> | null;
  customer: LeadCustomer | null;
  property: LeadProperty | null;
  assignedSales: LeadSales | null;
  activities?: LeadActivity[];
}

const statusVariant: Record<string, "blue" | "yellow" | "purple" | "default" | "green" | "red"> = {
  NEW: "blue",
  CONTACTED: "yellow",
  INTERESTED: "purple",
  NEGOTIATING: "default",
  CONVERTED: "green",
  LOST: "red",
  RECYCLED: "default",
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
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  INTERESTED: "Quan tâm",
  NEGOTIATING: "Đàm phán",
  CONVERTED: "Chuyển đổi",
  LOST: "Mất",
  RECYCLED: "Khách cũ",
};

const sourceLabel: Record<string, string> = {
  WEBSITE: "Website",
  PROPERTY_DETAIL: "Trang BĐS",
  OWNER_PAGE: "Trang chủ",
  SALES_LINK: "Link sales",
  CTV_LINK: "Link CTV",
  AGENCY_MARKETING: "Marketing",
  MANUAL_INPUT: "Nhập tay",
  LEAD_POOL: "Lead pool",
  IMPORT: "Nhập file",
};

const statusOptions = [
  { value: "NEW", label: "Mới" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "INTERESTED", label: "Quan tâm" },
  { value: "NEGOTIATING", label: "Đàm phán" },
  { value: "CONVERTED", label: "Chuyển đổi" },
  { value: "LOST", label: "Mất" },
  { value: "RECYCLED", label: "Khách cũ" },
];

const activityTypeLabel: Record<string, string> = {
  CALL: "Gọi điện",
  NOTE: "Ghi chú",
  MESSAGE: "Tin nhắn",
  SEND_PROPERTY: "Gửi BĐS",
  STATUS_CHANGE: "Đổi trạng thái",
  APPOINTMENT_CREATED: "Tạo lịch hẹn",
  DEAL_CREATED: "Tạo giao dịch",
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portalPath = usePortalPath();
  const id = params.id as string;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activityType, setActivityType] = useState("NOTE");
  const [activityContent, setActivityContent] = useState("");

  const { data: leadData, isLoading, refetch } = useGetApiLeadId(id);
  const lead = (leadData as unknown as { data: Lead })?.data;

  const { data: activitiesData, refetch: refetchActivities } = useGetApiLeadActivities(id);
  const activities = ((activitiesData as unknown as { data: LeadActivity[] })?.data) || [];

  const { mutateAsync: updateLead, isPending: isUpdating } = usePatchApiLead();
  const { mutateAsync: deleteLead, isPending: isDeleting } = useDeleteApiLead();
  const { mutateAsync: addActivity, isPending: isAddingActivity } = usePostApiLeadActivity();

  const handleStatusChange = async (newStatus: string) => {
    if (!lead || lead.status === newStatus) return;
    try {
      await updateLead({ id, data: { status: newStatus as UpdateLeadDtoStatus } });
      toast.success("Đã cập nhật trạng thái");
      refetch();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Cập nhật trạng thái thất bại");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLead({ id });
      toast.success(`Đã xóa nguồn khách hàng "${lead?.leadCode}"`);
      router.refresh();
      router.push(portalPath("/leads"));
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Xóa lead thất bại");
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

  if (!lead) {
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
          <PageHeader eyebrow="CRM" title="Không tìm thấy" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(portalPath("/leads"))}
            className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted"
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} />
          </button>
          <PageHeader eyebrow="CRM" title={lead.customer?.fullName || lead.phoneNormalized || lead.leadCode} />
        </div>
        <div className="flex items-center gap-2">
          <Can I="UPDATE_OWN" a="LEAD">
            <Button variant="outline" onClick={() => router.push(portalPath(`/leads/${id}/edit`))}>
              <Pencil size={16} />
              Chỉnh sửa
            </Button>
          </Can>
          <Can I="DELETE_OWN" a="LEAD">
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
              <Badge variant={statusVariant[lead.status] ?? "default"}>
                {statusLabel[lead.status] ?? lead.status}
              </Badge>
              <Badge variant="blue">{sourceLabel[lead.source] ?? lead.source}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {lead.customer && (
                <div className="flex items-start gap-2">
                  <User size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Khách hàng</span>
                    <button
                      onClick={() => router.push(portalPath(`/customers/${lead.customer!.id}`))}
                      className="text-left text-sm text-primary hover:underline"
                    >
                      {lead.customer.fullName}
                    </button>
                    {lead.customer.phone && (
                      <span className="text-xs text-foreground-muted tabular-nums">{lead.customer.phone}</span>
                    )}
                  </div>
                </div>
              )}
              {lead.property && (
                <div className="flex items-start gap-2">
                  <House size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">BĐS</span>
                    <button
                      onClick={() => router.push(portalPath(`/properties/${lead.property!.id}`))}
                      className="text-left text-sm text-primary hover:underline"
                    >
                      {lead.property.title}
                    </button>
                    <span className="text-xs text-foreground-muted">#{lead.property.propertyCode}</span>
                  </div>
                </div>
              )}
              {lead.assignedSales && (
                <div className="flex items-start gap-2">
                  <User size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Sales phụ trách</span>
                    <span className="text-sm">{lead.assignedSales.fullName}</span>
                    {lead.assignedSales.email && (
                      <span className="text-xs text-foreground-muted">{lead.assignedSales.email}</span>
                    )}
                  </div>
                </div>
              )}
              {lead.phoneNormalized && (
                <div className="flex items-start gap-2">
                  <Phone size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Điện thoại</span>
                    <span className="text-sm tabular-nums">{lead.phoneNormalized}</span>
                  </div>
                </div>
              )}
              {lead.createdAt && (
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-foreground-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Ngày tạo</span>
                    <span className="text-sm tabular-nums">
                      {new Date(lead.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DynamicValuesDisplay
            entityType="LEAD"
            values={lead.dynamicValuesJson}
          />

          {/* Status update */}
          <Can I="UPDATE_OWN" a="LEAD">
            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold mb-4">Cập nhật trạng thái</h3>
              <div className="flex flex-wrap items-center gap-2">
                {statusOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={lead.status === opt.value ? "default" : "outline"}
                    size="sm"
                    disabled={isUpdating || lead.status === opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </Can>

          {/* Activities */}
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-foreground-muted" />
              <h3 className="text-sm font-semibold">Lịch sử hoạt động</h3>
              <Badge variant="secondary">{activities.length}</Badge>
            </div>

            {/* Add activity form */}
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
                rows={5}
                className="bg-surface [field-sizing:none] min-h-[120px]"
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

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <LeadWorkflowActions leadId={id} />
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-surface-muted/30 px-4 py-3">
              <Layers size={14} className="text-foreground-muted" />
              <h3 className="text-sm font-semibold">Thông tin liên quan</h3>
            </div>
            <div className="flex flex-col divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <SquareKanban size={14} className="text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Mã định danh</span>
                </div>
                <span className="text-xs font-medium tabular-nums">{lead.leadCode}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Trạng thái</span>
                </div>
                <Badge variant={statusVariant[lead.status] ?? "default"} className="text-[10px]">
                  {statusLabel[lead.status] ?? lead.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Nguồn</span>
                </div>
                <Badge variant="blue" className="text-[10px]">
                  {sourceLabel[lead.source] ?? lead.source}
                </Badge>
              </div>
              <div className="grid grid-cols-1 divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-foreground-muted" />
                    <span className="text-xs text-foreground-muted">Hoạt động</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{activities.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Ngày tạo</span>
                </div>
                <span className="text-xs font-medium tabular-nums">
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <DeleteLeadDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        lead={lead}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </div >
  );
}
