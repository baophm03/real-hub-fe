export interface SalesReport {
  deals: {
    total: number;
    byStatus: Record<string, number>;
    totalExpectedValue: number;
    totalFinalValue: number;
    bySales: Record<string, number>;
  };
  leads: {
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  };
  appointments: {
    total: number;
    byStatus: Record<string, number>;
  };
  reservations: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export interface ByRoleEntry {
  estimated: string;
  confirmed: string;
  count: number;
}

export interface CommissionDimensionEntry {
  label?: string;
  estimated: string;
  confirmed: string;
  count: number;
}

export interface CommissionReport {
  total: number;
  byStatus: Record<string, number>;
  byType?: Record<string, number>;
  totalEstimated: string;
  totalConfirmed: string;
  byRole: Record<string, ByRoleEntry>;
  byZone?: Record<string, CommissionDimensionEntry>;
  byProject?: Record<string, CommissionDimensionEntry>;
  byTeam?: Record<string, CommissionDimensionEntry>;
  byLeadSource?: Record<string, CommissionDimensionEntry>;
  byPlan?: Record<string, CommissionDimensionEntry>;
  options?: {
    commissionStatuses: Array<{ value: string; label: string }>;
    commissionTypes: Array<{ value: string; label: string }>;
    receiverRoles: Array<{ value: string; label: string }>;
    zones: Array<{ id: string; name: string; code: string }>;
    projects: Array<{ id: string; name: string; code: string }>;
    teams: Array<{ id: string; name: string }>;
    plans: Array<{ id: string; name: string; version: number }>;
    leadSources: string[];
  };
}

export interface PropertiesReport {
  total: number;
  bySellingMode: Record<string, number>;
  byVerification: Record<string, number>;
  byPublication: Record<string, number>;
  byBusiness: Record<string, number>;
  totalValue: number;
}

export interface TeamMember {
  user: { id: string; fullName: string; email: string };
  roles: string[];
  stats: { deals: number; leads: number; appointments: number };
}
