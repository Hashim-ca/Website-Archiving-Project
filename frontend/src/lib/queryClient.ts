import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time of 5 minutes - data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time of 30 minutes - data stays in cache for 30 minutes after becoming unused
      gcTime: 30 * 60 * 1000,
      // Retry failed requests twice
      retry: 2,
      // Retry delay increases exponentially: 1s, 2s, 4s
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for real-time updates
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  website: (domain: string, path?: string) => ['website', domain, path].filter(Boolean),
  jobStatus: (jobId: string) => ['jobStatus', jobId],
  multipleJobStatus: (jobIds: string[]) => ['multipleJobStatus', ...jobIds.sort()],
  sitePageSuggestions: (domain: string) => ['sitePageSuggestions', domain],
} as const;