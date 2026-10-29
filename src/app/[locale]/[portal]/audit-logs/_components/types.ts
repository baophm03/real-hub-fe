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
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
}

export interface AuditLogSummaryItem {
  action: string;
  count: number;
}

export const actionLabel: Record<string, string> = {
  // Legacy / HTTP-verb style (keep for backward compat)
  CREATE: "Tạo",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  PATCH: "Cập nhật",
  POST: "Tạo",
  PUT: "Cập nhật",
  LOGIN: "Đăng nhập",
  LOGOUT: "Đăng xuất",
  // News
  NEWS_CREATED: "Tạo tin tức",
  NEWS_UPDATED: "Cập nhật tin tức",
  NEWS_DELETED: "Xóa tin tức",
  // Projects
  PROJECT_CREATED: "Tạo dự án",
  PROJECT_UPDATED: "Cập nhật dự án",
  PROJECT_DELETED: "Xóa dự án",
  // Properties
  PROPERTY_CREATED: "Tạo bất động sản",
  PROPERTY_UPDATED: "Cập nhật bất động sản",
  PROPERTY_DELETED: "Xóa bất động sản",
};

export const entityTypeLabel: Record<string, string> = {
  // Legacy uppercase (keep for backward compat)
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
  // Actual stored values (lowercase)
  news: "Tin tức",
  project: "Dự án",
  property: "Bất động sản",
};

export const actionOptions = [
  { value: "", label: "Tất cả hành động" },
  { value: "NEWS_CREATED", label: "Tạo tin tức" },
  { value: "NEWS_UPDATED", label: "Cập nhật tin tức" },
  { value: "NEWS_DELETED", label: "Xóa tin tức" },
  { value: "PROJECT_CREATED", label: "Tạo dự án" },
  { value: "PROJECT_UPDATED", label: "Cập nhật dự án" },
  { value: "PROJECT_DELETED", label: "Xóa dự án" },
  { value: "PROPERTY_CREATED", label: "Tạo bất động sản" },
  { value: "PROPERTY_UPDATED", label: "Cập nhật bất động sản" },
  { value: "PROPERTY_DELETED", label: "Xóa bất động sản" },
];

export const entityTypeOptions = [
  { value: "", label: "Tất cả đối tượng" },
  { value: "news", label: "Tin tức" },
  { value: "project", label: "Dự án" },
  { value: "property", label: "Bất động sản" },
];

export function getActionBadgeVariant(
  action: string,
): "green" | "blue" | "default" | "purple" {
  const a = action?.toUpperCase() ?? "";
  if (a.endsWith("_CREATED") || a === "CREATE" || a === "POST") return "green";
  if (a.endsWith("_UPDATED") || a === "UPDATE" || a === "PATCH" || a === "PUT") return "blue";
  if (a.endsWith("_DELETED") || a === "DELETE") return "default";
  return "purple";
}
