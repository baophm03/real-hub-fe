"use client";

import { useMemo } from "react";
import { useGetApiFormSchemas } from "@/lib/api/endpoints/dynamic-fields";

interface DynamicField {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  options?: { id: string; label: string; value: string; sortOrder?: number }[];
}

interface FormSchemaField {
  id: string;
  isVisible?: boolean;
  sortOrder?: number;
  field?: DynamicField;
}

interface FormSchema {
  id: string;
  entityType: string;
  propertyType?: { id: string } | null;
  fields?: FormSchemaField[];
}

interface DynamicValuesDisplayProps {
  entityType: string;
  values?: Record<string, unknown> | null;
  title?: string;
}

function formatValue(field: DynamicField, value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;

  const optionLabel = (v: unknown) =>
    field.options?.find((o) => o.value === v)?.label ?? String(v);

  switch (field.fieldType) {
    case "BOOLEAN":
      return value ? "Có" : "Không";
    case "SELECT":
    case "RADIO":
      return optionLabel(value);
    case "MULTI_SELECT":
    case "CHECKBOX":
      return Array.isArray(value)
        ? value.map(optionLabel).join(", ")
        : String(value);
    case "DATE": {
      const d = new Date(value as string);
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("vi-VN");
    }
    case "DATETIME": {
      const d = new Date(value as string);
      return isNaN(d.getTime()) ? String(value) : d.toLocaleString("vi-VN");
    }
    case "MONEY": {
      const n = Number(value);
      return isNaN(n) ? String(value) : n.toLocaleString("vi-VN");
    }
    case "JSON":
      return typeof value === "string" ? value : JSON.stringify(value);
    default:
      return Array.isArray(value) ? value.join(", ") : String(value);
  }
}

export function DynamicValuesDisplay({
  entityType,
  values,
  title = "Thông tin bổ sung",
}: DynamicValuesDisplayProps) {
  const { data: schemasData, isLoading } = useGetApiFormSchemas({
    entityType: entityType as any,
  });

  const items = useMemo(() => {
    const schemas = ((schemasData as any)?.data as FormSchema[]) || [];
    const fields = schemas
      .filter((s) => !s.propertyType)
      .flatMap((schema) =>
        (schema.fields || [])
          .filter((f) => f.isVisible !== false && f.field)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((f) => f.field!),
      );

    return fields
      .map((field) => ({
        key: field.id,
        label: field.fieldLabel,
        value: formatValue(field, values?.[field.fieldKey]),
      }))
      .filter((item) => item.value !== null);
  }, [schemasData, values]);

  if (isLoading || items.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {item.label}
            </span>
            <span className="text-sm">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
