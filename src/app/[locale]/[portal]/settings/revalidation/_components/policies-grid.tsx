"use client";

import { RefreshCw, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { sellingModeLabel, type RevalidationPolicy } from "./types";

interface PropertyType {
  id: string;
  name: string;
}

interface Props {
  policies: RevalidationPolicy[];
  propertyTypes: PropertyType[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (p: RevalidationPolicy) => void;
  onDelete: (p: RevalidationPolicy) => void;
}

export function PoliciesGrid({ policies, propertyTypes, canUpdate, canDelete, onEdit, onDelete }: Props) {
  const typeName = (id?: string | null) =>
    id ? propertyTypes.find((t) => t.id === id)?.name ?? id : "Mọi loại BĐS";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {policies.map((p) => (
        <Card key={p.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-foreground-muted" />
                  {typeName(p.propertyTypeId)}
                </CardTitle>
                <CardDescription>
                  {p.sellingMode ? sellingModeLabel[p.sellingMode] ?? p.sellingMode : "Mọi selling mode"}
                </CardDescription>
              </div>
              <Badge variant={p.status === "ACTIVE" ? "green" : "default"}>
                {p.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-foreground-muted">Revalidate sau</p>
                <p className="font-medium tabular-nums">{p.revalidateAfterDays} ngày</p>
              </div>
              <div>
                <p className="text-foreground-muted">Task hết hạn</p>
                <p className="font-medium tabular-nums">{p.expireIfNoResponseDays} ngày</p>
              </div>
            </div>
            {(canUpdate || canDelete) && (
              <div className="mt-3 flex items-center justify-end gap-1">
                {canUpdate && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
                    <Pencil size={14} />
                    Sửa
                  </Button>
                )}
                {canDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(p)}>
                    <Trash2 size={14} />
                    Xóa
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
