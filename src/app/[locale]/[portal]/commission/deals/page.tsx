"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, FilterX, Plus, Percent, RefreshCw, Settings2 } from "lucide-react";
import { Can } from "@casl/react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { useApiCommissionDeals, useApiCommissionOptions } from "@/lib/api/endpoints/commission-meta";
import { getLeadSourceLabel } from "@/utils/lead-source-labels";
import { CommissionListFilters } from "./_components/commission-list-filters";
import { CommissionWorkflowGuide } from "./_components/commission-workflow-guide";

interface DealCommissionRow {
  id: string;
  status: string;
  commissionType: string;
  zoneId?: string | null;
  projectId?: string | null;
  leadSource?: string | null;
  transactionValueEstimated: string | null;
  transactionValueConfirmed: string | null;
  totalCommissionEstimated: string | null;
  totalCommissionConfirmed: string | null;
  calculationSnapshotJson?: { context?: { zoneName?: string | null; projectName?: string | null } } | null;
  createdAt: string;
  plan?: { id: string; name: string } | null;
  deal?: {
    id: string;
    dealCode: string;
    status: string;
    customer?: { id: string; fullName: string } | null;
    salesUser?: { id: string; fullName: string } | null;
  } | null;
  property?: { id: string; propertyCode: string; title: string; price: string | null } | null;
}

const statusVariant: Record<string, "default" | "green" | "yellow" | "blue" | "red"> = {
  DRAFT: "default",
  ESTIMATED: "blue",
  CONFIRMED: "yellow",
  APPROVED: "green",
  PAID: "green",
  DISPUTED: "red",
  CANCELLED: "default",
};

