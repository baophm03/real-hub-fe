"use client";

import { useState } from "react";
import { Inbox, Hand } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { usePagination } from "@/lib/hooks/use-pagination";
import { ability } from "@/config/casl/ability";
import { useGetApiLeadsPool, usePostApiLeadClaim } from "@/lib/api/endpoints/leads";
import type { PoolLead, GetPoolLeadsResponse } from "@/lib/api/types/pool";
import { PoolLeadsTable } from "./_components/pool-leads-table";

export default function PoolPage() {
  const pagination = usePagination(10);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useGetApiLeadsPool({
    search: search.trim() || undefined,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  const leads = (data as unknown as GetPoolLeadsResponse)?.data ?? [];
  const meta = (data as unknown as GetPoolLeadsResponse)?.meta;

  const canClaim = ability.can("CLAIM", "POOL");

  const { mutateAsync: claimLead, isPending: isClaiming } = usePostApiLeadClaim();

  const handleClaim = async (lead: PoolLead) => {
    try {
      await claimLead({ id: lead.id });
      toast.success(`Đã nhận lead ${lead.leadCode}`);
      refetch();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Nhận lead thất bại");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Lead Pool"
        description="Lead chưa được phân bổ — bấm Nhận để tự nhận lead về phụ trách"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{meta?.total ?? leads.length}</span> lead trong pool
        </p>
        <Input
          placeholder="Tìm theo mã lead / SĐT"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[260px]"
        />
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-lg bg-surface-muted" />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<Inbox size={24} />}
          title="Pool đang trống"
          description="Lead từ public website hoặc được trả về sẽ xuất hiện ở đây"
        />
      ) : (
        <PoolLeadsTable
          leads={leads}
          actions={
            canClaim
              ? (lead) => (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isClaiming}
                  onClick={() => handleClaim(lead)}
                >
                  <Hand size={14} />
                  Nhận
                </Button>
              )
              : undefined
          }
        />
      )}

      {leads.length > 0 && (
        <PaginationBar
          pageSize={pagination.pageSize}
          setPageSize={pagination.setPageSize}
          currentPage={pagination.currentPage}
          setCurrentPage={pagination.setCurrentPage}
          totalPages={meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? 0) / pagination.pageSize))}
        />
      )}
    </div>
  );
}
