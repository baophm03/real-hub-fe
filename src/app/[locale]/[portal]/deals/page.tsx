"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { List as ListIcon, Plus, SquareKanban, Trash2 } from "lucide-react";
import { formatPrice } from "@/utils";
import { Can } from "@casl/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { KanbanBoard, type KanbanColumn } from "@/components/shared/kanban-board";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { usePagination } from "@/lib/hooks/use-pagination";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DealTransitionDialog, type DealTransition } from "./_components/deal-transition-dialog";
import {
  useGetApiDeals,
  usePatchApiDeal,
  useDeleteApiDeal,
  getApiDealTransitions,
  usePostApiDealTransition,
  getGetApiDealsQueryKey,
} from "@/lib/api/endpoints/deals-reservations";
import {
  useGetApiWorkflows,
  useGetApiWorkflowIdStates,
} from "@/lib/api/endpoints/workflow";
import type { GetApiDealsStatus } from "@/lib/api/models/getApiDealsStatus";
import type { UpdateDealDtoStatus } from "@/lib/api/models/updateDealDtoStatus";
import { DeleteDealDialog } from "./_components/delete-deal-dialog";
import { txOptions, type WorkflowState } from "./_components/type";

interface DealProperty {
  id: string;
  title: string;
  propertyCode: string;
}
interface DealCustomer {
  id: string;
  fullName: string;
}

interface Deal {
  id: string;
  dealCode: string;
  customerId: string | null;
  propertyId: string;
  transactionType: string;
  expectedValue?: string;
  finalValue?: string;
  status: string;
  currentWorkflowState?: string | null;
  salesUserId?: string | null;
  createdAt: string;
  property?: DealProperty | null;
  customer?: DealCustomer | null;
}

interface DealsResponse {
  success: boolean;
  data: Deal[];
  meta: { total: number; limit: number; offset: number; page: number; totalPages: number };
  timestamp: string;
}

const statusConfig: {
  id: UpdateDealDtoStatus;
  title: string;
  variant: "blue" | "yellow" | "purple" | "default" | "green" | "red";
}[] = [
    { id: "SOFT_RESERVED", title: "Đặt cọc", variant: "blue" },
    { id: "NEGOTIATING", title: "Đàm phán", variant: "yellow" },
    { id: "SUCCESS", title: "Thành công", variant: "green" },
    { id: "FAILED", title: "Thất bại", variant: "red" },
    { id: "CANCELLED", title: "Hủy", variant: "default" },
    { id: "DISPUTED", title: "Tranh chấp", variant: "purple" },
  ];

const statusLabel: Record<string, string> = {
  SOFT_RESERVED: "Đặt cọc",
  NEGOTIATING: "Đàm phán",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Hủy",
  DISPUTED: "Tranh chấp",
};

const txLabel = Object.fromEntries(
  txOptions.map((o) => [o.value, o.label]),
);

// ── Workflow-driven kanban ─────────────────────────────

const stateColorVariant: Record<string, KanbanColumn<Deal>["variant"]> = {
  "#6b7280": "default",
  "#3b82f6": "blue",
  "#10b981": "green",
  "#f59e0b": "yellow",
  "#ef4444": "red",
  "#8b5cf6": "purple",
  "#ec4899": "purple",
  "#14b8a6": "green",
};

