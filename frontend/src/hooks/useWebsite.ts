import { useState, useCallback, useEffect } from 'react';
import { getWebsite } from '@/lib/api';
import { GetWebsiteResponse, ApiError, UseAsyncResult } from '@/types';

interface UseWebsiteOptions {
  domain?: string;
  path?: string;
  autoFetch?: boolean;
}

export const useWebsite = (options: UseWebsiteOptions = {}): UseAsyncResult<GetWebsiteResponse> => {
  const { domain, path, autoFetch = true } = options;
  
  const [state, setState] = useState<{
    data: GetWebsiteResponse | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchWebsite = useCallback(async (targetDomain?: string, targetPath?: string): Promise<void> => {
    const domainToUse = targetDomain || domain;
    
    if (!domainToUse) {
      setState(prev => ({ ...prev, error: 'Domain is required' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getWebsite(domainToUse, targetPath || path);
      
      setState({
        data: response,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      setState({
        data: null,
        isLoading: false,
        error: apiError.message || 'Failed to fetch website data',
      });
    }
  }, [domain, path]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchWebsite();
  }, [fetchWebsite]);

  // Auto-fetch on mount if domain is provided and autoFetch is true
  useEffect(() => {
    if (domain && autoFetch) {
      fetchWebsite();
    }
  }, [domain, path, autoFetch, fetchWebsite]);

  return {
    ...state,
    refetch,
  };
};

// Hook for fetching website by domain with manual trigger
export const useWebsiteQuery = () => {
  const [state, setState] = useState<{
    data: GetWebsiteResponse | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
  });

  const queryWebsite = useCallback(async (domain: string, path?: string): Promise<GetWebsiteResponse | null> => {
    if (!domain.trim()) {
      setState(prev => ({ ...prev, error: 'Domain is required' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getWebsite(domain.trim(), path);
      
      setState({
        data: response,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      setState({
        data: null,
        isLoading: false,
        error: apiError.message || 'Failed to fetch website data',
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    // This requires the last used domain/path to be stored
    // For now, just reset the state
    reset();
  }, [reset]);

  return {
    ...state,
    queryWebsite,
    reset,
    refetch,
  };
};