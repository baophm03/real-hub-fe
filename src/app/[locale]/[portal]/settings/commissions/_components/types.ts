import type { CommissionRuleDto } from "@/lib/api/models/commissionRuleDto";
import type { CommissionSplitDto } from "@/lib/api/models/commissionSplitDto";
import { CircleDashed, Clock, CheckCircle2, Layers } from "lucide-react";

// ── Types ────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  version?: number;
  status: string;
  priority?: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  rules?: Rule[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Rule extends Omit<CommissionRuleDto, "splits" | "conditionsJson"> {
  id?: string;
  dealType?: string;
  propertyTypeId?: string;
  sellingMode?: string;
  splits: Split[];
}

export interface Split extends CommissionSplitDto {
  id?: string;
}

// ── Constants ────────────────────────────────────────────

export const statusConfig: Record<
  string,
  { label: string; variant: "default" | "blue" | "green" | "yellow" | "purple"; icon: typeof Clock }
> = {
  DRAFT: { label: "Bản nháp", variant: "default", icon: CircleDashed },
  PENDING_APPROVAL: { label: "Chờ duyệt", variant: "yellow", icon: Clock },
  ACTIVE: { label: "Đang áp dụng", variant: "green", icon: CheckCircle2 },
  ARCHIVED: { label: "Lưu trữ", variant: "purple", icon: Layers },
};

export const statusOrder = ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "ARCHIVED"];

export const statusFilters: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { value: "ACTIVE", label: "Đang áp dụng" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

export const calculationTypeOptions: { value: string; label: string; hint: string }[] = [
  { value: "PERCENT", label: "Theo phần trăm", hint: "VD: 2.5% giá trị deal" },
  { value: "FIXED_AMOUNT", label: "Số tiền cố định", hint: "VD: 50,000,000 VNĐ" },
  { value: "ONE_MONTH_RENT", label: "1 tháng thuê", hint: "Cho BĐS cho thuê" },
  { value: "HALF_MONTH_RENT", label: "Nửa tháng thuê", hint: "Cho BĐS cho thuê" },
];

export const calculationBaseOptions: { value: string; label: string }[] = [
  { value: "EXPECTED_VALUE", label: "Giá dự kiến" },
  { value: "ACTUAL_VALUE", label: "Giá thực tế" },
  { value: "NET_VALUE", label: "Giá net" },
];

export const receiverTypeOptions: { value: string; label: string }[] = [
  { value: "USER", label: "Người cụ thể" },
  { value: "ROLE", label: "Theo vai trò" },
  { value: "EXTERNAL", label: "Bên ngoài" },
];

export const receiverRoleOptions: { value: string; label: string }[] = [
  { value: "SALES", label: "Sales" },
  { value: "COLLABORATOR", label: "CTV" },
  { value: "TEAM_LEADER", label: "Trưởng nhóm" },
  { value: "AGENCY", label: "Agency / Sàn" },
  { value: "OWNER", label: "Chủ BĐS" },
];

export const splitTypeOptions: { value: string; label: string }[] = [
  { value: "PERCENT", label: "%" },
  { value: "FIXED", label: "Số tiền" },
];

export const dealTypeOptions: { value: string; label: string }[] = [
  { value: "", label: "Tất cả loại giao dịch" },
  { value: "SALE", label: "Bán" },
  { value: "RENT", label: "Cho thuê" },
  { value: "TRANSFER", label: "Chuyển nhượng" },
];

export const sellingModeOptions: { value: string; label: string }[] = [
  { value: "", label: "Tất cả chế độ khai thác" },
  { value: "SELF_SELL", label: "Tự bán" },
  { value: "SALES_DISTRIBUTION", label: "Sales khai thác" },
  { value: "HYBRID", label: "Kết hợp" },
  { value: "INTERNAL_ONLY", label: "Nội bộ" },
  { value: "AGENCY_DISTRIBUTION", label: "Phân phối agency" },
];

// ── Helpers ──────────────────────────────────────────────


export function emptyRule(): Rule {
  return {
    name: "",
    priority: 0,
    dealType: "",
    propertyTypeId: "",
    sellingMode: "",
    calculationType: "PERCENT",
    calculationValue: 0,
    calculationBase: "EXPECTED_VALUE",
    minCommissionAmount: undefined,
    maxCommissionAmount: undefined,
    splits: [emptySplit()],
  };
}

export function emptySplit(): Split {
  return {
    receiverType: "ROLE",
    receiverRole: "SALES",
    splitType: "PERCENT",
    splitValue: 100,
  };
}
