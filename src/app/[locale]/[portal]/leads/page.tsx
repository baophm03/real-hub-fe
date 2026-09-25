"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { List as ListIcon, Plus, SquareKanban, Trash2, Users } from "lucide-react";
import { Can } from "@casl/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { usePagination } from "@/lib/hooks/use-pagination";
import { KanbanBoard, type KanbanColumn } from "@/components/shared/kanban-board";
import { LeadTransitionDialog, type LeadTransition } from "./_components/lead-transition-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  useGetApiLeadsAdmin,
  usePatchApiLead,
  getApiLeadTransitions,
  usePostApiLeadTransition,
} from "@/lib/api/endpoints/leads";
import {
  useGetApiWorkflows,
  useGetApiWorkflowIdStates,
} from "@/lib/api/endpoints/workflow";
import type { GetApiLeadsStatus } from "@/lib/api/models/getApiLeadsStatus";
import type { GetApiLeadsSource } from "@/lib/api/models/getApiLeadsSource";
import type { UpdateLeadDtoStatus } from "@/lib/api/models/updateLeadDtoStatus";
import {
  DeleteLeadDialog,
  type LeadDeleteTarget,
} from "./_components/delete-lead-dialog";
import { sourceOptions, type WorkflowState } from "./_components/type";

interface LeadProperty {
  id: string;
  title: string;
  propertyCode: string;
}
interface LeadSales {
  id: string;
  fullName: string;
}

interface Lead extends LeadDeleteTarget {
  customerId: string | null;
  propertyId: string | null;
  source: string;
  assignedSalesId: string | null;
  phoneNormalized: string | null;
  status: string;
  createdAt: string;
  property: LeadProperty | null;
  assignedSales: LeadSales | null;
}

interface LeadsResponse {
  success: boolean;
  data: Lead[];
  meta: { total: number; limit: number; offset: number; page: number; totalPages: number };
  timestamp: string;
}

const statusConfig: {
  id: UpdateLeadDtoStatus;
  title: string;
  variant: "blue" | "yellow" | "purple" | "default" | "green" | "red";
}[] = [
    { id: "NEW", title: "Mới", variant: "blue" },
    { id: "CONTACTED", title: "Đã liên hệ", variant: "yellow" },
    { id: "INTERESTED", title: "Quan tâm", variant: "purple" },
    { id: "NEGOTIATING", title: "Đàm phán", variant: "default" },
    { id: "CONVERTED", title: "Chuyển đổi", variant: "green" },
    { id: "LOST", title: "Mất", variant: "red" },
    { id: "RECYCLED", title: "Khách cũ", variant: "default" },
  ];

const statusLabel: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  INTERESTED: "Quan tâm",
  NEGOTIATING: "Đàm phán",
  CONVERTED: "Chuyển đổi",
  LOST: "Mất",
  RECYCLED: "Khách cũ",
};

const sourceLabel = Object.fromEntries(
  sourceOptions.map((o) => [o.value, o.label]),
);

// ── Workflow-driven kanban ─────────────────────────────

const stateColorVariant: Record<string, KanbanColumn<Lead>["variant"]> = {
  "#6b7280": "default",
  "#3b82f6": "blue",
  "#10b981": "green",
  "#f59e0b": "yellow",
  "#ef4444": "red",
  "#8b5cf6": "purple",
  "#ec4899": "purple",
  "#14b8a6": "green",
};