const formatVnd = (value?: string | null) => {
  if (value == null || value === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount.toLocaleString("vi-VN")} ₫` : value;
};

const ALL = "ALL";
const PAGE_SIZE = 20;

export default function DealCommissionsPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const [status, setStatus] = useState(ALL);
  const [commissionType, setCommissionType] = useState(ALL);
  const [zoneId, setZoneId] = useState(ALL);
  const [projectId, setProjectId] = useState(ALL);
  const [teamId, setTeamId] = useState(ALL);
  const [leadSource, setLeadSource] = useState(ALL);
  const [offset, setOffset] = useState(0);

  const filters = useMemo(() => ({
    status: status === ALL ? undefined : status,
    commissionType: commissionType === ALL ? undefined : commissionType,
    zoneId: zoneId === ALL ? undefined : zoneId,
    projectId: projectId === ALL ? undefined : projectId,
    teamId: teamId === ALL ? undefined : teamId,
    leadSource: leadSource === ALL ? undefined : leadSource,
    limit: PAGE_SIZE,
    offset,
  }), [status, commissionType, zoneId, projectId, teamId, leadSource, offset]);
  const {
    data: optionsEnvelope,
    isError: optionsError,
    isLoading: optionsLoading,
    refetch: refetchOptions,
  } = useApiCommissionOptions();
  const options = optionsEnvelope?.data;
  const { data, isLoading, isError, refetch } = useApiCommissionDeals<DealCommissionRow>(filters);
  const commissions = data?.data ?? [];
  const totalMeta = data?.meta?.total;
  const totalCount = typeof totalMeta === "number" && Number.isFinite(totalMeta)
    ? totalMeta
    : undefined;
  const hasNextPage = totalCount === undefined
    ? commissions.length === PAGE_SIZE
    : offset + commissions.length < totalCount;
  const showPagination = offset > 0 || hasNextPage || (totalCount !== undefined && totalCount > PAGE_SIZE);
  const resultCountLabel = totalCount === undefined
    ? `${commissions.length} khoản trong trang hiện tại`
    : `${totalCount.toLocaleString("vi-VN")} kết quả theo bộ lọc hiện tại`;
  const paginationLabel = commissions.length === 0
    ? "0 khoản ở trang này"
    : totalCount !== undefined
      ? `${offset + 1}–${Math.min(offset + commissions.length, totalCount)} / ${totalCount.toLocaleString("vi-VN")}`
      : `${offset + 1}–${offset + commissions.length} khoản`;
  const statuses = options?.commissionStatuses ?? [];

  const setFilter = (setter: (value: string) => void) => (value: string | null) => {
    setter(value ?? ALL);
    setOffset(0);
  };
  const hasActiveFilters = [status, commissionType, zoneId, projectId, teamId, leadSource].some((value) => value !== ALL);
  const clearFilters = () => {
    setStatus(ALL);
    setCommissionType(ALL);
    setZoneId(ALL);
    setProjectId(ALL);
    setTeamId(ALL);
    setLeadSource(ALL);
    setOffset(0);
  };
  const statusLabel = (value: string) => statuses.find((item) => item.value === value)?.label ?? value;
  const commissionTypeLabel = (value: string) => options?.commissionTypes.find((item) => item.value === value)?.label ?? value;
  const dimensionName = (kind: "zone" | "project", id?: string | null, snapshotName?: string | null) => {
    if (!id) return "—";
    const values = kind === "zone" ? options?.zones : options?.projects;
    return values?.find((item) => item.id === id)?.name ?? snapshotName ?? "—";
  };

  const columns: ColumnDef<DealCommissionRow>[] = [
    {
      accessorKey: "deal.dealCode",
      header: "Giao dịch",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.deal?.dealCode ?? "—"}</span>
          {row.original.deal?.customer?.fullName && <span className="text-xs text-foreground-muted">{row.original.deal.customer.fullName}</span>}
        </div>
      ),
    },
    {
      accessorKey: "property.title",
      header: "Bất động sản",
      cell: ({ row }) => <span className="line-clamp-1 max-w-[220px] font-medium">{row.original.property?.title ?? "—"}</span>,
    },
    {
      id: "commissionType",
      header: "Loại khoản",
      cell: ({ row }) => <span className="text-sm">{commissionTypeLabel(row.original.commissionType)}</span>,
    },
    {
      id: "attribution",
      header: "Phạm vi áp dụng",
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span>{dimensionName("zone", row.original.zoneId, row.original.calculationSnapshotJson?.context?.zoneName)}</span>
          <span className="text-foreground-muted">{dimensionName("project", row.original.projectId, row.original.calculationSnapshotJson?.context?.projectName)} · {getLeadSourceLabel(row.original.leadSource)}</span>
        </div>
      ),
    },
    { accessorKey: "plan.name", header: "Kế hoạch", cell: ({ row }) => <span className="font-medium">{row.original.plan?.name ?? "—"}</span> },
    { accessorKey: "totalCommissionEstimated", header: "Ước tính", cell: ({ row }) => <span className="tabular-nums text-sm">{formatVnd(row.original.totalCommissionEstimated)}</span> },
    { accessorKey: "totalCommissionConfirmed", header: "Đã xác nhận", cell: ({ row }) => <span className="tabular-nums text-sm font-medium text-primary">{formatVnd(row.original.totalCommissionConfirmed)}</span> },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <Badge variant={statusVariant[row.original.status] ?? "default"}>{statusLabel(row.original.status)}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); router.push(portalPath(`/commission/deals/${row.original.id}`)); }}>
          <Eye size={14} /> Xem
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Hoa hồng"
        title="Hoa hồng giao dịch"
        description="Theo dõi từ lúc tính ước lượng đến lúc duyệt và đối soát thanh toán."
        actions={<div className="flex flex-wrap gap-2">
          {options?.capabilities.canManagePlans && <Button variant="outline" onClick={() => router.push(portalPath("/settings/commissions"))}><Settings2 size={16} />Chính sách</Button>}
          <Can I="CREATE" a="COMMISSION"><Button onClick={() => router.push(portalPath("/commission/deals/new"))}><Plus size={16} />Tạo ước tính</Button></Can>
        </div>}
      />

      <CommissionWorkflowGuide
        statuses={options?.commissionStatuses ?? []}
        actions={options?.commissionActions ?? {}}
        isLoading={optionsLoading}
        isError={optionsError}
      />

      {optionsError && <Alert variant="destructive">
        <RefreshCw />
        <AlertTitle>Không tải được tùy chọn lọc</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>Danh sách hoa hồng vẫn có thể xem; hãy thử tải lại metadata nếu bộ lọc chưa đầy đủ.</span>
          <Button variant="outline" size="sm" onClick={() => refetchOptions()}>Thử lại</Button>
        </AlertDescription>
      </Alert>}

      <CommissionListFilters
        options={options}
        optionsError={optionsError}
        optionsLoading={optionsLoading}
        status={status}
        commissionType={commissionType}
        zoneId={zoneId}
        projectId={projectId}
        teamId={teamId}
        leadSource={leadSource}
        hasActiveFilters={hasActiveFilters}
        onStatusChange={setFilter(setStatus)}
        onCommissionTypeChange={setFilter(setCommissionType)}
        onZoneChange={setFilter(setZoneId)}
        onProjectChange={setFilter(setProjectId)}
        onTeamChange={setFilter(setTeamId)}
        onLeadSourceChange={setFilter(setLeadSource)}
        onClear={clearFilters}
      />

      {isLoading && !data ? <div aria-busy="true" aria-label="Đang tải danh sách hoa hồng" className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-4"><div className="h-4 w-40 animate-pulse rounded bg-surface-muted" /><div className="mt-2 h-3 w-64 max-w-full animate-pulse rounded bg-surface-muted" /></div>
        <div className="divide-y divide-border">{[0, 1, 2, 3].map((row) => <div key={row} className="grid grid-cols-2 gap-4 px-5 py-5 sm:grid-cols-4"><div className="h-4 w-32 animate-pulse rounded bg-surface-muted" /><div className="h-4 w-40 animate-pulse rounded bg-surface-muted" /><div className="h-4 w-24 animate-pulse rounded bg-surface-muted" /><div className="h-4 w-20 animate-pulse rounded bg-surface-muted" /></div>)}</div>
      </div> : (
        <section aria-labelledby="commission-list-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="commission-list-title" className="text-base font-semibold">Khoản hoa hồng</h2>
              <p className="mt-1 text-sm text-foreground-muted">{data ? resultCountLabel : "Các khoản được tạo từ giao dịch và chính sách của tenant."}</p>
            </div>
            {data && <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs tabular-nums text-foreground-muted">Trang {Math.floor(offset / PAGE_SIZE) + 1} · {commissions.length} khoản</span>}
          </div>
          {isError && <Alert variant="destructive">
            <RefreshCw />
            <AlertTitle>Không tải được danh sách hoa hồng</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>API đang gặp lỗi hoặc chưa kết nối được. Lỗi này không được trình bày nhầm thành danh sách trống.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
            </AlertDescription>
          </Alert>}
          {commissions.length ? (
            <DataTable columns={columns} data={commissions} onRowClick={(row) => router.push(portalPath(`/commission/deals/${row.id}`))} emptyMessage="Không có hoa hồng nào phù hợp" />
          ) : isError && !data ? null : (
            <div role="status" className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted"><Percent size={22} /></span>
              <h3 className="mt-4 text-base font-semibold">{hasActiveFilters ? "Không có kết quả phù hợp" : "Chưa có khoản hoa hồng"}</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
                {hasActiveFilters
                  ? "Thử đổi điều kiện lọc hoặc xóa bộ lọc."
                  : "Chọn một giao dịch để tạo ước tính. Hệ thống sẽ tự tìm kế hoạch và rule đang hiệu lực, rồi lưu lại cách tính cùng phần chia cho từng người nhận."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {hasActiveFilters ? <Button variant="outline" onClick={clearFilters}><FilterX size={16} />Xóa bộ lọc</Button> : <Can I="CREATE" a="COMMISSION"><Button onClick={() => router.push(portalPath("/commission/deals/new"))}><Plus size={16} />Tạo ước tính từ giao dịch</Button></Can>}
                {!hasActiveFilters && options?.capabilities.canManagePlans && <Button variant="outline" onClick={() => router.push(portalPath("/settings/commissions"))}><Settings2 size={16} />Kiểm tra chính sách</Button>}
              </div>
            </div>
          )}
        </section>
      )}

      {data && showPagination && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>{paginationLabel}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ArrowLeft size={14} />Trước</Button>
            <Button variant="outline" size="sm" disabled={!hasNextPage} onClick={() => setOffset(offset + PAGE_SIZE)}>Tiếp<ArrowRight size={14} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
