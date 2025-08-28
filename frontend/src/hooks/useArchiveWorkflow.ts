import { useState, useCallback, useEffect } from 'react';
import { useArchive } from './useArchive';
import { useWebsiteQuery } from './useWebsite';
import { useUrlValidation } from './useUrlValidation';
import { useJobStatus } from './useJobStatus';
import { CreateArchiveResponse, GetWebsiteResponse, GetJobStatusResponse } from '@/types';

interface UseArchiveWorkflowState {
  step: 'input' | 'creating' | 'processing' | 'completed' | 'viewing' | 'error';
  url: string;
  domain: string | null;
  archiveResponse: CreateArchiveResponse | null;
  jobStatus: GetJobStatusResponse | null;
  websiteData: GetWebsiteResponse | null;
}

interface UseArchiveWorkflowResult extends UseArchiveWorkflowState {
  // State management
  setUrl: (url: string) => void;
  reset: () => void;
  
  // Workflow actions
  startArchive: () => Promise<boolean>;
  viewWebsite: (domain: string) => Promise<boolean>;
  
  // Validation
  isValidUrl: boolean;
  
  // Loading states
  isCreatingArchive: boolean;
  isProcessingJob: boolean;
  isLoadingWebsite: boolean;
  
  // Errors
  archiveError: string | null;
  jobError: string | null;
  websiteError: string | null;
}

export const useArchiveWorkflow = (): UseArchiveWorkflowResult => {
  const [state, setState] = useState<UseArchiveWorkflowState>({
    step: 'input',
    url: '',
    domain: null,
    archiveResponse: null,
    jobStatus: null,
    websiteData: null,
  });

  const { validateUrl, extractDomain } = useUrlValidation();
  const archive = useArchive();
  const jobStatusHook = useJobStatus({
    stopPollingOnComplete: true,
    pollingInterval: 5000, // Poll every 5 seconds
  });
  const websiteQuery = useWebsiteQuery();

  const setUrl = useCallback((url: string) => {
    const domain = extractDomain(url);
    setState(prev => ({
      ...prev,
      url,
      domain,
      step: 'input',
    }));
    
    // Reset previous states when URL changes
    archive.reset();
    jobStatusHook.stopPolling();
    websiteQuery.reset();
  }, [extractDomain, archive, jobStatusHook, websiteQuery]);

  const reset = useCallback(() => {
    setState({
      step: 'input',
      url: '',
      domain: null,
      archiveResponse: null,
      jobStatus: null,
      websiteData: null,
    });
    archive.reset();
    jobStatusHook.stopPolling();
    websiteQuery.reset();
  }, [archive, jobStatusHook, websiteQuery]);

  const startArchive = useCallback(async (): Promise<boolean> => {
    if (!state.url || !validateUrl(state.url).isValid) {
      setState(prev => ({ ...prev, step: 'error' }));
      return false;
    }

    setState(prev => ({ ...prev, step: 'creating' }));

    const response = await archive.createArchiveJob(state.url);
    
    if (response) {
      setState(prev => ({
        ...prev,
        step: 'processing',
        archiveResponse: response,
      }));
      
      // Start polling for job status
      jobStatusHook.startPolling(response.jobId);
      return true;
    } else {
      setState(prev => ({ ...prev, step: 'error' }));
      return false;
    }
  }, [state.url, validateUrl, archive, jobStatusHook]);

  const viewWebsite = useCallback(async (domain: string): Promise<boolean> => {
    setState(prev => ({ ...prev, step: 'viewing' }));

    const response = await websiteQuery.queryWebsite(domain);
    
    if (response) {
      setState(prev => ({
        ...prev,
        websiteData: response,
      }));
      return true;
    } else {
      setState(prev => ({ ...prev, step: 'error' }));
      return false;
    }
  }, [websiteQuery]);

  // Watch for job status changes
  useEffect(() => {
    if (jobStatusHook.data && state.step === 'processing') {
      setState(prev => ({
        ...prev,
        jobStatus: jobStatusHook.data,
      }));

      // Update step based on job status
      if (jobStatusHook.data.status === 'completed') {
        setState(prev => ({ ...prev, step: 'completed' }));
        
        // If job completed successfully and has website data, use it
        if (jobStatusHook.data.website) {
          setState(prev => ({
            ...prev,
            websiteData: {
              domain: jobStatusHook.data!.website!.domain,
              originalUrl: state.url,
              snapshots: jobStatusHook.data!.website!.snapshots.map(snapshot => ({
                ...snapshot,
                jobId: jobStatusHook.data!.jobId,
                createdAt: new Date(snapshot.createdAt),
                updatedAt: new Date(snapshot.updatedAt),
              })),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          }));
        }
      } else if (jobStatusHook.data.status === 'failed') {
        setState(prev => ({ ...prev, step: 'error' }));
      }
    }
  }, [jobStatusHook.data, state.step, state.url]);

  const isValidUrl = validateUrl(state.url).isValid;

  return {
    ...state,
    setUrl,
    reset,
    startArchive,
    viewWebsite,
    isValidUrl,
    isCreatingArchive: archive.isLoading,
    isProcessingJob: jobStatusHook.isPolling,
    isLoadingWebsite: websiteQuery.isLoading,
    archiveError: archive.error,
    jobError: jobStatusHook.error,
    websiteError: websiteQuery.error,
  };
};