export default function DealsPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [txFilter, setTxFilter] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const pagination = usePagination(10);

  const isList = view === "list";
  const { data: dealsData, isLoading } = useGetApiDeals({
    status: statusFilter === "ALL" ? undefined : (statusFilter as GetApiDealsStatus),
    limit: isList ? pagination.limit : "200",
    offset: isList ? pagination.offset : "0",
  });
  const allDeals = ((dealsData as unknown as DealsResponse)?.data) || [];
  const deals = txFilter === "ALL"
    ? allDeals
    : allDeals.filter((d) => d.transactionType === txFilter);
  const totalCount = (dealsData as unknown as DealsResponse)?.meta?.total ?? deals.length;
  const totalPages =
    (dealsData as unknown as DealsResponse)?.meta?.totalPages ??
    Math.max(1, Math.ceil(totalCount / pagination.pageSize));

  const { mutateAsync: updateDeal } = usePatchApiDeal();
  const { mutateAsync: deleteDeal, isPending: isDeleting } = useDeleteApiDeal();
  const { mutateAsync: executeTransition } = usePostApiDealTransition();
  const [pendingTransition, setPendingTransition] = useState<{
    deal: Deal;
    transition: DealTransition;
  } | null>(null);
  const [executing, setExecuting] = useState(false);

  // Active DEAL workflow → kanban columns from its states
  const { data: workflowsRaw } = useGetApiWorkflows({
    entityType: "DEAL" as any,
    status: "ACTIVE" as any,
  });
  const workflows = Array.isArray(workflowsRaw)
    ? workflowsRaw
    : ((workflowsRaw as any)?.data ?? []);
  const dealWorkflow = workflows[0];

  const { data: wfStatesRaw } = useGetApiWorkflowIdStates(dealWorkflow?.id ?? "", {
    query: { enabled: !!dealWorkflow },
  });
  const wfStates: WorkflowState[] = (Array.isArray(wfStatesRaw)
    ? wfStatesRaw
    : ((wfStatesRaw as any)?.data ?? [])
  ).slice()
    .sort((a: WorkflowState, b: WorkflowState) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const hasWorkflow = wfStates.length > 0;

  // Status filter options from workflow states
  const statusFilters = [
    { value: "ALL", label: "Tất cả trạng thái" },
    ...wfStates
      .filter((s) => s.columnName === "status")
      .map((s) => ({ value: s.stateName, label: s.stateName })),
  ];
  const txFilters = [
    { value: "ALL", label: "Tất cả loại GD" },
    ...txOptions,
  ];

  const runTransition = async (deal: Deal, t: DealTransition, reasonText?: string) => {
    await executeTransition({
      id: deal.id,
      data: { transitionId: t.transitionId, reason: reasonText || undefined },
    });
    toast.success(`Đã chuyển sang "${t.actionLabel}"`);
    void queryClient.invalidateQueries({ queryKey: getGetApiDealsQueryKey() });
    router.refresh();
  };

  const handleDrop = async (deal: Deal, targetColumnId: string) => {
    const target = columnStateMap.get(targetColumnId);
    if (!target) return;
    const currentValue = (deal as any)[target.columnName];
    if (currentValue === target.stateName) return;
    try {
      const res = (await getApiDealTransitions(deal.id)) as any;
      const actions: DealTransition[] = res?.data ?? res ?? [];
      const t = actions.find(
        (a) => a.toStateName === target.stateName && a.toColumnName === target.columnName,
      );
      if (!t) {
        toast.error(
          `Không thể chuyển từ "${currentValue ?? "—"}" sang "${target.stateName}"`,
        );
        return;
      }
      if (t.requireAttachment) {
        toast.error("Hành động này yêu cầu đính kèm tệp — hãy thực hiện ở trang chi tiết");
        return;
      }
      if (t.requireReason) {
        setPendingTransition({ deal, transition: t });
        return;
      }
      await runTransition(deal, t);
    } catch (err) {
      toast.error(
        (err as any)?.response?.data?.message ||
        (err as any)?.response?.data?.error?.message?.[0] ||
        "Chuyển trạng thái thất bại",
      );
    }
  };

  // Legacy drop path (no workflow configured): PATCH status directly
  const handleDropLegacy = async (deal: Deal, targetStatus: string) => {
    if (deal.status === targetStatus) return;
    try {
      await updateDeal({ id: deal.id, data: { status: targetStatus as UpdateDealDtoStatus } });
      toast.success(`Đã chuyển giao dịch sang "${statusLabel[targetStatus] ?? targetStatus}"`);
      void queryClient.invalidateQueries({ queryKey: getGetApiDealsQueryKey() });
      router.refresh();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Cập nhật trạng thái giao dịch thất bại");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDeal({ id: deleteTarget.id });
      toast.success(`Đã xóa giao dịch "${deleteTarget.dealCode}"`);
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: getGetApiDealsQueryKey() });
      router.refresh();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Xóa giao dịch thất bại");
      console.error(err);
    }
  };

  const columnStateMap = new Map<string, WorkflowState>();
  const columns: KanbanColumn<Deal>[] = hasWorkflow
    ? wfStates.map((s) => {
      const id = `${s.columnName}|${s.stateName}`;
      columnStateMap.set(id, s);
      return {
        id,
        title: s.stateName,
        variant: stateColorVariant[(s.color ?? "").toLowerCase()] ?? "default",
        items: deals.filter((d) => (d as any)[s.columnName] === s.stateName),
      };
    })
    : statusConfig.map((status) => ({
      id: status.id,
      title: status.title,
      variant: status.variant,
      items: deals.filter((d) => d.status === status.id),
    }));

  const renderDealInfo = (deal: Deal) => (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium line-clamp-2">{deal.dealCode}</span>
      <span className="text-xs text-foreground-muted truncate">
        {deal.customer?.fullName ?? "—"}
      </span>
      {deal.property && (
        <span className="text-xs text-foreground-muted truncate">{deal.property.title}</span>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs font-medium tabular-nums">
          {formatPrice(deal.finalValue ?? deal.expectedValue ?? "0")}
        </span>
        <Badge variant="default" className="text-[10px]">
          {txLabel[deal.transactionType] ?? deal.transactionType}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Giao dịch"
        title="Giao dịch"
        description="Quản lý giao dịch theo workflow"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-border p-1">
              <button
                onClick={() => setView("kanban")}
                className={`rounded-sm p-1.5 ${view === "kanban" ? "bg-surface-muted" : "text-foreground-muted"}`}
                aria-label="Kanban"
              >
                <SquareKanban size={16} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-sm p-1.5 ${view === "list" ? "bg-surface-muted" : "text-foreground-muted"}`}
                aria-label="Danh sách"
              >
                <ListIcon size={16} />
              </button>
            </div>
            <Can I="CREATE" a="DEAL">
              <Button onClick={() => router.push(portalPath("/deals/new"))}>
                <Plus size={16} />
                Thêm giao dịch
              </Button>
            </Can>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{deals.length}</span> giao dịch
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={txFilter}
            items={Object.fromEntries(txFilters.map((f) => [f.value, f.label]))}
            onValueChange={(v) => setTxFilter(v ?? "ALL")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả loại GD" />
            </SelectTrigger>
            <SelectContent>
              {txFilters.map((f) => (
                <SelectItem key={f.value} value={f.value} label={f.label}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            items={Object.fromEntries(statusFilters.map((f) => [f.value, f.label]))}
            onValueChange={(v) => setStatusFilter(v ?? "ALL")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((f) => (
                <SelectItem key={f.value} value={f.value} label={f.label}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={<SquareKanban size={24} />}
          title="Chưa có giao dịch"
          description="Thêm giao dịch đầu tiên để bắt đầu quản lý"
          action={
            <Can I="CREATE" a="DEAL">
              <Button onClick={() => router.push(portalPath("/deals/new"))}>
                <Plus size={16} />
                Thêm giao dịch
              </Button>
            </Can>
          }
        />
      ) : (
        <>
          {view === "kanban" ? (
            <KanbanBoard
              columns={columns}
              onCardClick={(deal) => router.push(portalPath(`/deals/${deal.id}`))}
              onDrop={hasWorkflow ? handleDrop : handleDropLegacy}
              renderCard={renderDealInfo}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Mã GD</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Khách hàng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">BĐS</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Loại</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Giá trị</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => {
                      const status = statusConfig.find((s) => s.id === deal.status);
                      return (
                        <tr
                          key={deal.id}
                          onClick={() => router.push(portalPath(`/deals/${deal.id}`))}
                          className="cursor-pointer border-b border-border hover:bg-surface-muted/30"
                        >
                          <td className="px-4 py-3 font-medium tabular-nums">{deal.dealCode}</td>
                          <td className="px-4 py-3">{deal.customer?.fullName ?? "—"}</td>
                          <td className="px-4 py-3 text-foreground-muted truncate max-w-[180px]">
                            {deal.property?.title ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="default" className="text-[10px]">
                              {txLabel[deal.transactionType] ?? deal.transactionType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 tabular-nums font-medium">
                            {formatPrice(deal.finalValue ?? deal.expectedValue ?? "0")}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={status?.variant ?? "default"}>
                              {status?.title ?? deal.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Can I="DELETE_OWN" a="DEAL">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Xóa"
                                onClick={() => setDeleteTarget(deal)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </Can>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                pageSize={pagination.pageSize}
                setPageSize={pagination.setPageSize}
                currentPage={pagination.currentPage}
                setCurrentPage={pagination.setCurrentPage}
                totalPages={totalPages}
              />
            </>
          )}
        </>
      )}

      {/* Reason dialog for transitions that require it */}
      <DealTransitionDialog
        open={!!pendingTransition}
        onOpenChange={(open) => !open && setPendingTransition(null)}
        transition={pendingTransition?.transition}
        executing={executing}
        onConfirm={async (reasonText) => {
          if (!pendingTransition) return;
          setExecuting(true);
          try {
            await runTransition(pendingTransition.deal, pendingTransition.transition, reasonText);
            setPendingTransition(null);
          } catch (err) {
            toast.error(
              (err as any)?.response?.data?.message || "Chuyển trạng thái thất bại",
            );
          } finally {
            setExecuting(false);
          }
        }}
      />

      {/* Delete confirmation dialog */}
      <DeleteDealDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        deal={deleteTarget}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
