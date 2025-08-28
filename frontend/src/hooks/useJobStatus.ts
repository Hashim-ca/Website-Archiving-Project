import { useState, useCallback, useEffect, useRef } from 'react';
import { getJobStatus } from '@/lib/api';
import { GetJobStatusResponse, ApiError, LoadingState } from '@/types';

interface UseJobStatusOptions {
  jobId?: string;
  autoFetch?: boolean;
  pollingInterval?: number; // in milliseconds
  stopPollingOnComplete?: boolean;
}

interface UseJobStatusResult extends LoadingState {
  data: GetJobStatusResponse | null;
  startPolling: (jobId?: string) => void;
  stopPolling: () => void;
  refetch: (jobId?: string) => Promise<GetJobStatusResponse | null>;
  isPolling: boolean;
}

export const useJobStatus = (options: UseJobStatusOptions = {}): UseJobStatusResult => {
  const { 
    jobId, 
    autoFetch = false, 
    pollingInterval = 5000, // 5 seconds default
    stopPollingOnComplete = true 
  } = options;

  const [state, setState] = useState<{
    data: GetJobStatusResponse | null;
    isLoading: boolean;
    error: string | null;
    isPolling: boolean;
  }>({
    data: null,
    isLoading: false,
    error: null,
    isPolling: false,
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  const fetchJobStatus = useCallback(async (targetJobId?: string): Promise<GetJobStatusResponse | null> => {
    const jobIdToUse = targetJobId || jobId;
    
    if (!jobIdToUse) {
      setState(prev => ({ ...prev, error: 'Job ID is required' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getJobStatus(jobIdToUse);
      
      setState(prev => ({
        ...prev,
        data: response,
        isLoading: false,
        error: null,
      }));

      // Stop polling if job is complete and stopPollingOnComplete is true
      if (stopPollingOnComplete && (response.status === 'completed' || response.status === 'failed')) {
        stopPolling();
      }

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        data: null,
        isLoading: false,
        error: apiError.message || 'Failed to fetch job status',
      }));
      
      // Stop polling on error
      stopPolling();
      return null;
    }
  }, [jobId, stopPollingOnComplete]);

  const startPolling = useCallback((targetJobId?: string) => {
    const jobIdToUse = targetJobId || jobId;
    
    if (!jobIdToUse) {
      console.warn('Cannot start polling without a job ID');
      return;
    }

    // Stop any existing polling
    stopPolling();

    currentJobIdRef.current = jobIdToUse;
    setState(prev => ({ ...prev, isPolling: true }));

    // Initial fetch
    fetchJobStatus(jobIdToUse);

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchJobStatus(currentJobIdRef.current || undefined);
    }, pollingInterval);
  }, [jobId, pollingInterval, fetchJobStatus]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setState(prev => ({ ...prev, isPolling: false }));
    currentJobIdRef.current = null;
  }, []);

  const refetch = useCallback(async (targetJobId?: string): Promise<GetJobStatusResponse | null> => {
    return await fetchJobStatus(targetJobId);
  }, [fetchJobStatus]);

  // Auto-fetch on mount if jobId is provided and autoFetch is true
  useEffect(() => {
    if (jobId && autoFetch) {
      fetchJobStatus();
    }
  }, [jobId, autoFetch, fetchJobStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...state,
    startPolling,
    stopPolling,
    refetch,
  };
};

// Hook for one-time job status fetching
export const useJobStatusQuery = () => {
  const [state, setState] = useState<{
    data: GetJobStatusResponse | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
  });

  const queryJobStatus = useCallback(async (jobId: string): Promise<GetJobStatusResponse | null> => {
    if (!jobId.trim()) {
      setState(prev => ({ ...prev, error: 'Job ID is required' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getJobStatus(jobId.trim());
      
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
        error: apiError.message || 'Failed to fetch job status',
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
    queryJobStatus,
    reset,
  };
};
