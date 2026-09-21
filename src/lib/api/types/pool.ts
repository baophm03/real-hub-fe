import type { Lead } from "./leads";

export type PoolLead = Lead;

export interface GetPoolLeadsResponse {
  success: boolean;
  data: PoolLead[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface AssignLeadPayload {
  salesId?: string;
  teamId?: string;
}
