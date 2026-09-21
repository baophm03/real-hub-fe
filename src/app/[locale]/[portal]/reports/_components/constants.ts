export const dealStatusLabels: Record<string, string> = {
  SOFT_RESERVED: "Đặt cọc mềm",
  NEGOTIATING: "Đàm phán",
  CONTRACT_PENDING: "Chờ HĐ",
  SIGNED: "Đã ký",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};

export const leadStatusLabels: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã LH",
  INTERESTED: "Quan tâm",
  NEGOTIATING: "Đàm phán",
  CONVERTED: "Chuyển đổi",
  LOST: "Mất",
};

export const apptStatusLabels: Record<string, string> = {
  SCHEDULED: "Đã lên lịch",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
};

export const reservationStatusLabels: Record<string, string> = {
  ACTIVE: "Hiệu lực",
  EXPIRED: "Hết hạn",
  CONVERTED: "Đã chuyển",
  CANCELLED: "Đã hủy",
};

export const sellingModeLabels: Record<string, string> = {
  SELF_SELL: "Tự bán",
  SALES_DISTRIBUTION: "Phân phối sales",
  HYBRID: "Kết hợp",
  INTERNAL_ONLY: "Nội bộ",
  AGENCY_DISTRIBUTION: "Phân phối đại lý",
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

export const businessLabels: Record<string, string> = {
  AVAILABLE: "Sẵn bán",
  RESERVED: "Đã đặt cọc",
  SOLD: "Đã bán",
  RENTED: "Đã cho thuê",
  OFF_MARKET: "Off market",
};

export const commissionStatusLabels: Record<string, string> = {
  DRAFT: "Nháp",
  ESTIMATED: "Đã ước tính",
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  ADJUSTED: "Đã điều chỉnh",
  CANCELLED: "Đã hủy",
};

export const roleLabels: Record<string, string> = {
  SALES: "Sales",
  COLLABORATOR: "CTV",
  TEAM_LEADER: "Team Leader",
  AGENCY: "Agency",
  OWNER: "Owner",
  UNKNOWN: "Khác",
};

export const CHART_COLORS = [
  "#2a5f3f",
  "#1F6C9F",
  "#d4a373",
  "#6B3B8C",
  "#8fb5a0",
  "#956400",
  "#a07c5c",
  "#9F2F2D",
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
  SCHEDULED: "#1F6C9F",
  CONFIRMED: "#5b8c6e",
  NO_SHOW: "#9F2F2D",
  ACTIVE: "#2a5f3f",
  EXPIRED: "#787774",
  DRAFT: "#787774",
  PENDING: "#956400",
  VERIFIED: "#2a5f3f",
  REJECTED: "#9F2F2D",
  PRIVATE: "#956400",
  PUBLIC: "#2a5f3f",
  ARCHIVED: "#787774",
  AVAILABLE: "#2a5f3f",
  RESERVED: "#d4a373",
  SOLD: "#6B3B8C",
  RENTED: "#1F6C9F",
  OFF_MARKET: "#787774",
  ESTIMATED: "#1F6C9F",
  PENDING_CONFIRMATION: "#956400",
  ADJUSTED: "#6B3B8C",
};

export const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};