export default function LeadsPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const pagination = usePagination(10);

  const isList = view === "list";
  const { data: leadsData, isLoading, refetch } = useGetApiLeadsAdmin({
    status: statusFilter === "ALL" ? undefined : (statusFilter as GetApiLeadsStatus),
    source: sourceFilter === "ALL" ? undefined : (sourceFilter as GetApiLeadsSource),
    search: search.trim() || undefined,
    limit: isList ? pagination.limit : "200",
    offset: isList ? pagination.offset : "0",
  });
  const leads = ((leadsData as unknown as LeadsResponse)?.data) || [];
  const totalCount = (leadsData as unknown as LeadsResponse)?.meta?.total ?? leads.length;
  const totalPages =
    (leadsData as unknown as LeadsResponse)?.meta?.totalPages ??
    Math.max(1, Math.ceil(totalCount / pagination.pageSize));

  const { mutateAsync: updateLead } = usePatchApiLead();
  const { mutateAsync: executeTransition } = usePostApiLeadTransition();
  const [pendingTransition, setPendingTransition] = useState<{
    lead: Lead;
    transition: LeadTransition;
  } | null>(null);
  const [executing, setExecuting] = useState(false);

  // Active LEAD workflow → kanban columns from its states
  const { data: workflowsRaw } = useGetApiWorkflows({
    entityType: "LEAD" as any,
    status: "ACTIVE" as any,
  });
  const workflows = Array.isArray(workflowsRaw)
    ? workflowsRaw
    : ((workflowsRaw as any)?.data ?? []);
  const leadWorkflow = workflows[0];

  const { data: wfStatesRaw } = useGetApiWorkflowIdStates(leadWorkflow?.id ?? "", {
    query: { enabled: !!leadWorkflow },
  });
  const wfStates: WorkflowState[] = (Array.isArray(wfStatesRaw)
    ? wfStatesRaw
    : ((wfStatesRaw as any)?.data ?? [])
  ).slice()
    .sort((a: WorkflowState, b: WorkflowState) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const hasWorkflow = wfStates.length > 0;

  // Filters: status from workflow states, source from shared options
  const statusFilters = [
    { value: "ALL", label: "Tất cả trạng thái" },
    ...wfStates
      .filter((s) => s.columnName === "status")
      .map((s) => ({ value: s.stateName, label: s.stateName })),
  ];
  const sourceFilters = [
    { value: "ALL", label: "Tất cả nguồn" },
    ...sourceOptions,
  ];

  const runTransition = async (lead: Lead, t: LeadTransition, reasonText?: string) => {
    await executeTransition({
      id: lead.id,
      data: { transitionId: t.transitionId, reason: reasonText || undefined },
    });
    toast.success(`Đã chuyển sang "${t.actionLabel}"`);
    refetch();
    router.refresh();
  };

  const handleDrop = async (lead: Lead, targetColumnId: string) => {
    const target = columnStateMap.get(targetColumnId);
    if (!target) return;
    const currentValue = (lead as any)[target.columnName];
    if (currentValue === target.stateName) return;
    try {
      const res = (await getApiLeadTransitions(lead.id)) as any;
      const actions: LeadTransition[] = res?.data ?? res ?? [];
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
        setPendingTransition({ lead, transition: t });
        return;
      }
      await runTransition(lead, t);
    } catch (err) {
      toast.error(
        (err as any)?.response?.data?.message ||
        (err as any)?.response?.data?.error?.message?.[0] ||
        "Chuyển trạng thái thất bại",
      );
    }
  };

  // Legacy drop path (no workflow configured): PATCH status directly
  const handleDropLegacy = async (lead: Lead, targetStatus: string) => {
    if (lead.status === targetStatus) return;
    try {
      await updateLead({ id: lead.id, data: { status: targetStatus as UpdateLeadDtoStatus } });
      toast.success(`Đã chuyển lead sang "${statusLabel[targetStatus] ?? targetStatus}"`);
      refetch();
      router.refresh();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error?.message?.[0] || "Cập nhật trạng thái lead thất bại");
      console.error(err);
    }
  };

  const columnStateMap = new Map<string, WorkflowState>();
  const columns: KanbanColumn<Lead>[] = hasWorkflow
    ? wfStates.map((s) => {
      const id = `${s.columnName}|${s.stateName}`;
      columnStateMap.set(id, s);
      return {
        id,
        title: s.stateName,
        variant: stateColorVariant[(s.color ?? "").toLowerCase()] ?? "default",
        items: leads.filter((l) => (l as any)[s.columnName] === s.stateName),
      };
    })
    : statusConfig.map((status) => ({
      id: status.id,
      title: status.title,
      variant: status.variant,
      items: leads.filter((l) => l.status === status.id),
    }));

  const renderLeadInfo = (lead: Lead) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate">
          {lead.customer?.fullName ?? lead.leadCode}
        </span>
        <Badge variant="default" className="shrink-0 text-[10px]">
          {sourceLabel[lead.source] ?? lead.source}
        </Badge>
      </div>
      <span className="text-xs text-foreground-muted tabular-nums">
        {lead.phoneNormalized ?? lead.customer?.phone ?? "—"}
      </span>
      {lead.property && (
        <span className="text-xs text-foreground-muted truncate">{lead.property.title}</span>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-foreground-muted">{lead.leadCode}</span>
        <span className="text-xs text-foreground-muted tabular-nums">
          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("vi-VN") : ""}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="CRM"
        title="Nguồn khách hàng"
        description="Quản lý nguồn khách hàng theo trạng thái"
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
            <Can I="CREATE" a="LEAD">
              <Button onClick={() => router.push(portalPath("/leads/new"))}>
                <Plus size={16} />
                Thêm khách hàng
              </Button>
            </Can>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{leads.length}</span> nguồn khách hàng
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            items={Object.fromEntries(statusFilters.map((f) => [f.value, f.label]))}
            onValueChange={(v) => setStatusFilter(v ?? "ALL")}
          >
            <SelectTrigger className="w-[180px]">
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
          <Select
            value={sourceFilter}
            items={Object.fromEntries(sourceFilters.map((f) => [f.value, f.label]))}
            onValueChange={(v) => setSourceFilter(v ?? "ALL")}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Tất cả nguồn" />
            </SelectTrigger>
            <SelectContent>
              {sourceFilters.map((f) => (
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
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Chưa có nguồn khách hàng"
          description="Thêm nguồn khách hàng đầu tiên để bắt đầu quản lý CRM"
          action={
            <Can I="CREATE" a="LEAD">
              <Button onClick={() => router.push(portalPath("/leads/new"))}>
                <Plus size={16} />
                Thêm khách hàng
              </Button>
            </Can>
          }
        />
      ) : (
        <>
          {view === "kanban" ? (
            <KanbanBoard
              columns={columns}
              onCardClick={(lead) => router.push(portalPath(`/leads/${lead.id}`))}
              onDrop={hasWorkflow ? handleDrop : handleDropLegacy}
              renderCard={renderLeadInfo}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Mã KHTN</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Khách hàng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Điện thoại</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">BĐS</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Nguồn</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const status = statusConfig.find((s) => s.id === lead.status);
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => router.push(portalPath(`/leads/${lead.id}`))}
                          className="cursor-pointer border-b border-border hover:bg-surface-muted/30"
                        >
                          <td className="px-4 py-3 font-medium tabular-nums">{lead.leadCode}</td>
                          <td className="px-4 py-3 font-medium">{lead.customer?.fullName ?? "—"}</td>
                          <td className="px-4 py-3 tabular-nums text-foreground-muted">
                            {lead.phoneNormalized ?? lead.customer?.phone ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-foreground-muted truncate max-w-[180px]">
                            {lead.property?.title ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="default" className="text-[10px]">
                              {sourceLabel[lead.source] ?? lead.source}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={status?.variant ?? "default"}>
                              {status?.title ?? lead.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Can I="DELETE_OWN" a="LEAD">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Xóa"
                                onClick={() => setDeleteTarget(lead)}
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
      <LeadTransitionDialog
        open={!!pendingTransition}
        onOpenChange={(open) => !open && setPendingTransition(null)}
        transition={pendingTransition?.transition}
        executing={executing}
        onConfirm={async (reasonText) => {
          if (!pendingTransition) return;
          setExecuting(true);
          try {
            await runTransition(pendingTransition.lead, pendingTransition.transition, reasonText);
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
      <DeleteLeadDialog
        lead={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onRefetch={refetch}
      />
    </div>
  );
}
