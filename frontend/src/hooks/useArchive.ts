import { useState, useCallback } from 'react';
import { createArchive } from '@/lib/api';
import { CreateArchiveRequest, CreateArchiveResponse, ApiError, LoadingState } from '@/types';

interface UseArchiveResult extends LoadingState {
  createArchiveJob: (url: string) => Promise<CreateArchiveResponse | null>;
  data: CreateArchiveResponse | null;
  reset: () => void;
}

export const useArchive = (): UseArchiveResult => {
  const [state, setState] = useState<{
    data: CreateArchiveResponse | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
  });

  const createArchiveJob = useCallback(async (url: string): Promise<CreateArchiveResponse | null> => {
    if (!url.trim()) {
      setState(prev => ({ ...prev, error: 'URL is required' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const request: CreateArchiveRequest = { url: url.trim() };
      const response = await createArchive(request);
      
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
        error: apiError.message || 'Failed to create archive job',
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

  return {
    ...state,
    createArchiveJob,
    reset,
  };
};