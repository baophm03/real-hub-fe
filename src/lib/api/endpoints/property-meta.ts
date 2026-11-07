import { useQuery } from '@tanstack/react-query';
import { customInstance } from '../mutator/custom-instance';

export interface PropertyOption {
  value: string;
  label: string;
}

interface ApiEnvelope<T> {
  data: T;
}

export function useApiPropertySellingModes() {
  return useQuery({
    queryKey: ['/api/properties/selling-modes'],
    queryFn: ({ signal }) => customInstance<ApiEnvelope<PropertyOption[]>>({
      url: '/api/properties/selling-modes',
      method: 'GET',
      signal,
    }),
    staleTime: 30 * 60 * 1000,
  });
}
