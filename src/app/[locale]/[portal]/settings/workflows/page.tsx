"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GitBranch, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ability } from "@/config/casl/ability";
import {
  useGetApiWorkflows,
  usePostApiWorkflow,
  usePutApiWorkflowId,
  useDeleteApiWorkflowId,
  getGetApiWorkflowsQueryKey,
} from "@/lib/api/endpoints/workflow";
import type { CreateWorkflowDto } from "@/lib/api/models/createWorkflowDto";
import type { UpdateWorkflowDtoStatus } from "@/lib/api/models/updateWorkflowDtoStatus";
import type { GetApiWorkflowsEntityType } from "@/lib/api/models/getApiWorkflowsEntityType";
import type { GetApiWorkflowsStatus } from "@/lib/api/models/getApiWorkflowsStatus";
import { WorkflowCard } from "./_components/workflow-card";
import { WorkflowDetailDialog } from "./_components/workflow-detail-dialog";
import { CreateWorkflowDialog } from "./_components/create-workflow-dialog";
import {
  entityTypeOptions,
  statusFilters,
  type WorkflowDefinition,
} from "./_components/types";

export default function WorkflowsPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkflowDefinition | null>(null);
  const [viewTarget, setViewTarget] = useState<WorkflowDefinition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkflowDefinition | null>(null);

  const queryClient = useQueryClient();
  const canCreate = ability.can("CREATE", "WORKFLOW");
  const canUpdate = ability.can("UPDATE", "WORKFLOW");
  const canDelete = ability.can("DELETE", "WORKFLOW");

  const { data: workflowsRaw, isLoading } = useGetApiWorkflows({
    ...(entityTypeFilter ? { entityType: entityTypeFilter as GetApiWorkflowsEntityType } : {}),
    ...(statusFilter ? { status: statusFilter as GetApiWorkflowsStatus } : {}),
  });

  // BE returns array directly; handle both wrapped and unwrapped
  const workflows: WorkflowDefinition[] = Array.isArray(workflowsRaw)
    ? workflowsRaw
    : ((workflowsRaw as any)?.data ?? []);

  const { mutateAsync: createWorkflow, isPending: isCreating } = usePostApiWorkflow({
    mutation: {
      onSuccess: () => {
        toast.success("Tạo workflow thành công");
        queryClient.invalidateQueries({ queryKey: getGetApiWorkflowsQueryKey() });
        setDialogOpen(false);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message?.[0] || "Có lỗi khi tạo workflow";
        toast.error(msg);
      },
    },
  });

  const { mutateAsync: updateWorkflow, isPending: isUpdating } = usePutApiWorkflowId({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật workflow thành công");
        queryClient.invalidateQueries({ queryKey: getGetApiWorkflowsQueryKey() });
        setEditTarget(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message?.[0] || "Có lỗi khi cập nhật workflow";
        toast.error(msg);
      },
    },
  });

  const { mutateAsync: deleteWorkflow, isPending: isDeleting } = useDeleteApiWorkflowId({
    mutation: {
      onSuccess: () => {
        toast.success("Đã xóa workflow");
        queryClient.invalidateQueries({ queryKey: getGetApiWorkflowsQueryKey() });
        setDeleteTarget(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message?.[0] || "Có lỗi khi xóa workflow";
        toast.error(msg);
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cài đặt"
        title="Cài đặt workflow"
        description="Định nghĩa trạng thái và chuyển trạng thái cho sản phẩm, lead, deal, hoa hồng — cấu hình động theo tenant"
        actions={
          canCreate && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={16} />
              Tạo workflow
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{workflows.length}</span> workflow
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={entityTypeFilter}
            onValueChange={(v) => setEntityTypeFilter((v as string) ?? "")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tất cả đối tượng">
                {(value: string) =>
                  entityTypeOptions.find((o) => o.value === value)?.label || "Tất cả đối tượng"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" label="Tất cả">Tất cả</SelectItem>
              {entityTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} label={o.label}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v as string) ?? "")}
          >
            <SelectTrigger className="w-[160px]">
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={24} />}
          title="Chưa có workflow nào"
          description="Tạo workflow đầu tiên để định nghĩa trạng thái và chuyển trạng thái cho sản phẩm, lead, deal..."
          action={
            canCreate ? (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus size={16} />
                Tạo workflow đầu tiên
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onView={() => setViewTarget(wf)}
              onEdit={canUpdate ? () => setEditTarget(wf) : () => { }}
              onDelete={canDelete ? () => setDeleteTarget(wf) : () => { }}
              onStatusChange={
                canUpdate
                  ? (status) =>
                    updateWorkflow({
                      id: wf.id,
                      data: { status: status as UpdateWorkflowDtoStatus },
                    })
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateWorkflowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (dto: CreateWorkflowDto) => {
          await createWorkflow({ data: dto });
        }}
        isSubmitting={isCreating}
      />

      {/* Edit dialog */}
      <CreateWorkflowDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        initialData={editTarget}
        onSubmit={async (dto: CreateWorkflowDto) => {
          if (!editTarget) return;
          await updateWorkflow({ id: editTarget.id, data: dto });
        }}
        isSubmitting={isUpdating}
      />

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa workflow</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa workflow{" "}
              <span className="font-medium text-foreground">"{deleteTarget?.name}"</span>?
              Hành động này không thể hoàn tác. Tất cả trạng thái và chuyển trạng thái sẽ bị xóa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteWorkflow({ id: deleteTarget.id })}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WorkflowDetailDialog
        workflow={viewTarget}
        open={!!viewTarget}
        onOpenChange={(open) => !open && setViewTarget(null)}
      />
    </div>
  );
}
