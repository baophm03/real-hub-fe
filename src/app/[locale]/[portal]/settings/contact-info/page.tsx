"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Contact } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/shared/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { ability } from "@/config/casl/ability";
import {
  useGetApiContactInfo,
  usePatchApiContactInfoId,
  getGetApiContactInfoQueryKey,
} from "@/lib/api/endpoints/contact-info";
import type { UpdateContactInfoDto } from "@/lib/api/models/updateContactInfoDto";

interface ContactInfoItem {
  id: string;
  key: string;
  value: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const KEY_LABELS: Record<string, string> = {
  phone: "Điện thoại",
  email: "Email",
  address: "Địa chỉ",
};

export default function ContactInfoPage() {
  const queryClient = useQueryClient();
  const canUpdate = ability.can("UPDATE", "CONTACT_INFO");

  const [editTarget, setEditTarget] = useState<ContactInfoItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editActive, setEditActive] = useState(true);

  const { data: raw, isLoading } = useGetApiContactInfo();
  const items: ContactInfoItem[] =
    (raw as unknown as { data?: ContactInfoItem[] })?.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetApiContactInfoQueryKey() });
    queryClient.invalidateQueries({ queryKey: ["getApiContactInfoPublic"] });
  };

  const { mutateAsync: updateContactInfo, isPending: isUpdating } = usePatchApiContactInfoId({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật thành công");
        invalidate();
        setEditTarget(null);
      },
      onError: (e: any) =>
        toast.error(e?.response?.data?.error?.message?.[0] || "Lỗi cập nhật"),
    },
  });

  const openEdit = (item: ContactInfoItem) => {
    setEditTarget(item);
    setEditValue(item.value);
    setEditActive(item.isActive);
  };

  const columns: ColumnDef<ContactInfoItem>[] = [
    {
      accessorKey: "key",
      header: "Key",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium">{row.original.key}</span>
      ),
    },
    {
      accessorKey: "value",
      header: "Giá trị",
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-[320px] text-sm">
          {row.original.value}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "green" : "default"}>
          {row.original.isActive ? "Đang hiển thị" : "Đã ẩn"}
        </Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật lúc",
      cell: ({ row }) => (
        <span className="text-xs text-foreground-muted">
          {new Date(row.original.updatedAt).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sửa"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row.original);
              }}
            >
              <Pencil size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cài đặt"
        title="Thông tin liên hệ"
        description="Số điện thoại, email, địa chỉ hiển thị ở trang liên hệ và footer. Chỉ có thể sửa giá trị và bật/tắt hiển thị — không thể tạo mới hoặc xóa."
      />

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-surface-muted" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Contact size={24} />}
          title="Chưa có thông tin liên hệ"
          description="Chạy seed contact-info để tạo dữ liệu mặc định (phone, email, address)."
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          onRowClick={(row) => canUpdate && openEdit(row)}
          emptyMessage="Không tìm thấy thông tin liên hệ"
        />
      )}

      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              Sửa thông tin: {editTarget ? (KEY_LABELS[editTarget.key] ?? editTarget.key) : ""}
            </DialogTitle>
            <DialogDescription>
              Chỉ có thể thay đổi giá trị và trạng thái hiển thị.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-value">Giá trị</Label>
              <Input
                id="contact-value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Nhập giá trị mới..."
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Hiển thị công khai</span>
                <span className="text-xs text-foreground-muted">
                  Tắt để ẩn thông tin này khỏi trang liên hệ và footer
                </span>
              </div>
              <Switch
                checked={editActive}
                onCheckedChange={setEditActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Hủy
            </Button>
            <Button
              disabled={isUpdating || !editValue.trim()}
              onClick={async () => {
                if (!editTarget) return;
                await updateContactInfo({
                  id: editTarget.id,
                  data: {
                    value: editValue.trim(),
                    isActive: editActive,
                  } as UpdateContactInfoDto,
                });
              }}
            >
              {isUpdating ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
