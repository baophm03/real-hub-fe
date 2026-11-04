"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { FormSection, FormField } from "@/components/shared/form-section";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useGetApiDeals } from "@/lib/api/endpoints/deals-reservations";
import { usePostApiDealCommission } from "@/lib/api/endpoints/commission";
import { useApiCommissionDeals, useApiCommissionOptions } from "@/lib/api/endpoints/commission-meta";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/get-api-error-message";

interface DealRow {
  id: string;
  dealCode: string;
  status: string;
  expectedValue?: string;
  finalValue?: string;
  property?: {
    id: string;
    title: string;
    price?: string;
    sellingMode?: string | null;
    zone?: { id: string; name: string; code: string } | null;
  };
  customer?: { id: string; fullName: string };
}

interface ExistingCommissionSummary {
  id: string;
  status: string;
}

export default function EstimateCommissionPage() {
  const router = useRouter();
  const portalPath = usePortalPath();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState(searchParams.get("dealId") ?? "");
  const [commissionType, setCommissionType] = useState("");

  const { data: dealsData, isLoading: dealsLoading } = useGetApiDeals({
    limit: "50",
    offset: "0",
  });
  const deals = ((dealsData as unknown as { data?: DealRow[] })?.data) ?? [];

  const { mutateAsync: createDc } = usePostApiDealCommission();
  const { data: optionsEnvelope } = useApiCommissionOptions();
  const options = optionsEnvelope?.data;

  useEffect(() => {
    if (!commissionType && options?.commissionTypes[0]) setCommissionType(options.commissionTypes[0].value);
  }, [commissionType, options]);

  // Pre-select deal from query param
  useEffect(() => {
    const qDealId = searchParams.get("dealId");
    if (qDealId && !selectedDealId) setSelectedDealId(qDealId);
  }, [searchParams, selectedDealId]);

  const selectedDeal = deals.find((d) => d.id === selectedDealId);
  const propertyId = selectedDeal?.property?.id ?? "";
  const sellingModeLabel = selectedDeal?.property?.sellingMode
    ? options?.sellingModes.find((mode) => mode.value === selectedDeal.property?.sellingMode)?.label ?? selectedDeal.property.sellingMode
    : "Chưa xác định";
  const dealOptionLabel = (deal: DealRow) => {
    const mode = deal.property?.sellingMode
      ? options?.sellingModes.find((item) => item.value === deal.property?.sellingMode)?.label ?? deal.property.sellingMode
      : "Chưa xác định hình thức khai thác";
    const zone = deal.property?.zone?.name ?? "Chưa gán khu vực";
    return `${deal.dealCode} — ${deal.property?.title ?? "—"} · ${mode} · ${zone}`;
  };

  // Check existing commissions for this deal
  const { data: existingDcs, isLoading: existingCommissionsLoading } = useApiCommissionDeals<ExistingCommissionSummary>(
    { dealId: selectedDealId || undefined, commissionType: commissionType || undefined, limit: 100, offset: 0 },
    Boolean(selectedDealId && commissionType),
  );
  const existingList = existingDcs?.data ?? [];
  const finalizedCommission = existingList.find((commission) => !["DRAFT", "ESTIMATED"].includes(commission.status));
  const openCommission = existingList.find((commission) => ["DRAFT", "ESTIMATED"].includes(commission.status));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealId) {
      toast.error("Vui lòng chọn giao dịch");
      return;
    }
    if (!propertyId) {
      toast.error("Giao dịch không có bất động sản");
      return;
    }
    if (!commissionType) {
      toast.error("Chưa tải được loại khoản hoa hồng từ hệ thống");
      return;
    }
    if (finalizedCommission) {
      toast.error("Khoản hoa hồng này đã được chốt. Hãy mở hồ sơ hiện có để xem.");
      return;
    }
    setLoading(true);
    try {
      const result = await createDc({
        data: {
          dealId: selectedDealId,
          propertyId,
          commissionType,
        },
      });
      const created = (result as any)?.data ?? result;
      const dcId = created?.id;
      if (created?.calculationOutcome === "UNCHANGED") {
        toast.info("Ước tính đã tồn tại và không có thay đổi mới");
      } else if (created?.calculationOutcome === "RECALCULATED") {
        toast.success("Đã cập nhật ước tính theo chính sách hiện hành");
      } else {
        toast.success("Đã tạo ước tính theo chính sách đang áp dụng");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/commission/deals"] });
      if (dcId) {
        router.push(portalPath(`/commission/deals/${dcId}`));
      } else {
        router.push(portalPath("/commission/deals"));
      }
    } catch (err) {
      const code = getApiErrorCode(err);
      const commissionErrorMessages: Record<string, string> = {
        COMMISSION_ALREADY_FINALIZED: "Khoản hoa hồng đã được chốt và không thể tính lại bằng thao tác này.",
        COMMISSION_NO_EFFECTIVE_PLAN: "Không có kế hoạch hoa hồng hiệu lực cho ngày nghiệp vụ của giao dịch.",
        COMMISSION_PROPERTY_SELLING_MODE_REQUIRED: "Bất động sản chưa có hình thức khai thác. Hãy cập nhật bất động sản rồi thử lại.",
        COMMISSION_SELLING_MODE_NO_MATCH: "Chưa có rule phù hợp với hình thức khai thác của bất động sản.",
        COMMISSION_NO_MATCHING_RULE: "Chưa có rule hoa hồng phù hợp với giao dịch và bất động sản đã chọn.",
      };
      toast.error((code && commissionErrorMessages[code]) || getApiErrorMessage(err) || "Có lỗi xảy ra khi tạo ước tính");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(portalPath("/commission/deals"))} className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted" aria-label="Quay lại">
          <ArrowLeft size={20} />
        </button>
        <PageHeader eyebrow="Hoa hồng" title="Tạo ước tính hoa hồng" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormSection
          title="Chọn giao dịch"
          description="Chọn giao dịch để ước tính hoa hồng dựa trên gói đang hoạt động"
        >
          <FormField label="Giao dịch" required>
            {dealsLoading ? (
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <Loader2 size={14} className="animate-spin" />
                Đang tải giao dịch...
              </div>
            ) : deals.length === 0 ? (
              <p className="text-sm text-foreground-muted py-2">
                Không có giao dịch nào. Vui lòng tạo giao dịch trước.
              </p>
            ) : (
              <Select
                value={selectedDealId}
                items={Object.fromEntries(deals.map((d) => [d.id, dealOptionLabel(d)]))}
                onValueChange={(v) => v && setSelectedDealId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn giao dịch..." />
                </SelectTrigger>
                <SelectContent>
                  {deals.map((d) => (
                    <SelectItem
                      key={d.id}
                      value={d.id}
                      label={dealOptionLabel(d)}
                    >
                      {dealOptionLabel(d)}
                      {d.customer?.fullName ? ` (${d.customer.fullName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormField label="Loại khoản hoa hồng" required>
            <Select value={commissionType} onValueChange={(value) => value && setCommissionType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn loại khoản">
                  {(value: string) =>
                    options?.commissionTypes.find((type) => type.value === value)?.label ??
                    "Loại khoản không khả dụng"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(options?.commissionTypes ?? []).map((type) => <SelectItem key={type.value} value={type.value} label={type.label}>{type.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>

          {selectedDeal && (
            <div className="rounded-lg border border-border bg-surface-muted/40 p-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-foreground-muted">Mã giao dịch</span>
                  <p className="font-medium">{selectedDeal.dealCode}</p>
                </div>
                <div>
                  <span className="text-xs text-foreground-muted">Bất động sản</span>
                  <p className="font-medium">{selectedDeal.property?.title ?? "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-foreground-muted">Hình thức khai thác</span>
                  <p className="font-medium">{sellingModeLabel}</p>
                </div>
                <div>
                  <span className="text-xs text-foreground-muted">Khu vực áp dụng chính sách</span>
                  <p className="font-medium">{selectedDeal.property?.zone?.name ?? "Chưa gán khu vực"}</p>
                </div>
                <div>
                  <span className="text-xs text-foreground-muted">Khách hàng</span>
                  <p className="font-medium">{selectedDeal.customer?.fullName ?? "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-foreground-muted">Trạng thái</span>
                  <p className="font-medium">{selectedDeal.status}</p>
                </div>
                {selectedDeal.expectedValue && (
                  <div>
                    <span className="text-xs text-foreground-muted">Giá trị dự kiến</span>
                    <p className="font-medium tabular-nums">
                      {Number(selectedDeal.expectedValue).toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                )}
                {selectedDeal.finalValue && (
                  <div>
                    <span className="text-xs text-foreground-muted">Giá trị cuối</span>
                    <p className="font-medium tabular-nums">
                      {Number(selectedDeal.finalValue).toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {finalizedCommission ? (
            <div className="flex flex-col gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <p>Giao dịch đã có khoản hoa hồng ở trạng thái {options?.commissionStatuses.find((item) => item.value === finalizedCommission.status)?.label ?? finalizedCommission.status}. Không thể tính lại hoặc mở lại khoản đã chốt bằng thao tác tạo ước tính.</p>
              {finalizedCommission.id && <Button type="button" variant="outline" className="w-fit" onClick={() => router.push(portalPath(`/commission/deals/${finalizedCommission.id}`))}>Xem khoản hoa hồng hiện có</Button>}
            </div>
          ) : openCommission ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
              Đã có bản nháp ước tính cho giao dịch này. Hệ thống chỉ tăng revision và ghi ledger khi căn cứ tính thay đổi; gửi lại cùng dữ liệu sẽ giữ nguyên kết quả.
            </div>
          ) : null}
        </FormSection>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push(portalPath("/commission/deals"))}>Hủy</Button>
          <Button type="submit" disabled={loading || !selectedDealId || existingCommissionsLoading || Boolean(finalizedCommission)}>
            {loading ? "Đang tính..." : openCommission ? "Cập nhật ước tính" : "Tạo ước tính"}
          </Button>
        </div>
      </form>
    </div>
  );
}
