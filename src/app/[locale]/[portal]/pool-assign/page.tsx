"use client";

import { useState } from "react";
import { Inbox, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useGetApiLeadsPool } from "@/lib/api/endpoints/leads";
import type { PoolLead, GetPoolLeadsResponse } from "@/lib/api/types/pool";
import { PoolLeadsTable } from "../pool/_components/pool-leads-table";
import { AssignLeadDialog } from "./_components/assign-lead-dialog";

export default function PoolManagePage() {
  const pagination = usePagination(10);
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] = useState<PoolLead | null>(null);

  const { data, isLoading, refetch } = useGetApiLeadsPool({
    search: search.trim() || undefined,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  const leads = (data as unknown as GetPoolLeadsResponse)?.data ?? [];
  const meta = (data as unknown as GetPoolLeadsResponse)?.meta;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Phân bổ lead"
        description="Phân bổ lead trong pool cho sales hoặc team"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{meta?.total ?? leads.length}</span> lead chờ phân bổ
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
          actions={(lead) => (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignTarget(lead)}
            >
              <UserPlus size={14} />
              Phân bổ
            </Button>
          )}
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

      <AssignLeadDialog
        lead={assignTarget}
        open={!!assignTarget}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        onAssigned={refetch}
      />
    </div>
  );
}
