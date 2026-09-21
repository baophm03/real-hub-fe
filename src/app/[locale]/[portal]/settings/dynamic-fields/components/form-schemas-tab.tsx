"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useGetApiFormSchemas,
  usePostApiFormSchema,
  usePatchApiFormSchema,
  useDeleteApiFormSchema,
  useGetApiFieldDefinitions,
} from "@/lib/api/endpoints/dynamic-fields";
import { useGetApiPropertyTypes } from "@/lib/api/endpoints/properties";
import type { CreateFormSchemaDto, UpdateFormSchemaDto, FormSchemaFieldDto } from "@/lib/api/models";
import type { GetApiFormSchemasEntityType } from "@/lib/api/models/getApiFormSchemasEntityType";
import { FormSchemaDialog } from "./form-schema-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { entityTypeOptions, getEntityTypeLabel } from "./entity-type.constants";

interface FormSchema {
  id: string;
  name: string;
  entityType: string;
  propertyType?: { id: string; name: string; code: string } | null;
  status?: string;
  version?: number;
  fields?: {
    id: string;
    isRequired?: boolean;
    isVisible?: boolean;
    isReadonly?: boolean;
    sortOrder?: number;
    field?: { id: string; fieldLabel: string; fieldKey: string; fieldType: string };
    group?: { id: string; name: string } | null;
  }[];
}

interface FieldDefinition {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  entityType: string;
  group?: { id: string; name: string } | null;
}

type PropertyType = {
  id: string;
  name: string;
  code: string;
};

interface FormSchemasTabProps {
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function FormSchemasTab({ canCreate = true, canUpdate = true, canDelete = true }: FormSchemasTabProps) {
  const [entityType, setEntityType] = useState<string>("");
  const [propertyTypeId, setPropertyTypeId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    entityType: "PROPERTY" as GetApiFormSchemasEntityType,
    propertyTypeId: "",
  });
  const [selectedFields, setSelectedFields] = useState<FormSchemaFieldDto[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<FormSchema | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: propertyTypesData } = useGetApiPropertyTypes();
  const propertyTypes = ((propertyTypesData as any)?.data as PropertyType[]) || [];

  const { data, isLoading, refetch } = useGetApiFormSchemas(
    entityType ? { entityType: entityType as GetApiFormSchemasEntityType, ...(propertyTypeId ? { propertyTypeId } : {}) } : undefined,
  );
  const schemas = ((data as any)?.data as FormSchema[]) || [];

  const totalPages = Math.max(1, Math.ceil(schemas.length / pageSize));
  const pagedSchemas = schemas.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const { data: definitionsData } = useGetApiFieldDefinitions(
    form.entityType
      ? {
        entityType: form.entityType as GetApiFormSchemasEntityType,
        ...(form.propertyTypeId ? { propertyTypeId: form.propertyTypeId } : {}),
      }
      : undefined,
  );
  const definitions = ((definitionsData as any)?.data as FieldDefinition[]) || [];

  const { mutateAsync: createSchema, isPending: isCreating } = usePostApiFormSchema({
    mutation: {
      onSuccess: () => {
        toast.success("Tạo đối tượng áp dụng thành công");
        closeDialog();
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi tạo đối tượng áp dụng");
      },
    },
  });

