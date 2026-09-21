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
import {
  useGetApiDeals,
  usePatchApiDeal,
  useDeleteApiDeal,
  getGetApiDealsQueryKey,
} from "@/lib/api/endpoints/deals-reservations";
import type { GetApiDealsStatus } from "@/lib/api/models/getApiDealsStatus";
import type { UpdateDealDtoStatus } from "@/lib/api/models/updateDealDtoStatus";
import { DeleteDealDialog } from "./_components/delete-deal-dialog";

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

const txLabel: Record<string, string> = {
  SALE: "Bán",
  RENT: "Cho thuê",
  TRANSFER: "Chuyển nhượng",
};

const statusFilters: { value: GetApiDealsStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "SOFT_RESERVED", label: "Đặt cọc" },
  { value: "NEGOTIATING", label: "Đàm phán" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Hủy" },
  { value: "DISPUTED", label: "Tranh chấp" },
];

export default function DealsPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [statusFilter, setStatusFilter] = useState<GetApiDealsStatus | "ALL">("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const pagination = usePagination(10);

  const isList = view === "list";
  const { data: dealsData, isLoading } = useGetApiDeals({
    status: statusFilter === "ALL" ? undefined : (statusFilter as GetApiDealsStatus),
    limit: isList ? pagination.limit : "200",
    offset: isList ? pagination.offset : "0",
  });
  const deals = ((dealsData as unknown as DealsResponse)?.data) || [];
  const totalCount = (dealsData as unknown as DealsResponse)?.meta?.total ?? deals.length;
  const totalPages =
    (dealsData as unknown as DealsResponse)?.meta?.totalPages ??
    Math.max(1, Math.ceil(totalCount / pagination.pageSize));

  const { mutateAsync: updateDeal } = usePatchApiDeal();
  const { mutateAsync: deleteDeal, isPending: isDeleting } = useDeleteApiDeal();

  const handleDrop = async (deal: Deal, targetStatus: string) => {
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

  const columns: KanbanColumn<Deal>[] = statusConfig.map((status) => ({
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
            value={statusFilter}
            items={Object.fromEntries(statusFilters.map((f) => [f.value, f.label]))}
            onValueChange={(v) => setStatusFilter((v ?? "ALL") as GetApiDealsStatus | "ALL")}
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
              onDrop={handleDrop}
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
