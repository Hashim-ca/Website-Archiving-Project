import { useState, useCallback, useEffect } from 'react';
import { getSitePageSuggestions } from '@/lib/api';
import { SitePageSuggestionsResponse, ApiError, UseAsyncResult } from '@/types';

interface UseSitePageSuggestionsOptions {
  domain?: string;
  autoFetch?: boolean;
}

export const useSitePageSuggestions = (
  options: UseSitePageSuggestionsOptions = {}
): UseAsyncResult<SitePageSuggestionsResponse> => {
  const { domain, autoFetch = true } = options;
  
  const [state, setState] = useState<{
    data: SitePageSuggestionsResponse | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchSuggestions = useCallback(async (targetDomain?: string): Promise<void> => {
    const domainToUse = targetDomain || domain;
    
    if (!domainToUse) {
      setState(prev => ({ ...prev, error: 'Domain is required' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getSitePageSuggestions(domainToUse);
      
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
        error: apiError.message || 'Failed to fetch page suggestions',
      });
    }
  }, [domain]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchSuggestions();
  }, [fetchSuggestions]);

  // Auto-fetch on mount if domain is provided and autoFetch is true
  useEffect(() => {
    if (domain && autoFetch) {
      fetchSuggestions();
    }
  }, [domain, autoFetch, fetchSuggestions]);

  return {
    ...state,
    refetch,
  };
};

// Hook for manual querying of suggestions
export const useSitePageSuggestionsQuery = () => {
  const [state, setState] = useState<{
    data: SitePageSuggestionsResponse | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
  });

  const querySuggestions = useCallback(async (domain: string): Promise<SitePageSuggestionsResponse | null> => {
    if (!domain.trim()) {
      setState(prev => ({ ...prev, error: 'Domain is required' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getSitePageSuggestions(domain.trim());
      
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
        error: apiError.message || 'Failed to fetch page suggestions',
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
    // Reset for manual query hook
    reset();
  }, [reset]);

  return {
    ...state,
    querySuggestions,
    reset,
    refetch,
  };
};