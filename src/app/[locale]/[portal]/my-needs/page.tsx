"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetApiCustomersMeNeeds,
  usePostApiCustomersMeNeeds,
} from "@/lib/api/endpoints/customers";
import type { CreateMyNeedDto } from "@/lib/api/models";
import type { ApiEnvelope, MyNeed } from "@/lib/api/types/customer-portal";
import { formatDateTime, formatPriceWithTransaction as formatPrice } from "@/utils";

const purposeLabels: Record<string, string> = {
  BUY: "Mua",
  RENT: "Thuê",
  INVEST: "Đầu tư",
  SELL: "Bán",
  LEASE_OUT: "Cho thuê",
};

const purposeOptions = Object.entries(purposeLabels).map(([value, label]) => ({ value, label }));

export default function MyNeedsPage() {
  const { data: needs, isLoading, refetch } = useGetApiCustomersMeNeeds();
  const createNeed = usePostApiCustomersMeNeeds();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState<CreateMyNeedDto["purpose"]>("BUY");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [note, setNote] = useState("");

  const items = useMemo(
    () => (needs as unknown as ApiEnvelope<MyNeed[]> | undefined)?.data ?? [],
    [needs],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: CreateMyNeedDto = {
      purpose,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      areaMin: areaMin ? Number(areaMin) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      note: note.trim() || undefined,
    };
    createNeed.mutate({ data: body }, {
      onSuccess: () => {
        setOpen(false);
        setBudgetMin("");
        setBudgetMax("");
        setAreaMin("");
        setBedrooms("");
        setNote("");
        refetch();
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Của tôi"
        title="Nhu cầu của tôi"
        description="Khai báo nhu cầu mua/thuê để chúng tôi gợi ý sản phẩm phù hợp"
        actions={
          <Button onClick={() => setOpen(true)} leftIcon={<Plus size={16} />}>
            Thêm nhu cầu
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-muted" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((need) => (
            <Card key={need.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {purposeLabels[need.purpose] ?? need.purpose}
                    </Badge>
                    {need.propertyType && (
                      <Badge variant="outline">{need.propertyType.name}</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-col gap-0.5 text-sm text-foreground-muted">
                    {(need.budgetMin || need.budgetMax) && (
                      <span>
                        Ngân sách:{" "}
                        {need.budgetMin ? formatPrice(String(need.budgetMin), "SALE") : "—"}
                        {" → "}
                        {need.budgetMax ? formatPrice(String(need.budgetMax), "SALE") : "—"}
                      </span>
                    )}
                    {need.areaMin != null && <span>Diện tích tối thiểu: {need.areaMin} m²</span>}
                    {need.bedrooms != null && <span>Phòng ngủ: {need.bedrooms}</span>}
                    {need.expectedTime && <span>Thời gian: {need.expectedTime}</span>}
                  </div>
                  {need.note && (
                    <p className="mt-1 text-sm text-foreground-muted line-clamp-2">{need.note}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-foreground-muted">
                  {formatDateTime(need.createdAt)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="Chưa có nhu cầu nào"
          description="Khai báo nhu cầu để nhận gợi ý sản phẩm phù hợp"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhu cầu</DialogTitle>
            <DialogDescription>Mô tả nhu cầu bất động sản của bạn</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Mục đích</Label>
              <Select
                value={purpose}
                onValueChange={(value) => setPurpose(value as CreateMyNeedDto["purpose"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {purposeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Ngân sách tối thiểu (đ)</Label>
                <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Ngân sách tối đa (đ)</Label>
                <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Diện tích tối thiểu (m²)</Label>
                <Input type="number" value={areaMin} onChange={(e) => setAreaMin(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Số phòng ngủ</Label>
                <Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ghi chú</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Vị trí mong muốn, yêu cầu khác..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createNeed.isPending}>
                {createNeed.isPending ? "Đang lưu..." : "Lưu nhu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
