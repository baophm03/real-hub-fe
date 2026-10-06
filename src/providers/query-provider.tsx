'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface QueryError {
  status?: number;
  message: string;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: (failureCount, error) => {
          const queryError = error as QueryError;
          if (queryError?.status && [404, 401, 403].includes(queryError.status)) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: 'always',
        networkMode: 'online',
      },
      mutations: {
        retry: 1,
        networkMode: 'online',
        onError: (error) => {
          const queryError = error as QueryError;
          console.error('Mutation error:', queryError);
        },
      },
    },
  });
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}