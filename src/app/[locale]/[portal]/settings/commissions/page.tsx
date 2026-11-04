"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, TrendingUp, Trash2, Pencil, MoreVertical, CheckCircle2, Layers, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ability } from "@/config/casl/ability";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  usePostApiCommissionPlan,
  usePatchApiCommissionPlanId,
  usePatchApiCommissionPlanStatus,
  useDeleteApiCommissionPlanId,
} from "@/lib/api/endpoints/commission";
import { useApiCommissionOptions, useApiCommissionPlans } from "@/lib/api/endpoints/commission-meta";
import { getLeadSourceLabel } from "@/utils/lead-source-labels";
import type { CreateCommissionPlanDto } from "@/lib/api/models/createCommissionPlanDto";
import type { UpdateCommissionPlanDto } from "@/lib/api/models/updateCommissionPlanDto";
import { PlanFormDialog, type PlanFormSubmission } from "./_components/plan-form-dialog";
import { StatusConfirmDialog, type StatusConfirmData } from "./_components/status-confirm-dialog";
import { DeletePlanDialog } from "./_components/delete-plan-dialog";
import { statusConfig, type Plan } from "./_components/types";
import { formatDate } from "@/utils";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CommissionsSettingsPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const hasCreatePermission = ability.can("CREATE", "COMMISSION");
  const hasApprovePermission = ability.can("APPROVE", "COMMISSION");
  const hasReadPermission = ability.can("READ", "COMMISSION");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [offset, setOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [clonePlan, setClonePlan] = useState<Plan | null>(null);
  const [viewPlan, setViewPlan] = useState<Plan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<StatusConfirmData | null>(null);

  const queryClient = useQueryClient();
  const { data: optionsEnvelope } = useApiCommissionOptions();
  const options = optionsEnvelope?.data;
  const canCreate = hasCreatePermission && Boolean(options?.capabilities.canManagePlans);
  const canApprove = hasApprovePermission && Boolean(options?.capabilities.canApprovePlans);
  const canReadAll = Boolean(options?.capabilities.canReadAllPlans);

  const { data: plansRaw, isLoading } = useApiCommissionPlans<Plan>({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    limit: 50,
    offset,
  });
  const allPlans = plansRaw?.data ?? [];
  const totalPlans = plansRaw?.meta?.total ?? allPlans.length;
  const planStatusOptions = options?.planStatuses ?? [];
  const invalidatePlans = () => queryClient.invalidateQueries({ queryKey: ["/api/commission/plans"] });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allPlans;
    return allPlans.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [allPlans, search]);

  const { mutateAsync: createPlan, isPending: isCreating } = usePostApiCommissionPlan({
    mutation: {
      onSuccess: () => {
        toast.success("Tạo kế hoạch hoa hồng thành công");
        invalidatePlans();
        setDialogOpen(false);
        setClonePlan(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message?.[0] || "Có lỗi khi tạo kế hoạch";
        toast.error(msg);
      },
    },
  });

  const { mutateAsync: updatePlan, isPending: isUpdatingPlan } = usePatchApiCommissionPlanId({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật kế hoạch thành công");
        invalidatePlans();
        setEditPlan(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message?.[0] || "Có lỗi khi cập nhật kế hoạch";
        toast.error(msg);
      },
    },
  });

  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = usePatchApiCommissionPlanStatus({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật trạng thái thành công");
        invalidatePlans();
        setConfirmDialog(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message?.[0] || "Có lỗi khi đổi trạng thái";
        toast.error(msg);
      },
    },
  });

  const { mutateAsync: deletePlan, isPending: isDeleting } = useDeleteApiCommissionPlanId({
    mutation: {
      onSuccess: () => {
        toast.success("Đã xóa kế hoạch");
        invalidatePlans();
        setDeleteTarget(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message?.[0] || "Không thể xóa kế hoạch";
        toast.error(msg);
      },
    },
  });

  const handleStatusTransition = (plan: Plan, next: { status: string; action: string; label: string }) => {
    setConfirmDialog({
      title: next.label,
      description: `Thực hiện “${next.label}” với kế hoạch "${plan.name}"?`,
      confirmLabel: next.label,
      action: async () => {
        await updateStatus({ id: plan.id, data: { status: next.status } });
      },
    });
  };

  const getPlanStatusLabel = (status: string) =>
    planStatusOptions.find((option) => option.value === status)?.label ?? status;

  const handleEditSubmit = async (dto: PlanFormSubmission) => {
    if (!editPlan) return;
    const updateData: UpdateCommissionPlanDto = {
      name: dto.name,
      description: dto.description,
      priority: dto.priority,
      effectiveFrom: dto.effectiveFrom,
      effectiveTo: dto.effectiveTo ?? undefined,
      rules: dto.rules,
    };
    // The API explicitly accepts null to clear the optional end date. The generated
    // client model still types this field as string-only until OpenAPI is regenerated.
    if (dto.effectiveTo === null) {
      await updatePlan({ id: editPlan.id, data: { ...updateData, effectiveTo: null } as unknown as UpdateCommissionPlanDto });
      return;
    }
    await updatePlan({ id: editPlan.id, data: updateData });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deletePlan({ id: deleteTarget.id });
  };

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: "name",
      header: "Tên kế hoạch",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.original.name}</span>
          {row.original.description && (
            <span className="text-xs text-foreground-muted line-clamp-1">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "version",
      header: "Phiên bản",
      cell: ({ row }) => (
        <span className="font-mono text-xs tabular-nums">v{row.original.version ?? 1}</span>
      ),
    },
    {
      id: "rules",
      header: "Rule / Split",
      cell: ({ row }) => {
        const ruleCount = row.original.rules?.length ?? 0;
        const splitCount =
          row.original.rules?.reduce((acc, r) => acc + (r.splits?.length ?? 0), 0) ?? 0;
        return (
          <span className="tabular-nums text-sm text-foreground-muted">
            {ruleCount} rule · {splitCount} split
          </span>
        );
      },
    },
    {
      accessorKey: "effectiveFrom",
      header: "Hiệu lực",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums text-foreground-muted">
          {formatDate(row.original.effectiveFrom)} → {formatDate(row.original.effectiveTo)}
        </span>
      ),
    },
    {
      accessorKey: "priority",
      header: "Ưu tiên",
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">
          {row.original.priority && row.original.priority !== 0 ? row.original.priority : "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status] ?? { variant: "default" as const, icon: Layers };
        const Icon = cfg.icon;
        return (
          <Badge variant={cfg.variant} className="text-[10px]">
            <Icon size={10} />
            {getPlanStatusLabel(row.original.status)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const plan = row.original;
        const transition = options?.planTransitions.find((entry) => entry.from === plan.status);
        const actions = transition?.to ?? [];
        const planStatus = planStatusOptions.find((option) => option.value === plan.status);
        const canEditPlan = canCreate && Boolean(planStatus?.canEdit) && (plan._count?.dealCommissions ?? 0) === 0;
        const canDeletePlan = canApprove && Boolean(planStatus?.canDelete) && (plan._count?.dealCommissions ?? 0) === 0;
        if (!hasReadPermission && !canApprove && !canCreate) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-surface-muted"
                  aria-label="Thao tác"
                  onClick={(e: any) => e.stopPropagation()}
                />
              }
            >
              <MoreVertical size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasReadPermission && <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); setViewPlan(plan); }}>Chi tiết</DropdownMenuItem>}
              {canCreate && <DropdownMenuItem onClick={(e: any) => { e.stopPropagation(); setClonePlan(plan); }}>Sao chép thành bản nháp</DropdownMenuItem>}
              {(hasReadPermission || canCreate) && <DropdownMenuSeparator />}
              {canApprove && actions.map((action) => (
                <DropdownMenuItem
                  key={action.action}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    handleStatusTransition(plan, action);
                  }}
                >
                  {action.action === "ARCHIVE" ? <Layers size={14} /> : <CheckCircle2 size={14} />}
                  {action.label}
                </DropdownMenuItem>
              ))}
              {canEditPlan && (
                <>
                  {(canApprove && actions.length > 0) ? (
                    <DropdownMenuSeparator />
                  ) : null}
                  <DropdownMenuItem
                    onClick={(e: any) => {
                      e.stopPropagation();
                      setEditPlan(plan);
                    }}
                  >
                    <Pencil size={14} />
                    Sửa
                  </DropdownMenuItem>
                </>
              )}
              {canDeletePlan && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    setDeleteTarget(plan);
                  }}
                >
                  <Trash2 size={14} />
                  Xóa
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cài đặt"
        title="Chính sách hoa hồng"
        description="Cấu hình công thức tính hoa hồng (kế hoạch, rule, split). Áp dụng cho giao dịch ở mục Hoa hồng"
        actions={
          <div className="flex flex-wrap gap-2">
            {canReadAll && <Button variant="secondary" onClick={() => router.push(portalPath("/settings/commissions/zones"))}><MapPin size={16} /> Khu vực</Button>}
            {canCreate && <Button onClick={() => setDialogOpen(true)}><Plus size={16} />Thêm kế hoạch</Button>}
          </div>
        }
      />

      {/* Count + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{filtered.length}</span> kế hoạch trên trang · {totalPlans} tổng cộng
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Tìm kiếm kế hoạch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-[280px]"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter((v as string) ?? "ALL");
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-[180px] shrink-0">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" label="Tất cả trạng thái">Tất cả trạng thái</SelectItem>
              {planStatusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value} label={status.label}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table / Empty */}
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-surface-muted" />
      ) : filtered.length > 0 ? (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(plan) => {
            if (hasReadPermission) setViewPlan(plan);
          }}
          emptyMessage="Không tìm thấy kế hoạch nào"
        />
      ) : (
        <EmptyState
          icon={<TrendingUp size={24} />}
          title="Chưa có kế hoạch hoa hồng"
          description="Tạo kế hoạch đầu tiên để cấu hình % hoa hồng cho sales, CTV, team leader, agency"
          action={
            canCreate ? (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus size={16} />
                Tạo kế hoạch đầu tiên
              </Button>
            ) : undefined
          }
        />
      )}

      {totalPlans > 50 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>{offset + 1}–{Math.min(offset + allPlans.length, totalPlans)} / {totalPlans}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}><ArrowLeft size={14} />Trước</Button>
            <Button variant="outline" size="sm" disabled={offset + 50 >= totalPlans} onClick={() => setOffset(offset + 50)}>Tiếp<ArrowRight size={14} /></Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (dto: PlanFormSubmission) => {
          await createPlan({ data: { ...dto, effectiveTo: dto.effectiveTo ?? undefined } as CreateCommissionPlanDto });
        }}
        isSubmitting={isCreating}
      />

      {/* Edit dialog */}
      {editPlan && (
        <PlanFormDialog
          open={!!editPlan}
          onOpenChange={(open) => !open && setEditPlan(null)}
          initialPlan={editPlan}
          onSubmit={handleEditSubmit}
          isSubmitting={isUpdatingPlan}
        />
      )}

      {clonePlan && (
        <PlanFormDialog
          open={Boolean(clonePlan)}
          onOpenChange={(open) => !open && setClonePlan(null)}
          initialPlan={clonePlan}
          mode="clone"
          onSubmit={async (dto: PlanFormSubmission) => { await createPlan({ data: { ...dto, effectiveTo: dto.effectiveTo ?? undefined } as CreateCommissionPlanDto }); }}
          isSubmitting={isCreating}
        />
      )}

      <Dialog open={Boolean(viewPlan)} onOpenChange={(open) => !open && setViewPlan(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewPlan?.name} · v{viewPlan?.version ?? 1}</DialogTitle>
            <DialogDescription>{viewPlan?.description || "Chi tiết điều kiện, công thức và người nhận của từng rule."}</DialogDescription>
          </DialogHeader>
          {viewPlan && <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground-muted">
              <Badge variant={statusConfig[viewPlan.status]?.variant ?? "default"}>{getPlanStatusLabel(viewPlan.status)}</Badge>
              <span>Hiệu lực: {formatDate(viewPlan.effectiveFrom)} → {formatDate(viewPlan.effectiveTo)}</span>
              <span>Ưu tiên: {viewPlan.priority ?? 0}</span>
              <span>{viewPlan._count?.dealCommissions ?? 0} khoản đã tham chiếu</span>
            </div>
            {(viewPlan.rules ?? []).map((rule, index) => {
              const label = (items: Array<{ value: string; label: string }> | undefined, value?: string | null) => value ? items?.find((item) => item.value === value)?.label ?? value : "Mọi giá trị";
              const zoneName = options?.zones.find((item) => item.id === rule.zoneId)?.name ?? (rule.zoneId ? "Khu vực đã lưu" : undefined);
              const projectName = options?.projects.find((item) => item.id === rule.projectId)?.name ?? (rule.projectId ? "Dự án đã lưu" : undefined);
              const propertyTypeName = options?.propertyTypes.find((item) => item.id === rule.propertyTypeId)?.name ?? (rule.propertyTypeId ? "Loại BĐS đã lưu" : undefined);
              return <section key={rule.id ?? index} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-medium">{index + 1}. {rule.name}</h3><p className="mt-1 text-xs text-foreground-muted">Ưu tiên rule: {rule.priority ?? 0}</p></div>
                  <Badge variant="outline">{label(options?.commissionTypes, rule.commissionType)}</Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div><p className="text-xs text-foreground-muted">Loại giao dịch</p><p>{label(options?.dealTypes, rule.dealType)}</p></div>
                  <div><p className="text-xs text-foreground-muted">Loại bất động sản</p><p>{propertyTypeName ?? "Mọi loại"}</p></div>
                  <div><p className="text-xs text-foreground-muted">Hình thức bán</p><p>{label(options?.sellingModes, rule.sellingMode)}</p></div>
                  <div><p className="text-xs text-foreground-muted">Khu vực</p><p>{zoneName ?? "Mọi khu vực"}</p></div>
                  <div><p className="text-xs text-foreground-muted">Dự án</p><p>{projectName ?? "Mọi dự án"}</p></div>
                  <div><p className="text-xs text-foreground-muted">Nguồn lead</p><p>{rule.leadSource ? getLeadSourceLabel(rule.leadSource) : "Mọi nguồn"}</p></div>
                  <div><p className="text-xs text-foreground-muted">Cách tính / cơ sở</p><p>{label(options?.calculationTypes, rule.calculationType)} · {label(options?.calculationBases, rule.calculationBase)}</p></div>
                  <div><p className="text-xs text-foreground-muted">Giá trị / tỷ lệ</p><p className="tabular-nums">{rule.calculationValue}{rule.calculationType === "PERCENT" ? "%" : " ₫"}</p></div>
                  <div><p className="text-xs text-foreground-muted">Giới hạn tối thiểu / tối đa</p><p className="tabular-nums">{rule.minCommissionAmount ?? "—"} / {rule.maxCommissionAmount ?? "—"}</p></div>
                </div>
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">Người nhận / tỷ lệ chia</p>
                  <div className="flex flex-col gap-2">
                    {(rule.splits ?? []).map((split, splitIndex) => {
                      const recipient = split.receiverName || (split.receiverUserId ? "Người dùng được chọn" : label(options?.receiverRoles, split.receiverRole) !== "Mọi giá trị" ? label(options?.receiverRoles, split.receiverRole) : label(options?.receiverTypes, split.receiverType));
                      const splitKind = label(options?.splitTypes, split.splitType);
                      const value = split.splitType === "PERCENT" ? `${split.splitValue}%` : `${Number(split.splitValue).toLocaleString("vi-VN")} ₫`;
                      return <div key={split.id ?? splitIndex} className="flex items-center justify-between gap-3 text-sm"><span>{recipient} <span className="text-xs text-foreground-muted">· {splitKind}</span></span><span className="tabular-nums font-medium">{value}</span></div>;
                    })}
                  </div>
                </div>
              </section>;
            })}
            {canCreate && <div className="flex justify-end"><Button variant="secondary" onClick={() => { setViewPlan(null); setClonePlan(viewPlan); }}>Sao chép thành bản nháp</Button></div>}
          </div>}
        </DialogContent>
      </Dialog>

      {/* Status change confirm */}
      <StatusConfirmDialog
        data={confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
        isPending={isUpdatingStatus}
      />

      {/* Delete confirm */}
      <DeletePlanDialog
        plan={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
}
