import { useMutation, useQuery } from '@tanstack/react-query';
import { customInstance } from '../mutator/custom-instance';

export interface Zone {
  id: string;
  name: string;
  code: string;
  type: string | null;
  provinceId: string | null;
  districtId: string | null;
  wardId: string | null;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  province?: { id: string; name: string; code: string } | null;
  district?: { id: string; name: string; code: string } | null;
  ward?: { id: string; name: string; code: string } | null;
  _count?: { properties: number; commissionRules: number; salesTerritories: number };
}

export interface ZoneInput {
  name: string;
  code: string;
  type?: string;
  provinceId?: string | null;
  districtId?: string | null;
  wardId?: string | null;
  description?: string;
}

interface ZoneEnvelope<T> {
  success?: boolean;
  data: T;
  meta?: { total?: number; limit?: number; offset?: number };
}

export function useApiZones(params: { search?: string; status?: 'ACTIVE' | 'INACTIVE'; limit?: number; offset?: number }, enabled = true) {
  return useQuery({
    queryKey: ['/api/zones', params],
    queryFn: ({ signal }) => customInstance<ZoneEnvelope<Zone[]>>({
      url: '/api/zones', method: 'GET', params, signal,
    }),
    enabled,
  });
}

export function useApiZoneOptions() {
  return useQuery({
    queryKey: ['/api/zones/options'],
    queryFn: ({ signal }) => customInstance<ZoneEnvelope<Array<Pick<Zone, 'id' | 'name' | 'code'>>>>({
      url: '/api/zones/options', method: 'GET', signal,
    }),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePostApiZone() {
  return useMutation({
    mutationFn: (data: ZoneInput) => customInstance<ZoneEnvelope<Zone>>({
      url: '/api/zones', method: 'POST', data,
    }),
  });
}

export function usePatchApiZone() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ZoneInput> }) => customInstance<ZoneEnvelope<Zone>>({
      url: `/api/zones/${id}`, method: 'PATCH', data,
    }),
  });
}

export function usePatchApiZoneStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => customInstance<ZoneEnvelope<Zone>>({
      url: `/api/zones/${id}/status`, method: 'PATCH', data: { status },
    }),
  });
}
