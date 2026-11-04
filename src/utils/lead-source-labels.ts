const LEAD_SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  PROPERTY_DETAIL: "Trang BĐS",
  OWNER_PAGE: "Trang chủ",
  SALES_LINK: "Link sales",
  CTV_LINK: "Link CTV",
  AGENCY_MARKETING: "Marketing",
  MANUAL_INPUT: "Nhập tay",
  LEAD_POOL: "Lead pool",
  IMPORT: "Nhập file",
};

/** Localize known lead source codes while preserving tenant-specific API values. */
export function getLeadSourceLabel(source: string | null | undefined): string {
  if (!source) return "—";
  return LEAD_SOURCE_LABELS[source] ?? source;
}
