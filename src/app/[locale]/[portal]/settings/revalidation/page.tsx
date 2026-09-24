"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Plus, TimerOff } from "lucide-react";
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
import { ability } from "@/config/casl/ability";
import {
  useGetApiRevalidationPolicies,
  usePostApiRevalidationPolicy,
  usePatchApiRevalidationPolicy,
  useDeleteApiRevalidationPolicy,
  getGetApiRevalidationPoliciesQueryKey,
  useGetApiRevalidationTasks,
  usePatchApiCompleteRevalidationTask,
  usePostApiExpireOverdueRevalidationTasks,
  getGetApiRevalidationTasksQueryKey,
} from "@/lib/api/endpoints/revalidation-property-history";
import { useGetApiPropertyTypes } from "@/lib/api/endpoints/properties";
import type { CreateRevalidationPolicyDto } from "@/lib/api/models/createRevalidationPolicyDto";
import type { UpdateRevalidationPolicyDto } from "@/lib/api/models/updateRevalidationPolicyDto";
import type { UpdateRevalidationPolicyDtoStatus } from "@/lib/api/models/updateRevalidationPolicyDtoStatus";
import type { CompleteRevalidationTaskDtoResult } from "@/lib/api/models/completeRevalidationTaskDtoResult";
import { GetApiRevalidationTasksStatus } from "@/lib/api/models/getApiRevalidationTasksStatus";
import {
  taskStatusLabel,
  type RevalidationPolicy,
  type RevalidationTask,
  type PolicyFormValues,
} from "./_components/types";
import { PoliciesGrid } from "./_components/policies-grid";
import { TasksList } from "./_components/tasks-list";
import { PolicyFormDialog } from "./_components/policy-form-dialog";
import { CompleteTaskDialog } from "./_components/complete-task-dialog";

interface PropertyType {
  id: string;
  name: string;
}

