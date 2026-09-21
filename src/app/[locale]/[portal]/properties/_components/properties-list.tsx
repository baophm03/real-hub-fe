"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import {
  Building2,
  Filter,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { formatPrice, formatLocationShort } from "@/utils";
import { Can } from "@casl/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import type { ColumnDef } from "@tanstack/react-table";
import { useGetApiProperties } from "@/lib/api/endpoints/properties";
import { GetPropertiesResponse, Property } from "@/lib/api/types/properties";
import { DeletePropertyDialog } from "./delete-property-dialog";

const statusVariant: Record<string, "green" | "yellow" | "purple" | "blue" | "outline"> = {
  AVAILABLE: "green",
  RESERVED: "yellow",
  SOLD: "purple",
  RENTED: "blue",
  OFF_MARKET: "outline",
};

const statusLabel: Record<string, string> = {
  AVAILABLE: "Sẵn có",
  RESERVED: "Đặt cọc",
  SOLD: "Đã bán",
  RENTED: "Đã thuê",
  OFF_MARKET: "Ngừng bán",
};

const txLabel: Record<string, string> = {
  SALE: "Bán",
  RENT: "Cho thuê",
  TRANSFER: "Chuyển nhượng",
  INVESTMENT: "Đầu tư",
};

const verificationStatusVariant: Record<
  string,
  "outline" | "yellow" | "green" | "red"
> = {
  DRAFT: "outline",
  PENDING: "yellow",
  VERIFIED: "green",
  REJECTED: "red",
};

const verificationStatusLabel: Record<string, string> = {
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  VERIFIED: "Đã duyệt",
  REJECTED: "Từ chối",
};

export function PropertiesList() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const [search, setSearch] = useState("");
  const [pendingSubmit, setPendingSubmit] = useState<Property | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Property | null>(null);

  const { data: propertiesData } = useGetApiProperties();
  const properties = ((propertiesData as unknown as GetPropertiesResponse)?.data) || [];

  const filtered = useMemo(
    () =>
      properties.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [properties, search],
  );

  const getVerificationStatus = (p: Property) =>
    (p.verificationStatus ?? "DRAFT") as
    | "DRAFT"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED";

  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: "id",
      header: "Mã BĐS",
      cell: ({ row }) => (
        <span className="font-mono text-xs tabular-nums">{row.original.id.slice(0, 8)}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "Tên",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "transactionType",
      header: "Giao dịch",
      cell: ({ row }) => (
        <span className="text-sm text-foreground-muted">{txLabel[row.original.transactionType] ?? row.original.transactionType}</span>
      ),
    },
    {
      accessorKey: "price",
      header: "Giá",
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">{formatPrice(Number(row.original.price || 0))}</span>
      ),
    },
    {
      accessorKey: "area",
      header: "Diện tích",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground-muted">{row.original.area ?? "-"} m²</span>
      ),
    },
    {
      id: "location",
      header: "Vị trí",
      cell: ({ row }) => (
        <span className="text-sm text-foreground-muted">
          {formatLocationShort(row.original)}
        </span>
      ),
    },
    {
      id: "verificationStatus",
      header: "Duyệt",
      cell: ({ row }) => {
        const vStatus = getVerificationStatus(row.original);
        return (
          <Badge variant={verificationStatusVariant[vStatus] ?? "outline"}>
            {verificationStatusLabel[vStatus] ?? vStatus}
          </Badge>
        );
      },
    },
    {
      accessorKey: "businessStatus",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.businessStatus ?? ""] ?? "outline"}>
          {statusLabel[row.original.businessStatus ?? ""] ?? row.original.businessStatus}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }) => {
        const vStatus = getVerificationStatus(row.original);
        const canSubmit = vStatus === "DRAFT" || vStatus === "REJECTED";
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-start gap-2"
          >
            {canSubmit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingSubmit(row.original)}
              >
                <Send size={14} />
                Gửi duyệt
              </Button>
            ) : null}
            <Can I="DELETE_OWN" a="PROPERTY">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Xóa"
                onClick={() => setPendingDelete(row.original)}
              >
                <Trash2 size={14} className="text-destructive" />
              </Button>
            </Can>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-auto min-w-0"
          />
          <Button variant="outline" size="icon" aria-label="Bộ lọc" className="shrink-0">
            <Filter size={16} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Can I="CREATE" a="PROPERTY">
            <Button onClick={() => router.push(portalPath("/properties/new"))}>
              <Plus size={16} />
              Thêm BĐS
            </Button>
          </Can>
        </div>
      </div>

      {filtered.length > 0 ? (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => router.push(portalPath(`/properties/${row.id}`))}
          emptyMessage="Không tìm thấy bất động sản nào"
        />
      ) : (
        <EmptyState
          icon={<Building2 size={24} />}
          title="Chưa có bất động sản"
          description="Tạo bất động sản đầu tiên để bắt đầu bán hàng"
          action={
            <Can I="CREATE" a="PROPERTY">
              <Button onClick={() => router.push(portalPath("/properties/new"))}>
                <Plus size={16} />
                Thêm BĐS
              </Button>
            </Can>
          }
        />
      )}

      <DeletePropertyDialog
        property={pendingDelete}
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      />
    </div>
  );
}
