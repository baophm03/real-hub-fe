export interface AuditLogUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: any;
  afterJson: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLogSummaryItem {
  action: string;
  count: number;
}

export const actionLabel: Record<string, string> = {
  CREATE: "Tạo",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  PATCH: "Cập nhật",
  POST: "Tạo",
  PUT: "Cập nhật",
  LOGIN: "Đăng nhập",
  LOGOUT: "Đăng xuất",
};

export const entityTypeLabel: Record<string, string> = {
  PROPERTY: "Bất động sản",
  LEAD: "Lead",
  CUSTOMER: "Khách hàng",
  DEAL: "Giao dịch",
  PROJECT: "Dự án",
  USER: "Người dùng",
  TENANT: "Tenant",
  COMMISSION_PLAN: "Kế hoạch hoa hồng",
  COMMISSION_RULE: "Quy tắc hoa hồng",
  ASSIGNMENT_POLICY: "Chính sách phụ trách",
  LEAD_PROTECTION_POLICY: "Chính sách bảo vệ lead",
  VISIBILITY_POLICY: "Chính sách hiển thị",
  SEO_TEMPLATE: "Mẫu SEO",
  WORKFLOW: "Workflow",
  APPOINTMENT: "Lịch hẹn",
  NEWS: "Tin tức",
  FILE: "Tệp",
};

export const actionOptions = Object.keys(actionLabel).map((k) => ({
  value: k,
  label: actionLabel[k] ?? k,
}));

export const entityTypeOptions = Object.keys(entityTypeLabel).map((k) => ({
  value: k,
  label: entityTypeLabel[k] ?? k,
}));


export function getActionBadgeVariant(action: string): "green" | "blue" | "default" | "purple" {
  const a = action?.toUpperCase() ?? "";
  if (a === "CREATE" || a === "POST") return "green";
  if (a === "UPDATE" || a === "PATCH" || a === "PUT") return "blue";
  if (a === "DELETE") return "default";
  return "purple";
}
