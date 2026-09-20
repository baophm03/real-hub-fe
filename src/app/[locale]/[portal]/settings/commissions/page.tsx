"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, TrendingUp, Trash2, Pencil, MoreVertical, CheckCircle2, Layers } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Can } from "@casl/react";
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
  useGetApiCommissionPlans,
  usePostApiCommissionPlan,
  usePatchApiCommissionPlanId,
  usePatchApiCommissionPlanStatus,
  useDeleteApiCommissionPlanId,
  getGetApiCommissionPlansQueryKey,
} from "@/lib/api/endpoints/commission";
import type { CreateCommissionPlanDto } from "@/lib/api/models/createCommissionPlanDto";
import type { UpdateCommissionPlanDto } from "@/lib/api/models/updateCommissionPlanDto";
import { PlanFormDialog } from "./_components/plan-form-dialog";
import { StatusConfirmDialog, type StatusConfirmData } from "./_components/status-confirm-dialog";
import { DeletePlanDialog } from "./_components/delete-plan-dialog";
import { statusConfig, statusFilters, statusOrder, type Plan } from "./_components/types";
import { formatDate } from "@/utils";

export default function CommissionsSettingsPage() {
  const canCreate = ability.can("CREATE", "COMMISSION");
  const canApprove = ability.can("APPROVE", "COMMISSION");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<StatusConfirmData | null>(null);

  const queryClient = useQueryClient();

  const { data: plansRaw, isLoading } = useGetApiCommissionPlans(
    statusFilter ? { status: statusFilter as any } : undefined,
  );
  const allPlans = ((plansRaw as { data?: Plan[] } | undefined)?.data) ?? [];

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
        queryClient.invalidateQueries({ queryKey: getGetApiCommissionPlansQueryKey() });
        setDialogOpen(false);
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
        queryClient.invalidateQueries({ queryKey: getGetApiCommissionPlansQueryKey() });
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
        queryClient.invalidateQueries({ queryKey: getGetApiCommissionPlansQueryKey() });
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
        queryClient.invalidateQueries({ queryKey: getGetApiCommissionPlansQueryKey() });
        setDeleteTarget(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message?.[0] || "Không thể xóa kế hoạch";
        toast.error(msg);
      },
    },
  });

  const handleAdvanceStatus = (plan: Plan) => {
    const idx = statusOrder.indexOf(plan.status);
    const next = statusOrder[idx + 1];
    if (!next) return;
    setConfirmDialog({
      title: `Đổi trạng thái kế hoạch`,
      description: `Đổi kế hoạch "${plan.name}" thành "${statusConfig[next].label}"?`,
      confirmLabel: plan.status === "DRAFT" ? "Gửi duyệt" : "Kích hoạt",
      action: async () => {
        await updateStatus({ id: plan.id, data: { status: next } });
      },
    });
  };

  const handleArchive = (plan: Plan) => {
    setConfirmDialog({
      title: "Lưu trữ kế hoạch",
      description: `Lưu trữ kế hoạch "${plan.name}"? Kế hoạch sẽ không còn hiệu lực.`,
      confirmLabel: "Lưu trữ",
      action: async () => {
        await updateStatus({ id: plan.id, data: { status: "ARCHIVED" } });
      },
    });
  };

  const handleReactivate = (plan: Plan) => {
    setConfirmDialog({
      title: "Kích hoạt lại kế hoạch",
      description: `Kích hoạt lại kế hoạch "${plan.name}"? Kế hoạch sẽ áp dụng cho các giao dịch mới.`,
      confirmLabel: "Kích hoạt",
      action: async () => {
        await updateStatus({ id: plan.id, data: { status: "ACTIVE" } });
      },
    });
  };

  const handleEditSubmit = async (dto: CreateCommissionPlanDto) => {
    if (!editPlan) return;
    const updateData: UpdateCommissionPlanDto = {
      name: dto.name,
      description: dto.description,
      priority: dto.priority,
      effectiveFrom: dto.effectiveFrom,
      effectiveTo: dto.effectiveTo,
      rules: dto.rules,
    };
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
        const cfg = statusConfig[row.original.status] ?? statusConfig.DRAFT;
        const Icon = cfg.icon;
        return (
          <Badge variant={cfg.variant} className="text-[10px]">
            <Icon size={10} />
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const plan = row.original;
        const canAdvance = plan.status !== "ACTIVE" && plan.status !== "ARCHIVED";
        const canArchive = plan.status === "ACTIVE";
        const canReactivate = plan.status === "ARCHIVED";
        const canEditPlan = canCreate && plan.status !== "ACTIVE";
        const canDeletePlan = canApprove && plan.status !== "ACTIVE";
        if (!canApprove && !canCreate) return null;

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
              {canApprove && canAdvance && (
                <DropdownMenuItem
                  onClick={(e: any) => {
                    e.stopPropagation();
                    handleAdvanceStatus(plan);
                  }}
                >
                  <CheckCircle2 size={14} />
                  {plan.status === "DRAFT" ? "Gửi duyệt" : "Kích hoạt"}
                </DropdownMenuItem>
              )}
              {canApprove && canArchive && (
                <DropdownMenuItem
                  onClick={(e: any) => {
                    e.stopPropagation();
                    handleArchive(plan);
                  }}
                >
                  <Layers size={14} />
                  Lưu trữ
                </DropdownMenuItem>
              )}
              {canApprove && canReactivate && (
                <DropdownMenuItem
                  onClick={(e: any) => {
                    e.stopPropagation();
                    handleReactivate(plan);
                  }}
                >
                  <CheckCircle2 size={14} />
                  Kích hoạt lại
                </DropdownMenuItem>
              )}
              {canEditPlan && (
                <>
                  {(canApprove && (canAdvance || canArchive || canReactivate)) ? (
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
          <Can I="CREATE" a="COMMISSION">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={16} />
              Thêm kế hoạch
            </Button>
          </Can>
        }
      />

      {/* Count + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{filtered.length}</span> kế hoạch
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
            onValueChange={(v) => setStatusFilter((v as string) ?? "")}
          >
            <SelectTrigger className="w-[180px] shrink-0">
              <SelectValue placeholder="Tất cả trạng thái">
                {(value: string) =>
                  statusFilters.find((s) => s.value === value)?.label || "Tất cả trạng thái"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((s) => (
                <SelectItem key={s.value} value={s.value} label={s.label}>
                  {s.label}
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
          onRowClick={(plan) => setEditPlan(plan)}
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

      {/* Create dialog */}
      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (dto: CreateCommissionPlanDto) => {
          await createPlan({ data: dto });
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
