"use client";

import { useMemo } from "react";
import { Handshake } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useGetApiCustomersMeDeals } from "@/lib/api/endpoints/customers";
import type { ApiEnvelope, MyDeal } from "@/lib/api/types/customer-portal";
import { formatDateTime, formatPriceWithTransaction as formatPrice } from "@/utils";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  OPEN: { label: "Đang mở", variant: "default" },
  RESERVED: { label: "Đã giữ chỗ", variant: "secondary" },
  DEPOSITED: { label: "Đã đặt cọc", variant: "secondary" },
  SUCCESS: { label: "Thành công", variant: "default" },
  FAILED: { label: "Thất bại", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "outline" },
};

const txLabels: Record<string, string> = {
  SALE: "Mua",
  RENT: "Thuê",
};

export default function MyDealsPage() {
  const pagination = usePagination(10);
  const { data, isLoading } = useGetApiCustomersMeDeals({
    limit: pagination.limit,
    offset: pagination.offset,
  });

  const payload = data as unknown as ApiEnvelope<MyDeal[]> | undefined;
  const items = useMemo(() => payload?.data ?? [], [payload]);
  const totalPages = Math.max(1, Math.ceil((payload?.meta?.total ?? 0) / pagination.pageSize));

  const renderDeal = (deal: MyDeal) => {
    const cfg = statusConfig[deal.status] ?? { label: deal.status, variant: "outline" as const };
    return (
      <Card key={deal.id} className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">{deal.dealCode}</span>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
              <Badge variant="outline">{txLabels[deal.transactionType] ?? deal.transactionType}</Badge>
            </div>
            {deal.property && (
              <span className="text-sm font-medium">{deal.property.title}</span>
            )}
            <div className="flex flex-col gap-0.5 text-sm text-foreground-muted">
              {deal.expectedValue != null && (
                <span>Giá trị dự kiến: {formatPrice(String(deal.expectedValue), deal.transactionType)}</span>
              )}
              {deal.finalValue != null && (
                <span>Giá trị chốt: {formatPrice(String(deal.finalValue), deal.transactionType)}</span>
              )}
              {deal.salesUser && <span>Sales phụ trách: {deal.salesUser.fullName}</span>}
            </div>
          </div>
          <span className="shrink-0 text-xs text-foreground-muted">
            {formatDateTime(deal.updatedAt)}
          </span>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Của tôi"
        title="Giao dịch của tôi"
        description="Theo dõi trạng thái các giao dịch mua/thuê bất động sản"
      />

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-muted" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="flex flex-col gap-4">{items.map(renderDeal)}</div>
          <PaginationBar
            pageSize={pagination.pageSize}
            setPageSize={pagination.setPageSize}
            currentPage={pagination.currentPage}
            setCurrentPage={pagination.setCurrentPage}
            totalPages={totalPages}
          />
        </>
      ) : (
        <EmptyState
          icon={<Handshake size={24} />}
          title="Chưa có giao dịch nào"
          description="Các giao dịch của bạn sẽ hiển thị tại đây khi được khởi tạo"
        />
      )}
    </div>
  );
}
