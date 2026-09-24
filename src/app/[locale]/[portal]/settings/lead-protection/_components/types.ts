export interface LeadProtectionPolicy {
  id: string;
  name: string;
  source?: string | null;
  propertyTypeId?: string | null;
  sellingMode?: string | null;
  customerType?: string | null;
  protectionDays: number;
  inactiveReclaimDays: number;
  allowReassign: boolean;
  priority: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDispute {
  id: string;
  conflictType: string;
  relatedUserId: string | null;
  reason: string | null;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  lead: {
    id: string;
    leadCode: string;
    source: string;
    phoneNormalized: string;
    protectionUntil: string | null;
    status: string;
    creator?: { id: string; fullName: string } | null;
  };
  requester?: { id: string; fullName: string; email: string } | null;
}

export const sourceLabel: Record<string, string> = {
  WEBSITE: "Website",
  PROPERTY_DETAIL: "Trang BĐS",
  OWNER_PAGE: "Trang chủ nhà",
  SALES_LINK: "Link sales",
  CTV_LINK: "Link CTV",
  AGENCY_MARKETING: "Marketing agency",
  MANUAL_INPUT: "Nhập tay",
  LEAD_POOL: "Lead pool",
  IMPORT: "Import",
};

export const sellingModeLabel: Record<string, string> = {
  SELF_SELL: "Tự bán",
  SALES_DISTRIBUTION: "Phân phối sales",
  HYBRID: "Hybrid",
  INTERNAL_ONLY: "Nội bộ",
  MARKETPLACE_PUBLIC: "Sàn công khai",
};

export const customerTypeLabel: Record<string, string> = {
  BUYER: "Người mua",
  RENTER: "Người thuê",
  INVESTOR: "Nhà đầu tư",
  SELLER: "Người bán",
  LANDLORD: "Cho thuê",
};

export const conflictTypeLabel: Record<string, string> = {
  DOUBLE_ASSIGNMENT: "Phụ trách kép",
  SOURCE_CONFLICT: "Xung đột nguồn",
  TIMELINE_DISPUTE: "Tranh chấp thời gian",
  OTHER: "Khác",
};

export const disputeStatusVariant: Record<string, "yellow" | "green" | "red"> = {
  OPEN: "yellow",
  RESOLVED: "green",
  REJECTED: "red",
};

export const disputeStatusLabel: Record<string, string> = {
  OPEN: "Đang mở",
  RESOLVED: "Đã giải quyết",
  REJECTED: "Đã từ chối",
};

export interface PolicyFormValues {
  name: string;
  source: string;
  sellingMode: string;
  customerType: string;
  protectionDays: number;
  inactiveReclaimDays: number;
  allowReassign: boolean;
  priority: number;
}

export const defaultPolicyForm: PolicyFormValues = {
  name: "",
  source: "",
  sellingMode: "",
  customerType: "",
  protectionDays: 30,
  inactiveReclaimDays: 90,
  allowReassign: false,
  priority: 0,
};