  const { mutateAsync: updateSchema, isPending: isUpdating } = usePatchApiFormSchema({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật đối tượng áp dụng thành công");
        closeDialog();
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi cập nhật đối tượng áp dụng");
      },
    },
  });

  const { mutateAsync: deleteSchema, isPending: isDeleting } = useDeleteApiFormSchema({
    mutation: {
      onSuccess: () => {
        toast.success("Xóa đối tượng áp dụng thành công");
        setDeleteTarget(null);
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message?.[0] || "Có lỗi xảy ra khi xóa đối tượng áp dụng");
      },
    },
  });

  const isPending = isCreating || isUpdating;

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ name: "", entityType: (entityType || "PROPERTY") as GetApiFormSchemasEntityType, propertyTypeId: propertyTypeId || "" });
    setSelectedFields([]);
    setDialogOpen(true);
  };

  const openEditDialog = (schema: FormSchema) => {
    setEditingId(schema.id);
    setForm({ name: schema.name, entityType: schema.entityType as GetApiFormSchemasEntityType, propertyTypeId: schema.propertyType?.id || "" });
    setSelectedFields(
      (schema.fields || []).map((f) => ({
        fieldId: f.field?.id,
        groupId: f.group?.id,
        isRequired: f.isRequired,
        isVisible: f.isVisible,
        isReadonly: f.isReadonly,
        sortOrder: f.sortOrder,
      })),
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ name: "", entityType: (entityType || "PROPERTY") as GetApiFormSchemasEntityType, propertyTypeId: "" });
    setSelectedFields([]);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSchema({ id: deleteTarget.id });
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Vui lòng nhập tên đối tượng áp dụng");
      return;
    }
    if (editingId) {
      const dto: UpdateFormSchemaDto = {
        name: form.name,
        propertyTypeId: form.propertyTypeId || "null",
        fields: selectedFields,
      };
      updateSchema({ id: editingId, data: dto });
    } else {
      const dto: CreateFormSchemaDto = {
        name: form.name,
        entityType: form.entityType,
        propertyTypeId: form.propertyTypeId || "null",
        fields: selectedFields.length > 0 ? selectedFields : undefined,
      };
      createSchema({ data: dto });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-medium text-foreground">{schemas.length}</span> đối tượng áp dụng
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={entityType}
            onValueChange={(v) => {
              setEntityType(v as string);
              setPropertyTypeId("");
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
          {entityType === "PROPERTY" && (
            <Select
              value={propertyTypeId}
              onValueChange={(v) => {
                setPropertyTypeId(v as string);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tất cả loại BĐS">
                  {(value: string) => {
                    if (!value) return "Tất cả loại BĐS";
                    const pt = propertyTypes.find((p) => p.id === value);
                    return pt?.name || value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" label="Tất cả loại BĐS">Tất cả loại BĐS</SelectItem>
                {propertyTypes.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id} label={pt.name}>
                    {pt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canCreate && (
            <Button onClick={openCreateDialog}>
              <Plus size={16} />
              Thêm đối tượng áp dụng
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </div>
      ) : schemas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-foreground-muted">Chưa có đối tượng áp dụng nào</p>
          {canCreate && (
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus size={16} />
              Tạo đối tượng áp dụng đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên đối tượng áp dụng</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Loại BĐS</TableHead>
                <TableHead>Phiên bản</TableHead>
                <TableHead className="text-center">Số loại dữ liệu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSchemas.map((schema) => {
                const fieldCount = schema.fields?.length ?? 0;
                return (
                  <TableRow key={schema.id}>
                    <TableCell className="font-medium">{schema.name}</TableCell>
                    <TableCell>
                      <Badge variant="blue">
                        {getEntityTypeLabel(schema.entityType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-foreground-muted">
                      {schema.entityType === "PROPERTY"
                        ? (propertyTypes.find((p) => p.id === schema.propertyType?.id)?.name || "Tất cả loại BĐS")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-foreground-muted">
                      v{schema.version ?? 1}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => canUpdate && openEditDialog(schema)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium hover:bg-surface-muted disabled:cursor-default disabled:opacity-100"
                        title={canUpdate ? "Click để chỉnh sửa fields" : undefined}
                      >
                        <span className={fieldCount > 0 ? "text-foreground" : "text-foreground-muted"}>
                          {fieldCount}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={schema.status === "ACTIVE" ? "green" : "default"}>
                        {schema.status === "ACTIVE" ? "Hoạt động" : schema.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(schema)}>
                            <Pencil size={14} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(schema)}>
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

      {!isLoading && schemas.length > 0 && (
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
        title="Xóa đối tượng áp dụng"
        itemName={deleteTarget?.name}
        isPending={isDeleting}
        onConfirm={handleDelete}
      />

      <FormSchemaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        propertyTypes={propertyTypes}
        definitions={definitions}
        selectedFields={selectedFields}
        setSelectedFields={setSelectedFields}
        isPending={isPending}
        onSubmit={handleSubmit}
        onClose={closeDialog}
      />
    </div>
  );
}
