"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, DollarSign, Ban, RefreshCw } from "lucide-react";
import { Can } from "@casl/react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  usePostApiDealCommissionConfirm,
  usePostApiDealCommissionApprove,
  usePostApiDealCommissionReject,
  usePostApiDealCommissionMarkPaid,
} from "@/lib/api/endpoints/commission";
import { useApiCommissionDeal, useApiCommissionOptions } from "@/lib/api/endpoints/commission-meta";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { getApiErrorMessage } from "@/lib/api/get-api-error-message";
import { getLeadSourceLabel } from "@/utils/lead-source-labels";

interface DealCommission {
  id: string;
  dealId: string;
  zoneId?: string | null;
  projectId?: string | null;
  leadSource?: string | null;
  commissionType: string;
  status: string;
  transactionValueEstimated: string | null;
  transactionValueConfirmed: string | null;
  totalCommissionEstimated: string | null;
  totalCommissionConfirmed: string | null;
  calculationRevision: number;
  appliedRuleId?: string | null;
  calculationSnapshotJson: unknown;
  confirmationEligibility?: { eligible: boolean; reason?: string | null };
  deal?: { dealCode: string; status: string; finalValue: string | null; expectedValue: string | null } | null;
  plan?: { name: string } | null;
  property?: { title: string; propertyCode: string } | null;
  items?: Array<{
    id: string;
    sourceSplitId?: string | null;
    receiverType: string;
    receiverRole?: string | null;
    receiverName?: string | null;
    amountEstimated: string | null;
    amountConfirmed: string | null;
    status: string;
    receiverUser?: { id: string; fullName: string } | null;
  }>;
  ledgers?: Array<{
    id: string;
    eventType: string;
    amountBefore: string | null;
    amountAfter: string | null;
    reason?: string | null;
    createdAt: string;
  }>;
}

type CommissionSnapshot = {
  policy?: { planName?: string; planVersion?: number; ruleName?: string; matchSpecificity?: number };
  formula?: {
    calculationType?: string;
    calculationBase?: string;
    calculationValue?: string;
    baseValueEstimated?: string;
    estimateSource?: string;
    poolAmountEstimated?: string;
    tenantRetainedEstimated?: string;
    minCommissionAmount?: string | null;
    maxCommissionAmount?: string | null;
    rounding?: string;
  };
  allocations?: Array<{
    splitId?: string;
    receiverName?: string | null;
    receiverRole?: string | null;
    splitType?: string;
    splitValue?: string | number;
    amountEstimated?: string | number;
    amountConfirmed?: string | number;
  }>;
  trigger?: string;
  context?: {
    zoneName?: string | null;
    projectName?: string | null;
    leadSource?: string | null;
    leadAttributionStatus?: string;
  };
};

function normalizeCommissionSnapshot(value: unknown): CommissionSnapshot | null {
  let snapshot = value;
  if (typeof snapshot === "string") {
    try {
      snapshot = JSON.parse(snapshot);
    } catch {
      return null;
    }
  }
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) return null;

  const root = snapshot as Record<string, any>;
  const policy = typeof root.policy === "object" && root.policy !== null ? root.policy : root;
  const formula = typeof root.formula === "object" && root.formula !== null ? root.formula : root;
  const context = typeof root.context === "object" && root.context !== null ? root.context : root;
  return {
    policy: {
      planName: policy.planName,
      planVersion: policy.planVersion,
      ruleName: policy.ruleName,
      matchSpecificity: policy.matchSpecificity,
    },
    formula: {
      calculationType: formula.calculationType,
      calculationBase: formula.calculationBase,
      calculationValue: formula.calculationValue,
      baseValueEstimated: formula.baseValueEstimated ?? formula.baseValue,
      estimateSource: formula.estimateSource,
      poolAmountEstimated: formula.poolAmountEstimated ?? formula.commissionAmount,
      tenantRetainedEstimated: formula.tenantRetainedEstimated,
      minCommissionAmount: formula.minCommissionAmount,
      maxCommissionAmount: formula.maxCommissionAmount,
      rounding: formula.rounding,
    },
    allocations: Array.isArray(root.allocations)
      ? root.allocations
      : Array.isArray(root.splits)
        ? root.splits.map((allocation: any) => ({
          splitId: allocation.splitId,
          receiverName: allocation.receiverName,
          receiverRole: allocation.receiverRole,
          splitType: allocation.splitType,
          splitValue: allocation.splitValue,
          amountEstimated: allocation.amountEstimated ?? allocation.amount,
          amountConfirmed: allocation.amountConfirmed,
        }))
        : [],
    trigger: root.trigger,
    context: {
      zoneName: context.zoneName,
      projectName: context.projectName,
      leadSource: context.leadSource,
      leadAttributionStatus: context.leadAttributionStatus,
    },
  };
}

