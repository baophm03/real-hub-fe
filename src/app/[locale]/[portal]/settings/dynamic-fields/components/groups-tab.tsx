"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MoveHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { GroupFormDialog } from "./group-form-dialog";
import { AssignDefinitionDialog } from "./assign-definition-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { PaginationBar } from "@/components/shared/pagination-bar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useGetApiFieldGroups,
  useGetApiFieldDefinitions,
  usePostApiFieldGroup,
  usePatchApiFieldGroup,
  useDeleteApiFieldGroup,
  putApiFieldGroupFields,
} from "@/lib/api/endpoints/dynamic-fields";
import type { CreateFieldGroupDto, UpdateFieldGroupDto } from "@/lib/api/models";
import type { GetApiFieldGroupsEntityType } from "@/lib/api/models/getApiFieldGroupsEntityType";
import { entityTypeOptions, getEntityTypeLabel } from "./entity-type.constants";

interface FieldGroup {
  id: string;
  name: string;
  code: string;
  entityType: GetApiFieldGroupsEntityType;
  sortOrder?: number;
  status?: string;
  groupItems?: { id: string; field: FieldDefinition }[];
}

interface FieldDefinition {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  entityType: string;
  isRequired?: boolean;
  status?: string;
  groupItems?: { id: string; group: { id: string; name: string } }[];
}

interface GroupsTabProps {
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function GroupsTab({ canCreate = true, canUpdate = true, canDelete = true }: GroupsTabProps) {
  const [entityType, setEntityType] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTargetGroup, setAssignTargetGroup] = useState<FieldGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FieldGroup | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({
    name: "",
    code: "",
    entityType: "PROPERTY",
    sortOrder: 0,
  });

  const { data, isLoading, refetch } = useGetApiFieldGroups(
    entityType ? { entityType: entityType as GetApiFieldGroupsEntityType } : undefined,
  );
  const groups = ((data as any)?.data as FieldGroup[]) || [];

  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
  const pagedGroups = groups.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const { data: defsData, refetch: refetchDefs } = useGetApiFieldDefinitions(
    entityType ? { entityType: entityType as GetApiFieldGroupsEntityType } : undefined,
  );
  const allDefinitions = ((defsData as any)?.data as FieldDefinition[]) || [];

  const { mutateAsync: setGroupFields, isPending: isAssigning } = useMutation({
    mutationFn: (vars: { groupId: string; fieldIds: string[] }) =>
      putApiFieldGroupFields(vars.groupId, { fieldIds: vars.fieldIds } as any),
    onSuccess: () => {
      toast.success("Cập nhật trường của nhóm thành công");
      refetch();
      refetchDefs();
      closeAssignDialog();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi cập nhật");
    },
  });

  const { mutateAsync: createGroup, isPending: isCreating } = usePostApiFieldGroup({
    mutation: {
      onSuccess: () => {
        toast.success("Tạo nhóm thành công");
        closeDialog();
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi tạo nhóm");
      },
    },
  });

  const { mutateAsync: updateGroup, isPending: isUpdating } = usePatchApiFieldGroup({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật nhóm thành công");
        closeDialog();
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi cập nhật nhóm");
      },
    },
  });

  const { mutateAsync: deleteGroup, isPending: isDeleting } = useDeleteApiFieldGroup({
    mutation: {
      onSuccess: () => {
        toast.success("Xóa nhóm thành công");
        setDeleteTarget(null);
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi xóa nhóm");
      },
    },
  });

  const isPending = isCreating || isUpdating;

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ name: "", code: "", entityType: entityType || "PROPERTY", sortOrder: 0 });
    setDialogOpen(true);
  };

  const openEditDialog = (group: FieldGroup) => {
    setEditingId(group.id);
    setForm({
      name: group.name,
      code: group.code,
      entityType: group.entityType,
      sortOrder: group.sortOrder || 0,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ name: "", code: "", entityType: entityType || "PROPERTY", sortOrder: 0 });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteGroup({ id: deleteTarget.id });
  };

  const openAssignDialog = (group: FieldGroup) => {
    setAssignTargetGroup(group);
    setAssignDialogOpen(true);
  };

  const closeAssignDialog = () => {
    setAssignDialogOpen(false);
    setAssignTargetGroup(null);
  };

  const handleAssignSubmit = (fieldIds: string[]) => {
    if (!assignTargetGroup) return;
    setGroupFields({ groupId: assignTargetGroup.id, fieldIds });
  };

  const handleSubmit = () => {
    if (!form.name || !form.code) {
      toast.error("Vui lòng nhập tên và mã nhóm");
      return;
    }
    if (editingId) {
      const dto: UpdateFieldGroupDto = {
        name: form.name,
        code: form.code,
        sortOrder: form.sortOrder,
      };
      updateGroup({ id: editingId, data: dto });
    } else {
      const dto: CreateFieldGroupDto = {
        name: form.name,
        code: form.code,
        entityType: form.entityType as any,
        sortOrder: form.sortOrder,
      };
      createGroup({ data: dto });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{groups.length}</span> nhóm
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={entityType}
            onValueChange={(v) => {
              setEntityType(v as string);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tất cả">
                {(value: string) => {
                  if (!value) return "Tất cả";
                  const opt = entityTypeOptions.find((o) => o.value === value);
                  return opt?.label || value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" label="Tất cả">Tất cả</SelectItem>
              {entityTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus size={16} />
              Thêm nhóm
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-foreground-muted">Chưa có nhóm nào</p>
          {canCreate && (
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus size={16} />
              Tạo nhóm đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã nhóm</TableHead>
                <TableHead>Tên nhóm</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead className="text-center">Số loại dữ liệu</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedGroups.map((group) => {
                const fieldCount = group.groupItems?.length ?? 0;
                return (
                  <TableRow key={group.id}>
                    <TableCell>
                      <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
                        {group.code}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      <Badge variant="blue">
                        {getEntityTypeLabel(group.entityType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => canUpdate && openAssignDialog(group)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium hover:bg-surface-muted disabled:cursor-default disabled:opacity-100"
                        title={canUpdate ? "Click để gán/quản lý loại dữ liệu" : undefined}
                      >
                        <span className={fieldCount > 0 ? "text-foreground" : "text-foreground-muted"}>
                          {fieldCount}
                        </span>
                        {fieldCount > 0 && canUpdate && (
                          <MoveHorizontal size={12} className="text-foreground-muted" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button variant="ghost" size="icon-sm" onClick={() => openAssignDialog(group)} title="Gán loại dữ liệu vào nhóm">
                            <MoveHorizontal size={14} />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(group)}>
                            <Pencil size={14} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(group)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )
      }

      {!isLoading && groups.length > 0 && (
        <PaginationBar
          pageSize={pageSize}
          setPageSize={setPageSize}
          currentPage={page}
          setCurrentPage={setPage}
          totalPages={totalPages}
        />
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa nhóm"
        itemName={deleteTarget?.name}
        isPending={isDeleting}
        onConfirm={handleDelete}
      />

      <GroupFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        isPending={isPending}
        onSubmit={handleSubmit}
        onClose={closeDialog}
      />

      <AssignDefinitionDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        assignTargetGroup={assignTargetGroup}
        allDefinitions={allDefinitions}
        onSubmit={handleAssignSubmit}
        isPending={isAssigning}
      />
    </div >
  );
}
