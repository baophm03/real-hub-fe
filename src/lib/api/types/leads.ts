export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "NEGOTIATING"
  | "CONVERTED"
  | "LOST"
  | "RECYCLED";

export type LeadSource =
  | "WEBSITE"
  | "PROPERTY_DETAIL"
  | "OWNER_PAGE"
  | "SALES_LINK"
  | "CTV_LINK"
  | "AGENCY_MARKETING"
  | "MANUAL_INPUT"
  | "LEAD_POOL"
  | "IMPORT";

export interface GetLeadsResponse {
  success: boolean;
  data: Lead[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface LeadActivity {
  id: string;
  activityType: string;
  content: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; fullName: string } | null;
}

export interface Lead {
  id: string;
  leadCode: string;
  assignmentId: string | null;
  source: string;
  assignedTeamId: string | null;
  phoneNormalized: string | null;
  protectionUntil: string | null;
  status: string;
  duplicateStatus: string | null;
  dynamicValuesJson?: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; fullName: string; avatarFile: { id: string; name: string; url: string } | null } | null;
  updater?: { id: string; fullName: string; avatarFile: { id: string; name: string; url: string } | null } | null;
  customer: { id: string; fullName: string; phone: string } | null;
  property: { id: string; title: string; propertyCode: string } | null;
  assignedSales: { id: string; fullName: string } | null;
  sourceUser?: { id: string; fullName: string } | null;
  ownerUser?: { id: string; fullName: string } | null;
  customerNeed?: {
    id: string;
    purpose: string | null;
    zoneId: string | null;
    budgetMin: string | null;
    budgetMax: string | null;
    areaMin: number | null;
    areaMax: number | null;
    bedrooms: number | null;
    expectedTime: string | null;
    note: string | null;
    dynamicValuesJson: Record<string, unknown> | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    propertyType: { id: string; name: string; code: string; group: string } | null;
  } | null;
  activities?: LeadActivity[];
}
