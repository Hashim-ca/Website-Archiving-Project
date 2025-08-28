import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWebsite } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';

interface UseEnhancedWebsiteOptions {
  domain?: string;
  path?: string;
  enabled?: boolean;
}

export const useEnhancedWebsite = (options: UseEnhancedWebsiteOptions = {}) => {
  const { domain, path, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.website(domain!, path),
    queryFn: () => getWebsite(domain!, path),
    enabled: enabled && !!domain,
    staleTime: 2 * 60 * 1000, // 2 minutes - website data doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const refetchWebsite = () => {
    if (domain) {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.website(domain, path)
      });
    }
  };

  const prefetchWebsite = (targetDomain: string, targetPath?: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.website(targetDomain, targetPath),
      queryFn: () => getWebsite(targetDomain, targetPath),
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error?.message || null,
    refetch: query.refetch,
    refetchWebsite,
    prefetchWebsite,
    isStale: query.isStale,
  };
};