type CommissionAction = "CONFIRM" | "APPROVE" | "REJECT" | "MARK_PAID";

const statusVariant: Record<string, "default" | "green" | "yellow" | "blue" | "red"> = {
  DRAFT: "default", ESTIMATED: "blue", CONFIRMED: "yellow", APPROVED: "green", PAID: "green", DISPUTED: "red", CANCELLED: "default",
};
const formatVnd = (value?: string | null) => {
  if (value == null || value === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount.toLocaleString("vi-VN")} ₫` : value;
};

export default function DealCommissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const { data: detailEnvelope, isLoading, isError, error, refetch, isFetching } = useApiCommissionDeal(id);
  const { data: optionsEnvelope } = useApiCommissionOptions();
  const dc = detailEnvelope?.data as DealCommission | undefined;
  const options = optionsEnvelope?.data;
  const [actionOpen, setActionOpen] = useState<CommissionAction | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [confirmedValue, setConfirmedValue] = useState("");
  const [executing, setExecuting] = useState(false);

  const { mutateAsync: confirm } = usePostApiDealCommissionConfirm();
  const { mutateAsync: approve } = usePostApiDealCommissionApprove();
  const { mutateAsync: reject } = usePostApiDealCommissionReject();
  const { mutateAsync: markPaid } = usePostApiDealCommissionMarkPaid();
  const availableActions = dc
    ? (options?.commissionActions[dc.status] ?? []).filter(
      (action) => action.value !== "CONFIRM" || dc.confirmationEligibility?.eligible === true,
    )
    : [];
  const statusLabel = (status: string) => options?.commissionStatuses.find((entry) => entry.value === status)?.label ?? status;
  const itemStatusLabel = (status: string) => options?.commissionItemStatuses.find((entry) => entry.value === status)?.label ?? status;
  const optionLabel = (items: Array<{ value: string; label: string }> | undefined, value?: string | null) =>
    value ? items?.find((item) => item.value === value)?.label ?? value : "—";
  const actionLabel = (action?: string) =>
    action ? options?.commissionActions[dc?.status ?? ""]?.find((item) => item.value === action)?.label ?? action : "";
  const selectedAction = actionOpen
    ? options?.commissionActions[dc?.status ?? ""]?.find((item) => item.value === actionOpen)
    : undefined;
  const actionRequiresReason = Boolean(
    selectedAction?.requiresReason || actionOpen === "REJECT" || actionOpen === "MARK_PAID",
  );

  const openAction = (action: string) => {
    if (!["CONFIRM", "APPROVE", "REJECT", "MARK_PAID"].includes(action)) return;
    setActionReason("");
    setConfirmedValue("");
    setActionOpen(action as CommissionAction);
  };

  const handleAction = async () => {
    if (!actionOpen) return;
    if (actionRequiresReason && !actionReason.trim()) {
      toast.error(actionOpen === "REJECT" ? "Vui lòng nhập lý do từ chối" : actionOpen === "MARK_PAID" ? "Vui lòng nhập mã giao dịch hoặc ghi chú đối soát" : "Vui lòng nhập lý do theo workflow");
      return;
    }
    const manualValue = confirmedValue.trim();
    if (actionOpen === "CONFIRM" && !dc?.deal?.finalValue && !manualValue) {
      toast.error("Giao dịch chưa có giá trị cuối. Hãy nhập giá trị xác nhận thực tế.");
      return;
    }
    if (actionOpen === "CONFIRM" && manualValue && !actionReason.trim()) {
      toast.error("Vui lòng ghi lý do khi nhập giá trị thực tế thủ công");
      return;
    }
    if (actionOpen === "CONFIRM" && manualValue && (!Number.isFinite(Number(manualValue)) || Number(manualValue) < 0)) {
      toast.error("Giá trị xác nhận phải là số không âm hợp lệ");
      return;
    }

    setExecuting(true);
    try {
      if (actionOpen === "CONFIRM") {
        await confirm({ id, data: {
          transactionValueConfirmed: manualValue ? Number(manualValue) : undefined,
          reason: actionReason.trim() || undefined,
        } });
        toast.success("Đã xác nhận hoa hồng theo giá trị giao dịch thực tế");
      } else if (actionOpen === "APPROVE") {
        await approve({ id, data: { reason: actionReason.trim() || undefined } });
        toast.success("Đã duyệt hoa hồng");
      } else if (actionOpen === "REJECT") {
        await reject({ id, data: { reason: actionReason.trim() } });
        toast.success("Đã từ chối hoa hồng");
      } else {
        await markPaid({ id, data: { reason: actionReason.trim() } });
        toast.success("Đã ghi nhận đối soát thanh toán");
      }
      setActionOpen(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/commission/deals"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/commission/deals", id] }),
      ]);
    } catch (error) {
      toast.error(getApiErrorMessage(error) ?? "Không thể cập nhật hoa hồng");
    } finally {
      setExecuting(false);
    }
  };

  if (isLoading) return <div aria-busy="true" aria-label="Đang tải chi tiết hoa hồng" className="h-96 animate-pulse rounded-lg bg-surface-muted" />;
  if (isError && !dc) return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(portalPath("/commission/deals"))} aria-label="Quay lại"><ArrowLeft size={20} /></Button>
        <PageHeader eyebrow="Hoa hồng" title="Không tải được chi tiết hoa hồng" />
      </div>
      <Alert variant="destructive">
        <RefreshCw />
        <AlertTitle>Không tải được khoản hoa hồng</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>{getApiErrorMessage(error) ?? "API không phản hồi hoặc đang gặp lỗi kết nối. Hãy thử lại."}</span>
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
            <RefreshCw className={isFetching ? "animate-spin" : undefined} size={16} />
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
  if (!dc) return <div className="flex flex-col gap-5"><Button variant="ghost" className="w-fit" onClick={() => router.push(portalPath("/commission/deals"))}><ArrowLeft size={16} />Quay lại</Button><PageHeader eyebrow="Hoa hồng" title="Không tìm thấy khoản hoa hồng" /></div>;

  const commissionTypeLabel = optionLabel(options?.commissionTypes, dc.commissionType);
  const snapshot = normalizeCommissionSnapshot(dc.calculationSnapshotJson);
  const zoneName = options?.zones.find((zone) => zone.id === dc.zoneId)?.name
    ?? snapshot?.context?.zoneName
    ?? (dc.zoneId ? "Zone đã lưu trong snapshot" : "Chưa gán zone");
  const hasZoneSnapshot = Boolean(dc.zoneId || snapshot?.context?.zoneName);
  const projectName = options?.projects.find((project) => project.id === dc.projectId)?.name ?? snapshot?.context?.projectName ?? "—";
  const formula = snapshot?.formula;
  const policy = snapshot?.policy;
  const leadAttributionStatus = snapshot?.context?.leadAttributionStatus;
  const leadSource = dc.leadSource ?? snapshot?.context?.leadSource ?? null;
  const leadAttributionStatusLabel = optionLabel(options?.leadAttributionStatuses, leadAttributionStatus);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => router.push(portalPath("/commission/deals"))} aria-label="Quay lại"><ArrowLeft size={20} /></Button><PageHeader eyebrow="Hoa hồng" title={dc.deal?.dealCode ? `Giao dịch ${dc.deal.dealCode}` : dc.plan?.name ?? "Chi tiết hoa hồng"} description={dc.plan?.name ?? ""} /></div>
        <Badge variant={statusVariant[dc.status] ?? "default"}>{statusLabel(dc.status)}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-4 text-sm font-semibold">Khoản hoa hồng và căn cứ</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div><span className="text-xs text-foreground-muted">Loại</span><p className="text-sm font-medium">{commissionTypeLabel}</p></div>
              <div><span className="text-xs text-foreground-muted">Khu vực của BĐS</span><p className="text-sm font-medium">{zoneName}</p></div>
              <div><span className="text-xs text-foreground-muted">Dự án</span><p className="text-sm font-medium">{projectName}</p></div>
              <div><span className="text-xs text-foreground-muted">Nguồn lead</span><p className="text-sm font-medium">{leadSource ? getLeadSourceLabel(leadSource) : leadAttributionStatus === "UNAVAILABLE" ? leadAttributionStatusLabel : "—"}</p></div>
              <div><span className="text-xs text-foreground-muted">Bất động sản</span><p className="text-sm font-medium">{dc.property?.title ?? "—"}</p></div>
              <div><span className="text-xs text-foreground-muted">Giá trị dự kiến</span><p className="text-sm font-medium tabular-nums">{formatVnd(dc.transactionValueEstimated)}</p></div>
              <div><span className="text-xs text-foreground-muted">Giá trị thực tế</span><p className="text-sm font-medium tabular-nums">{formatVnd(dc.transactionValueConfirmed)}</p></div>
              <div><span className="text-xs text-foreground-muted">Hoa hồng ước tính</span><p className="text-sm font-medium tabular-nums text-primary">{formatVnd(dc.totalCommissionEstimated)}</p></div>
              <div><span className="text-xs text-foreground-muted">Hoa hồng đã xác nhận</span><p className="text-sm font-medium tabular-nums text-primary">{formatVnd(dc.totalCommissionConfirmed)}</p></div>
            </div>
            {leadAttributionStatus === "UNAVAILABLE" && (
              <p role="status" className="mt-4 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                Lead liên kết đã bị xóa hoặc không khả dụng. Hệ thống không dùng nguồn/referrer của lead cho phép tính này.
              </p>
            )}
            {!hasZoneSnapshot && (
              <p role="status" className="mt-4 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                Giao dịch chưa ghi nhận zone của bất động sản tại thời điểm tính. Các rule yêu cầu zone cụ thể không áp dụng cho lần tính này.
              </p>
            )}
            {!snapshot && (
              <p role="status" className="mt-4 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                Bản ghi cũ không có snapshot phép tính. Màn hình không suy đoán lại chính sách hoặc người nhận từ cấu hình hiện tại.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-4 text-sm font-semibold">Chính sách và cách tính</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div><span className="text-xs text-foreground-muted">Kế hoạch / phiên bản</span><p className="text-sm font-medium">{policy?.planName ?? dc.plan?.name ?? "—"}{policy?.planVersion ? ` · v${policy.planVersion}` : ""}</p></div>
              <div><span className="text-xs text-foreground-muted">Rule được áp dụng</span><p className="text-sm font-medium">{policy?.ruleName ?? (dc.appliedRuleId ? `Mã rule ${dc.appliedRuleId}` : "—")}</p></div>
              <div><span className="text-xs text-foreground-muted">Độ khớp rule</span><p className="text-sm font-medium">{policy?.matchSpecificity ?? "—"}</p></div>
              <div><span className="text-xs text-foreground-muted">Công thức</span><p className="text-sm font-medium">{optionLabel(options?.calculationTypes, formula?.calculationType)}</p></div>
              <div><span className="text-xs text-foreground-muted">Cơ sở tính</span><p className="text-sm font-medium">{optionLabel(options?.calculationBases, formula?.calculationBase)}</p></div>
              <div><span className="text-xs text-foreground-muted">Tỷ lệ / giá trị</span><p className="text-sm font-medium tabular-nums">{formula?.calculationValue ?? "—"}</p></div>
              <div><span className="text-xs text-foreground-muted">Cơ sở ước tính</span><p className="text-sm font-medium tabular-nums">{formatVnd(formula?.baseValueEstimated)}</p></div>
              <div><span className="text-xs text-foreground-muted">Nguồn giá trị ước tính</span><p className="text-sm font-medium">{optionLabel(options?.estimateSources, formula?.estimateSource)}</p></div>
              <div><span className="text-xs text-foreground-muted">Pool hoa hồng</span><p className="text-sm font-medium tabular-nums">{formatVnd(formula?.poolAmountEstimated)}</p></div>
              <div><span className="text-xs text-foreground-muted">Tenant giữ lại</span><p className="text-sm font-medium tabular-nums">{formatVnd(formula?.tenantRetainedEstimated)}</p></div>
              <div><span className="text-xs text-foreground-muted">Khoảng giới hạn</span><p className="text-sm font-medium tabular-nums">{formatVnd(formula?.minCommissionAmount)} – {formatVnd(formula?.maxCommissionAmount)}</p></div>
              <div><span className="text-xs text-foreground-muted">Làm tròn</span><p className="text-sm font-medium">{formula?.rounding ?? "—"}</p></div>
              <div><span className="text-xs text-foreground-muted">Revision / trigger</span><p className="text-sm font-medium">{dc.calculationRevision} · {snapshot?.trigger ?? "—"}</p></div>
            </div>
          </section>

          {!!dc.items?.length && <section className="rounded-lg border border-border bg-surface p-6"><h2 className="mb-4 text-sm font-semibold">Phân bổ theo người nhận</h2><div className="flex flex-col gap-3">{dc.items.map((item) => {
            const roleLabel = item.receiverRole
              ? optionLabel(options?.receiverRoles, item.receiverRole)
              : optionLabel(options?.receiverTypes, item.receiverType);
            const payeeName = item.receiverName || item.receiverUser?.fullName;
            return <div key={item.id} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"><div className="flex flex-col"><span className="text-sm font-medium">{payeeName ?? "Chưa xác định người nhận cụ thể"}</span><span className="text-xs text-foreground-muted">{roleLabel} · {itemStatusLabel(item.status)}</span></div><div className="text-right"><span className="block text-sm font-medium tabular-nums">{formatVnd(item.amountConfirmed ?? item.amountEstimated)}</span><span className="text-xs text-foreground-muted">Ước tính {formatVnd(item.amountEstimated)}</span></div></div>;
          })}</div></section>}

          {!!dc.ledgers?.length && <section className="rounded-lg border border-border bg-surface p-6"><h2 className="mb-4 text-sm font-semibold">Lịch sử thay đổi</h2><div className="flex flex-col gap-3">{dc.ledgers.map((entry) => <div key={entry.id} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"><div><p className="text-sm font-medium">{entry.eventType}</p>{entry.reason && <p className="mt-1 text-xs text-foreground-muted">{entry.reason}</p>}</div><div className="text-right"><p className="text-sm tabular-nums">{formatVnd(entry.amountAfter)}</p><time className="text-xs text-foreground-muted">{new Date(entry.createdAt).toLocaleString("vi-VN")}</time></div></div>)}</div></section>}
        </div>

        <aside className="rounded-lg border border-border bg-surface p-6"><h2 className="mb-4 text-sm font-semibold">Workflow</h2><div className="flex flex-col gap-2"><Can I="APPROVE" a="COMMISSION">{availableActions.map(({ value, label, requiresAttachment }) => <Button key={value} disabled={!(["CONFIRM", "APPROVE", "REJECT", "MARK_PAID"] as string[]).includes(value) || requiresAttachment} title={requiresAttachment ? "Workflow yêu cầu tệp đính kèm; luồng tải chứng từ hoa hồng chưa được bật." : undefined} variant={value === "REJECT" ? "outline" : "default"} className="w-full justify-start" onClick={() => openAction(value)}>{value === "REJECT" ? <Ban size={16} /> : value === "MARK_PAID" ? <DollarSign size={16} /> : <Check size={16} />}{label}</Button>)}</Can>{availableActions.some((action) => action.requiresAttachment) && <p className="text-xs text-foreground-muted">Một số thao tác yêu cầu tệp đính kèm. Cần bật luồng chứng từ trước khi thực hiện.</p>}{dc.status === "ESTIMATED" && dc.confirmationEligibility?.eligible === false && <p className="rounded-md bg-surface-muted p-3 text-sm text-foreground-muted">{dc.confirmationEligibility.reason}</p>}{!availableActions.length && <p className="py-2 text-sm text-foreground-muted">Không có thao tác tiếp theo theo trạng thái hiện tại.</p>}</div></aside>
      </div>

      <Dialog open={!!actionOpen} onOpenChange={(open) => !open && !executing && setActionOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{actionLabel(actionOpen ?? undefined)}</DialogTitle><DialogDescription>{actionOpen === "CONFIRM" ? "Giá trị cuối cùng trên giao dịch sẽ được dùng nếu không nhập giá trị thay thế. Giá trị thay thế cần có lý do." : actionOpen === "REJECT" ? "Nhập lý do để lưu vào sổ kiểm toán." : actionOpen === "MARK_PAID" ? "Nhập mã giao dịch hoặc ghi chú đối soát thanh toán." : "Xác nhận thao tác theo workflow hoa hồng."}</DialogDescription></DialogHeader>
          {actionOpen === "CONFIRM" && <div className="flex flex-col gap-3"><p className="text-sm text-foreground-muted">Giá trị cuối trên giao dịch: <strong className="text-foreground">{formatVnd(dc.deal?.finalValue)}</strong></p><label className="flex flex-col gap-1.5 text-sm"><span>Giá trị thực tế thay thế (không bắt buộc nếu đã có giá trị cuối)</span><Input type="number" min="0" step="0.01" value={confirmedValue} onChange={(event) => setConfirmedValue(event.target.value)} /></label></div>}
          {(actionRequiresReason || actionOpen === "CONFIRM" && confirmedValue.trim() || actionOpen === "APPROVE") && <label className="flex flex-col gap-1.5 text-sm"><span>{actionOpen === "CONFIRM" ? "Lý do điều chỉnh / theo workflow" : actionOpen === "MARK_PAID" ? "Mã giao dịch / ghi chú đối soát" : actionOpen === "REJECT" ? "Lý do từ chối" : actionRequiresReason ? "Lý do theo workflow" : "Ghi chú (không bắt buộc)"}</span><Textarea value={actionReason} onChange={(event) => setActionReason(event.target.value)} rows={3} /></label>}
          <DialogFooter><Button variant="outline" onClick={() => setActionOpen(null)} disabled={executing}>Hủy</Button><Button onClick={handleAction} disabled={executing}>{executing ? "Đang xử lý..." : "Xác nhận"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
