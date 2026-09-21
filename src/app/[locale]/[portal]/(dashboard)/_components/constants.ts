export const leadStatusConfig: Record<string, { label: string; variant: "blue" | "yellow" | "purple" | "green" | "red" | "default" }> = {
  NEW: { label: "Mới", variant: "blue" },
  CONTACTED: { label: "Đã liên hệ", variant: "yellow" },
  INTERESTED: { label: "Quan tâm", variant: "purple" },
  NEGOTIATING: { label: "Đàm phán", variant: "default" },
  CONVERTED: { label: "Chuyển đổi", variant: "green" },
  LOST: { label: "Mất", variant: "red" },
};

export const leadStatusConfigLabels: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  INTERESTED: "Quan tâm",
  NEGOTIATING: "Đàm phán",
  CONVERTED: "Chuyển đổi",
  LOST: "Mất",
};

export const verificationLabels: Record<string, string> = {
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  VERIFIED: "Đã duyệt",
  REJECTED: "Từ chối",
};

export const publicationLabels: Record<string, string> = {
  PRIVATE: "Riêng tư",
  PUBLIC: "Công khai",
  ARCHIVED: "Lưu trữ",
};

export const dealStatusLabels: Record<string, string> = {
  SOFT_RESERVED: "Đặt cọc mềm",
  NEGOTIATING: "Đàm phán",
  CONTRACT_PENDING: "Chờ hợp đồng",
  SIGNED: "Đã ký",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};

export const CHART_COLORS = [
  "#2a5f3f",
  "#1F6C9F",
  "#d4a373",
  "#6B3B8C",
  "#8fb5a0",
  "#956400",
];

/** Semantic colors keyed by status code — falls back to CHART_COLORS by index */
export const STATUS_COLORS: Record<string, string> = {
  NEW: "#1F6C9F",
  CONTACTED: "#956400",
  INTERESTED: "#6B3B8C",
  NEGOTIATING: "#a07c5c",
  CONVERTED: "#2a5f3f",
  LOST: "#9F2F2D",
  SOFT_RESERVED: "#d4a373",
  CONTRACT_PENDING: "#8fb5a0",
  SIGNED: "#1F6C9F",
  COMPLETED: "#2a5f3f",
  CANCELLED: "#9F2F2D",
  DRAFT: "#787774",
  PENDING: "#956400",
  VERIFIED: "#2a5f3f",
  REJECTED: "#9F2F2D",
  PRIVATE: "#956400",
  PUBLIC: "#2a5f3f",
  ARCHIVED: "#787774",
};

export const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}
