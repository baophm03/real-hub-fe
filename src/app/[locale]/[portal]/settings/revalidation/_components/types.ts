export interface RevalidationPolicy {
  id: string;
  propertyTypeId?: string | null;
  sellingMode?: string | null;
  revalidateAfterDays: number;
  expireIfNoResponseDays: number;
  notifyRolesJson?: unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevalidationTask {
  id: string;
  dueAt: string;
  status: string;
  result: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    propertyCode: string;
    title: string;
    transactionType: string;
    price: string | number | null;
    businessStatus: string;
    publicationStatus: string;
  } | null;
  assignee?: { id: string; fullName: string; email: string; phone: string | null } | null;
}

export const sellingModeLabel: Record<string, string> = {
  SELF_SELL: "Tự bán",
  SALES_DISTRIBUTION: "Phân phối sales",
  HYBRID: "Hybrid",
  INTERNAL_ONLY: "Nội bộ",
  MARKETPLACE_PUBLIC: "Sàn công khai",
};

export const taskStatusLabel: Record<string, string> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang làm",
  COMPLETED: "Hoàn thành",
  EXPIRED: "Hết hạn",
};

export const taskStatusVariant: Record<string, "yellow" | "blue" | "green" | "red"> = {
  PENDING: "yellow",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  EXPIRED: "red",
};

export const taskResultLabel: Record<string, string> = {
  CONFIRMED: "Đã xác nhận",
  UPDATED: "Đã cập nhật",
  EXPIRED: "Hết hạn",
  SKIPPED: "Bỏ qua",
};

export interface PolicyFormValues {
  propertyTypeId: string;
  sellingMode: string;
  revalidateAfterDays: number;
  expireIfNoResponseDays: number;
  status: string;
}

export const defaultPolicyForm: PolicyFormValues = {
  propertyTypeId: "",
  sellingMode: "",
  revalidateAfterDays: 30,
  expireIfNoResponseDays: 14,
  status: "ACTIVE",
};
