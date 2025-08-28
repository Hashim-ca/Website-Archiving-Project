import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { createArchive } from '@/lib/api';
import { useSearchStore } from '@/stores/searchStore';
import { useJobStore } from '@/stores/jobStore';
import { useUrlValidation } from '@/hooks/useUrlValidation';
import { queryKeys } from '@/lib/queryClient';
import { CreateArchiveRequest, CreateArchiveResponse, ApiError } from '@/types';

interface UseEnhancedArchiveResult {
  createArchiveJob: (url: string) => Promise<CreateArchiveResponse | null>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export const useEnhancedArchive = (): UseEnhancedArchiveResult => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const { extractDomain } = useUrlValidation();
  const { addToHistory, setLastSearchedUrl, setIsSearching } = useSearchStore();
  const { addJob } = useJobStore();

  const archiveMutation = useMutation({
    mutationFn: async (request: CreateArchiveRequest): Promise<CreateArchiveResponse> => {
      return createArchive(request);
    },
    onSuccess: (data, variables) => {
      const domain = extractDomain(variables.url);
      if (domain) {
        addToHistory(variables.url, domain, true);
        addJob(data.jobId, variables.url, domain);
        setLastSearchedUrl(variables.url);
        
        // Invalidate related queries
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.website(domain) 
        });
      }
      setError(null);
    },
    onError: (apiError: ApiError, variables) => {
      const domain = extractDomain(variables.url);
      if (domain) {
        addToHistory(variables.url, domain, false);
      }
      setError(apiError.message || 'Failed to create archive job');
    },
    onSettled: () => {
      setIsSearching(false);
    }
  });

  const createArchiveJob = useCallback(async (url: string): Promise<CreateArchiveResponse | null> => {
    if (!url.trim()) {
      setError('URL is required');
      return null;
    }

    const domain = extractDomain(url);
    if (!domain) {
      setError('Invalid URL format');
      return null;
    }

    setError(null);
    setIsSearching(true);
    setLastSearchedUrl(url);

    // Update URL with search query for bookmarkability
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('q', url);
    router.replace(`/?${newSearchParams.toString()}`, { scroll: false });

    try {
      const result = await archiveMutation.mutateAsync({ url: url.trim() });
      return result;
    } catch {
      // Error is handled in mutation onError
      return null;
    }
  }, [extractDomain, setError, setIsSearching, setLastSearchedUrl, archiveMutation, searchParams, router]);

  const reset = useCallback(() => {
    setError(null);
    archiveMutation.reset();
  }, [archiveMutation]);

  return {
    createArchiveJob,
    isLoading: archiveMutation.isPending,
    error,
    reset,
  };
};