export default function RevalidationSettingsPage() {
  const queryClient = useQueryClient();
  const canManagePolicies = ability.can("CREATE", "SETTING") || ability.can("UPDATE", "SETTING");
  const canUpdateTasks = ability.can("UPDATE", "PROPERTY");

  const [tab, setTab] = useState<"policies" | "tasks">("policies");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RevalidationPolicy | null>(null);
  const [completeTarget, setCompleteTarget] = useState<RevalidationTask | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("");

  const { data: policiesRaw, isLoading: policiesLoading } = useGetApiRevalidationPolicies();
  const policies: RevalidationPolicy[] =
    (policiesRaw as unknown as { data?: RevalidationPolicy[] })?.data ?? [];

  const { data: tasksRaw, isLoading: tasksLoading } = useGetApiRevalidationTasks({
    status: (taskStatusFilter || undefined) as any,
  });
  const tasks: RevalidationTask[] =
    (tasksRaw as unknown as { data?: RevalidationTask[] })?.data ?? [];

  const { data: propertyTypesData } = useGetApiPropertyTypes();
  const propertyTypes: PropertyType[] = ((propertyTypesData as any)?.data as PropertyType[]) || [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetApiRevalidationPoliciesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetApiRevalidationTasksQueryKey() });
  };

  const { mutateAsync: createPolicy, isPending: isCreating } = usePostApiRevalidationPolicy({
    mutation: {
      onSuccess: () => {
        toast.success("Tạo chính sách thành công");
        invalidateAll();
        setCreateOpen(false);
      },
      onError: (e: any) => toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi tạo"),
    },
  });
  const { mutateAsync: updatePolicy, isPending: isUpdating } = usePatchApiRevalidationPolicy({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật thành công");
        invalidateAll();
        setEditTarget(null);
      },
      onError: (e: any) => toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi cập nhật"),
    },
  });
  const { mutateAsync: deletePolicy, isPending: isDeleting } = useDeleteApiRevalidationPolicy({
    mutation: {
      onSuccess: () => {
        toast.success("Đã xóa");
        invalidateAll();
      },
      onError: (e: any) => toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi xóa"),
    },
  });
  const { mutateAsync: completeTask, isPending: isCompleting } = usePatchApiCompleteRevalidationTask({
    mutation: {
      onSuccess: () => {
        toast.success("Đã hoàn thành task");
        invalidateAll();
        setCompleteTarget(null);
      },
      onError: (e: any) => toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi xử lý"),
    },
  });
  const { mutateAsync: expireOverdue, isPending: isExpiring } = usePostApiExpireOverdueRevalidationTasks({
    mutation: {
      onSuccess: () => {
        toast.success("Đã expire các task quá hạn");
        invalidateAll();
      },
      onError: (e: any) => toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi"),
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cài đặt"
        title="Revalidation BĐS"
        description="Chu kỳ xác nhận lại BĐS công khai — đảm bảo tin đăng còn hiệu lực. Task quá hạn tự động EXPIRED."
        actions={
          <div className="flex items-center gap-2">
            {tab === "tasks" && canUpdateTasks && (
              <Button variant="outline" disabled={isExpiring} onClick={() => expireOverdue()}>
                <TimerOff size={16} />
                Expire quá hạn
              </Button>
            )}
            {tab === "policies" && canManagePolicies && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                Tạo chính sách
              </Button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 text-sm w-fit">
        <button
          className={`rounded-md px-3 py-1.5 font-medium transition-colors ${tab === "policies" ? "bg-background text-foreground shadow-sm" : "text-foreground-muted"
            }`}
          onClick={() => setTab("policies")}
        >
          Chính sách ({policies.length})
        </button>
        <button
          className={`rounded-md px-3 py-1.5 font-medium transition-colors ${tab === "tasks" ? "bg-background text-foreground shadow-sm" : "text-foreground-muted"
            }`}
          onClick={() => setTab("tasks")}
        >
          Tasks ({tasks.length})
        </button>
      </div>

      {tab === "policies" ? (
        <>
          {policiesLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-surface-muted" />
              ))}
            </div>
          ) : policies.length === 0 ? (
            <EmptyState
              icon={<RefreshCw size={24} />}
              title="Chưa có chính sách revalidation"
              description="Tạo chính sách để hệ thống tự tạo task xác nhận lại BĐS công khai theo chu kỳ."
              action={
                canManagePolicies ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus size={16} />
                    Tạo chính sách
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <PoliciesGrid
              policies={policies}
              propertyTypes={propertyTypes}
              canUpdate={canManagePolicies}
              canDelete={canManagePolicies}
              onEdit={setEditTarget}
              onDelete={async (p) => {
                if (isDeleting) return;
                await deletePolicy({ id: p.id });
              }}
            />
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Select
              value={taskStatusFilter}
              onValueChange={(v) => setTaskStatusFilter((v as string) ?? "")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tất cả trạng thái">
                  {(value: string) => taskStatusLabel[value] ?? "Tất cả trạng thái"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GetApiRevalidationTasksStatus).map(([k]) => (
                  <SelectItem key={k} value={k} label={taskStatusLabel[k] ?? k}>
                    {taskStatusLabel[k] ?? k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-foreground-muted">
              <span className="font-medium text-foreground">{tasks.length}</span> tasks
            </p>
          </div>

          {tasks.length === 0 && !tasksLoading ? (
            <EmptyState
              icon={<RefreshCw size={24} />}
              title="Không có task"
              description="Chưa có task revalidation nào trong trạng thái này."
            />
          ) : (
            <TasksList
              tasks={tasks}
              isLoading={tasksLoading}
              canUpdate={canUpdateTasks}
              isCompleting={isCompleting}
              onComplete={setCompleteTarget}
            />
          )}
        </>
      )}

      <PolicyFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Tạo chính sách revalidation"
        submitLabel="Tạo"
        isSubmitting={isCreating}
        initial={null}
        onSubmit={async (v: PolicyFormValues) => {
          await createPolicy({
            data: {
              propertyTypeId: v.propertyTypeId || undefined,
              sellingMode: (v.sellingMode || undefined) as CreateRevalidationPolicyDto["sellingMode"],
              revalidateAfterDays: v.revalidateAfterDays,
              expireIfNoResponseDays: v.expireIfNoResponseDays,
            },
          });
        }}
      />

      <PolicyFormDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        title="Cập nhật chính sách"
        submitLabel="Lưu"
        isSubmitting={isUpdating}
        isEdit
        initial={
          editTarget
            ? {
              propertyTypeId: editTarget.propertyTypeId ?? "",
              sellingMode: editTarget.sellingMode ?? "",
              revalidateAfterDays: editTarget.revalidateAfterDays,
              expireIfNoResponseDays: editTarget.expireIfNoResponseDays,
              status: editTarget.status,
            }
            : null
        }
        onSubmit={async (v: PolicyFormValues) => {
          if (!editTarget) return;
          await updatePolicy({
            id: editTarget.id,
            data: {
              revalidateAfterDays: v.revalidateAfterDays,
              expireIfNoResponseDays: v.expireIfNoResponseDays,
              status: v.status as UpdateRevalidationPolicyDtoStatus,
            } as UpdateRevalidationPolicyDto,
          });
        }}
      />

      <CompleteTaskDialog
        task={completeTarget}
        onOpenChange={(o) => !o && setCompleteTarget(null)}
        isSubmitting={isCompleting}
        onSubmit={async (result, note) => {
          if (!completeTarget) return;
          await completeTask({
            id: completeTarget.id,
            data: {
              result: result as CompleteRevalidationTaskDtoResult,
              note: note || undefined,
            },
          });
        }}
      />
    </div>
  );
}
