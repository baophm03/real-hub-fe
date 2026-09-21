"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useGetApiFieldDefinitions,
  usePostApiFieldDefinition,
  useDeleteApiFieldDefinition,
  patchApiFieldDefinition,
} from "@/lib/api/endpoints/dynamic-fields";
import { useGetApiPropertyTypes } from "@/lib/api/endpoints/properties";
import type { CreateFieldDefinitionDto, FieldOptionDto, UpdateFieldDefinitionDto } from "@/lib/api/models";
import type { GetApiFieldDefinitionsEntityType } from "@/lib/api/models/getApiFieldDefinitionsEntityType";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FieldDefinitionDialog } from "./field-definition-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { entityTypeOptions, getEntityTypeLabel } from "./entity-type.constants";

const fieldTypeLabels: Record<string, string> = {
  TEXT: "Text ngắn",
  TEXTAREA: "Text dài",
  NUMBER: "Số",
  MONEY: "Tiền tệ",
  BOOLEAN: "Đúng/Sai",
  DATE: "Ngày",
  DATETIME: "Ngày + giờ",
  SELECT: "Chọn 1",
  MULTI_SELECT: "Chọn nhiều",
  RADIO: "Radio",
  CHECKBOX: "Checkbox",
  FILE: "File",
  IMAGE: "Hình ảnh",
  LOCATION: "Vị trí",
  JSON: "JSON",
};

const fieldTypesWithOptions = ["SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX"];

interface FieldDefinition {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  entityType: string;
  groupItems?: { id: string; group: { id: string; name: string; code: string } }[];
  isRequired?: boolean;
  isFilterable?: boolean;
  isPublic?: boolean;
  isSensitive?: boolean;
  defaultValue?: string | null;
  sortOrder?: number;
  status?: string;
  options?: { id: string; label: string; value: string; sortOrder?: number }[];
}

type PropertyType = {
  id: string;
  name: string;
  code: string;
};

interface DefinitionsTabProps {
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function DefinitionsTab({ canCreate = true, canUpdate = true, canDelete = true }: DefinitionsTabProps) {
  const [entityType, setEntityType] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<FieldDefinition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FieldDefinition | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, refetch } = useGetApiFieldDefinitions(
    entityType ? { entityType: entityType as GetApiFieldDefinitionsEntityType } : undefined,
  );
  const definitions = ((data as any)?.data as FieldDefinition[]) || [];

  const totalPages = Math.max(1, Math.ceil(definitions.length / pageSize));
  const pagedDefinitions = definitions.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const { data: propertyTypesData } = useGetApiPropertyTypes();
  const propertyTypes = ((propertyTypesData as any)?.data as PropertyType[]) || [];

  const { mutateAsync: createDefinition, isPending: isCreating } = usePostApiFieldDefinition({
    mutation: {
      onSuccess: () => {
        toast.success("Tạo loại dữ liệu thành công");
        closeDialog();
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi tạo loại dữ liệu");
      },
    },
  });

  const { mutateAsync: updateDefinition, isPending: isUpdating } = useMutation({
    mutationFn: (vars: { id: string; data: UpdateFieldDefinitionDto }) =>
      patchApiFieldDefinition(vars.id, vars.data),
    onSuccess: () => {
      toast.success("Cập nhật loại dữ liệu thành công");
      closeDialog();
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi cập nhật loại dữ liệu");
    },
  });

  const { mutateAsync: deleteDefinition, isPending: isDeleting } = useDeleteApiFieldDefinition({
    mutation: {
      onSuccess: () => {
        toast.success("Xóa loại dữ liệu thành công");
        setDeleteTarget(null);
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi xóa loại dữ liệu");
      },
    },
  });

  const isPending = isCreating || isUpdating;

  const openCreateDialog = () => {
    setEditingDef(null);
    setDialogOpen(true);
  };

  const openEditDialog = (def: FieldDefinition) => {
    setEditingDef(def);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDef(null);
  };

  const handleSubmit = ({
    editingId,
    form,
    options,
  }: {
    editingId: string | null;
    form: {
      fieldKey: string;
      fieldLabel: string;
      fieldType: string;
      entityType: string;
      isRequired: boolean;
      isFilterable: boolean;
      isPublic: boolean;
      isSensitive: boolean;
      defaultValue: string;
      sortOrder: number;
    };
    options: FieldOptionDto[];
  }) => {
    if (!form.fieldKey || !form.fieldLabel) {
      toast.error("Vui lòng nhập field key và field label");
      return;
    }
    if (editingId) {
      const updateDto: UpdateFieldDefinitionDto = {
        fieldLabel: form.fieldLabel,
        isRequired: form.isRequired,
        isFilterable: form.isFilterable,
        isPublic: form.isPublic,
        isSensitive: form.isSensitive,
        defaultValue: form.defaultValue || undefined,
        sortOrder: form.sortOrder,
        options: fieldTypesWithOptions.includes(form.fieldType) && options.length > 0
          ? options
          : undefined,
      };
      updateDefinition({ id: editingId, data: updateDto });
    } else {
      const createDto: CreateFieldDefinitionDto = {
        fieldKey: form.fieldKey,
        fieldLabel: form.fieldLabel,
        fieldType: form.fieldType as any,
        entityType: form.entityType as any,
        isRequired: form.isRequired,
        isFilterable: form.isFilterable,
        isPublic: form.isPublic,
        isSensitive: form.isSensitive,
        defaultValue: form.defaultValue || undefined,
        sortOrder: form.sortOrder,
        options: fieldTypesWithOptions.includes(form.fieldType) && options.length > 0
          ? options
          : undefined,
      };
      createDefinition({ data: createDto });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{definitions.length}</span> loại dữ liệu
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
              Thêm loại dữ liệu
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
      ) : definitions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-foreground-muted">Chưa có loại dữ liệu nào</p>
          {canCreate && (
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus size={16} />
              Tạo loại dữ liệu đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã định dạng</TableHead>
                <TableHead>Tên loại dữ liệu</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedDefinitions.map((def) => {
                return (
                  <TableRow key={def.id}>
                    <TableCell>
                      <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
                        {def.fieldKey}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{def.fieldLabel}</TableCell>
                    <TableCell>
                      <Badge variant="purple">{fieldTypeLabels[def.fieldType] || def.fieldType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="blue">{getEntityTypeLabel(def.entityType)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-foreground-muted">
                      {def.groupItems && def.groupItems.length > 0
                        ? def.groupItems.map((gi: any) => gi.group.name).join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {def.isRequired && <Badge variant="red">Bắt buộc</Badge>}
                        {def.isFilterable && <Badge variant="yellow">Lọc</Badge>}
                        {def.isPublic && <Badge variant="green">Công khai</Badge>}
                        {def.isSensitive && <Badge variant="red">Nhạy cảm</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(def)}>
                            <Pencil size={14} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(def)}>
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
      )}

      {!isLoading && definitions.length > 0 && (
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
        title="Xóa loại dữ liệu"
        itemName={deleteTarget?.fieldLabel}
        isPending={isDeleting}
        onConfirm={() => {
          if (deleteTarget) deleteDefinition({ id: deleteTarget.id });
        }}
      />

      <FieldDefinitionDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
        editingDef={editingDef}
        entityType={entityType as GetApiFieldDefinitionsEntityType}
        propertyTypes={propertyTypes}
        isPending={isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
