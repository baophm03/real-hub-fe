import { useQuery } from "@tanstack/react-query";
import { customInstance } from "../mutator/custom-instance";

const COMMISSION_LIST_TIMEOUT_MS = 10_000;
const COMMISSION_DETAIL_TIMEOUT_MS = 10_000;
const COMMISSION_REPORT_TIMEOUT_MS = 30_000;

export interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
  meta?: ApiPaginationMeta;
  timestamp?: string;
}

export interface ApiPaginationMeta {
  total?: number;
  limit?: number;
  offset?: number;
  page?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiPageEnvelope<T> extends ApiEnvelope<T[]> {
  meta: ApiPaginationMeta;
}

export interface CommissionOption {
  value: string;
  label: string;
  hint?: string;
  requiresReason?: boolean;
  requiresAttachment?: boolean;
}

export interface CommissionOptions {
  businessTimezone: string;
  commissionTypes: CommissionOption[];
  calculationTypes: CommissionOption[];
  calculationBases: CommissionOption[];
  estimateSources: CommissionOption[];
  leadAttributionStatuses: CommissionOption[];
  receiverTypes: CommissionOption[];
  receiverRoles: CommissionOption[];
  splitTypes: CommissionOption[];
  commissionStatuses: CommissionOption[];
  commissionItemStatuses: CommissionOption[];
  planStatuses: Array<CommissionOption & { canEdit: boolean; canDelete: boolean }>;
  planTransitions: Array<{
    from: string;
    to: Array<{ status: string; action: string; label: string }>;
  }>;
  commissionActions: Record<string, CommissionOption[]>;
  dealTypes: CommissionOption[];
  sellingModes: CommissionOption[];
  zones: Array<{ id: string; name: string; code: string }>;
  projects: Array<{ id: string; name: string; code: string }>;
  teams: Array<{ id: string; name: string }>;
  propertyTypes: Array<{ id: string; name: string; code: string }>;
  leadSources: string[];
  capabilities: {
    canReadAllPlans: boolean;
    canManagePlans: boolean;
    canApprovePlans: boolean;
  };
}

export interface CommissionListParams {
  dealId?: string;
  status?: string;
  commissionType?: string;
  zoneId?: string;
  projectId?: string;
  leadSource?: string;
  teamId?: string;
  limit?: number;
  offset?: number;
}

export interface CommissionReportParams {
  startDate?: string;
  endDate?: string;
  zoneId?: string;
  projectId?: string;
  leadSource?: string;
  commissionType?: string;
  teamId?: string;
  status?: string;
  planId?: string;
}

export function useApiCommissionOptions() {
  return useQuery({
    queryKey: ["/api/commission/options"],
    queryFn: ({ signal }) => customInstance<ApiEnvelope<CommissionOptions>>({
      url: "/api/commission/options",
      method: "GET",
      signal,
    }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useApiCommissionRecipients(search: string, enabled = true) {
  return useQuery({
    queryKey: ["/api/commission/recipients", search],
    queryFn: ({ signal }) => customInstance<ApiEnvelope<Array<{ id: string; fullName: string }>>>({
      url: "/api/commission/recipients",
      method: "GET",
      params: { search: search || undefined, limit: 100 },
      signal,
    }),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useApiCommissionPlans<T = unknown>(params: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["/api/commission/plans", params],
    queryFn: ({ signal }) => customInstance<ApiPageEnvelope<T>>({
      url: "/api/commission/plans",
      method: "GET",
      params,
      signal,
    }),
  });
}

export function useApiCommissionDeals<T = unknown>(params: CommissionListParams, enabled = true) {
  return useQuery({
    queryKey: ["/api/commission/deals", params],
    queryFn: ({ signal }) => customInstance<ApiPageEnvelope<T>>({
      url: "/api/commission/deals",
      method: "GET",
      params,
      timeout: COMMISSION_LIST_TIMEOUT_MS,
      signal,
    }),
    enabled,
    retry: false,
  });
}

export function useApiCommissionDeal(id: string) {
  return useQuery({
    queryKey: ["/api/commission/deals", id],
    queryFn: ({ signal }) => customInstance<ApiEnvelope<any>>({
      url: `/api/commission/deals/${id}`,
      method: "GET",
      timeout: COMMISSION_DETAIL_TIMEOUT_MS,
      signal,
    }),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useApiCommissionReport(params: CommissionReportParams) {
  return useQuery({
    queryKey: ["/api/reports/commission", params],
    queryFn: ({ signal }) => customInstance<ApiEnvelope<any>>({
      url: "/api/reports/commission",
      method: "GET",
      params,
      timeout: COMMISSION_REPORT_TIMEOUT_MS,
      signal,
    }),
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}
