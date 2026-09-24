"use client";

import { useMemo } from "react";
import { MailCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useGetApiCustomersMeContacts } from "@/lib/api/endpoints/customers";
import type { ApiEnvelope, MyContact } from "@/lib/api/types/customer-portal";
import { formatDateTime } from "@/utils";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  UNREAD: { label: "Chờ xử lý", variant: "secondary" },
  READ: { label: "Đã tiếp nhận", variant: "default" },
  CONTACTED: { label: "Đã liên hệ", variant: "default" },
  CONVERTED: { label: "Đã chuyển đổi", variant: "default" },
  CLOSED: { label: "Đã đóng", variant: "outline" },
  SPAM: { label: "Spam", variant: "destructive" },
};

export default function MyContactsPage() {
  const pagination = usePagination(10);
  const { data, isLoading } = useGetApiCustomersMeContacts({
    limit: pagination.limit,
    offset: pagination.offset,
  });

  const payload = data as unknown as ApiEnvelope<MyContact[]> | undefined;
  const items = useMemo(() => payload?.data ?? [], [payload]);
  const totalPages = Math.max(1, Math.ceil((payload?.meta?.total ?? 0) / pagination.pageSize));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Của tôi"
        title="Yêu cầu tư vấn"
        description="Các yêu cầu tư vấn bạn đã gửi từ trang chi tiết sản phẩm"
      />

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-muted" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="flex flex-col gap-4">
            {items.map((c: MyContact) => {
              const cfg = statusConfig[c.status] ?? { label: c.status, variant: "outline" as const };
              return (
                <Card key={c.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        {c.property && (
                          <span className="text-sm font-medium">{c.property.title}</span>
                        )}
                      </div>
                      {c.userContent && (
                        <p className="text-sm text-foreground-muted line-clamp-2">{c.userContent}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-foreground-muted">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
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
          icon={<MailCheck size={24} />}
          title="Chưa có yêu cầu nào"
          description="Yêu cầu tư vấn bạn gửi từ trang chi tiết sản phẩm sẽ hiển thị tại đây"
        />
      )}
    </div>
  );
}
