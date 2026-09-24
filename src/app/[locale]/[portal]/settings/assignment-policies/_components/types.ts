import { CircleDashed, CheckCircle2, Layers, Ban, Clock } from "lucide-react";

export interface AssignmentPolicy {
  id: string;
  tenantId: string;
  name: string;
  propertyTypeId?: string | null;
  transactionType?: string | null;
  sellingMode?: string | null;
  projectId?: string | null;
  zoneId?: string | null;
  maxAssignedUsers: number;
  durationDays: number;
  autoExtendEnabled: boolean;
  autoExtendConditionJson?: any;
  expireBehavior: string;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  propertyType?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
}

export interface PoliciesResponse {
  success: boolean;
  data: AssignmentPolicy[];
  timestamp: string;
}

export interface CreatePolicyDto {
  name: string;
  propertyTypeId?: string | null;
  transactionType?: string | null;
  sellingMode?: string | null;
  projectId?: string | null;
  zoneId?: string | null;
  maxAssignedUsers?: number;
  durationDays?: number;
  autoExtendEnabled?: boolean;
  expireBehavior?: string;
  priority?: number;
}

export const statusConfig: Record<
  string,
  { label: string; variant: "default" | "blue" | "green" | "purple"; icon: typeof Clock }
> = {
  ACTIVE: { label: "Đang áp dụng", variant: "green", icon: CheckCircle2 },
  INACTIVE: { label: "Tắt", variant: "default", icon: Ban },
  DRAFT: { label: "Bản nháp", variant: "default", icon: CircleDashed },
  ARCHIVED: { label: "Lưu trữ", variant: "purple", icon: Layers },
};

export const statusFilters: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang áp dụng" },
  { value: "INACTIVE", label: "Tắt" },
];

export const transactionTypeOptions: { value: string; label: string }[] = [
  { value: "SELL", label: "Bán" },
  { value: "RENT", label: "Cho thuê" },
];

export const sellingModeOptions: { value: string; label: string; hint: string }[] = [
  { value: "SELF_SELL", label: "Tự bán", hint: "Owner tự bán" },
  { value: "SALES_DISTRIBUTION", label: "Phân phối sales", hint: "Sales khai thác" },
  { value: "HYBRID", label: "Kết hợp", hint: "Owner + sales" },
  { value: "INTERNAL_ONLY", label: "Nội bộ", hint: "Chỉ tenant" },
  { value: "MARKETPLACE_PUBLIC", label: "Sàn công khai", hint: "Marketplace public" },
];

export const expireBehaviorOptions: { value: string; label: string; hint: string }[] = [
  { value: "RETURN_TO_POOL", label: "Khôi phục mặc định", hint: "Sản phẩm quay về mặc định, sales khác có thể nhận" },
  { value: "REASSIGN", label: "Tự gán lại", hint: "Gán cho sales tiếp theo trong hàng chờ" },
  { value: "NOTIFY_OWNER", label: "Thông báo chủ sở hữu", hint: "Chủ sở hữu/admin quyết định" },
];


export function emptyPolicy(): CreatePolicyDto {
  return {
    name: "",
    propertyTypeId: null,
    transactionType: null,
    sellingMode: null,
    projectId: null,
    zoneId: null,
    maxAssignedUsers: 1,
    durationDays: 7,
    autoExtendEnabled: false,
    expireBehavior: "RETURN_TO_POOL",
    priority: 0,
  };
}
