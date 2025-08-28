import { useState, useCallback, useEffect, useRef } from 'react';
import { getMultipleJobStatuses } from '@/lib/api';
import { GetJobStatusResponse, ApiError } from '@/types';

interface ActiveJob {
  jobId: string;
  url: string;
  domain: string;
  status: GetJobStatusResponse | null;
  error: string | null;
}

interface UseActiveJobsResult {
  activeJobs: ActiveJob[];
  addJob: (jobId: string, url: string, domain: string) => void;
  removeJob: (jobId: string) => void;
  clearCompletedJobs: () => void;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'website-archive-active-jobs';
const POLLING_INTERVAL = 5000; // 5 seconds - less aggressive polling

export const useActiveJobs = (): UseActiveJobsResult => {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load active jobs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const jobs = JSON.parse(stored) as ActiveJob[];
        setActiveJobs(jobs.map(job => ({ ...job, status: null, error: null })));
      } catch (error) {
        console.error('Failed to load active jobs from storage:', error);
      }
    }
  }, []);

  // Save active jobs to localStorage whenever they change
  const saveToStorage = useCallback((jobs: ActiveJob[]) => {
    try {
      const jobsToStore = jobs.map(({ jobId, url, domain }) => ({ jobId, url, domain }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobsToStore));
    } catch (error) {
      console.error('Failed to save active jobs to storage:', error);
    }
  }, []);

  // Fetch status for all active jobs
  const fetchJobStatuses = useCallback(async () => {
    setActiveJobs(currentJobs => {
      if (currentJobs.length === 0) return currentJobs;

      setIsLoading(true);
      setError(null);

      // Use the current jobs from the callback to avoid stale closure
      const jobIds = currentJobs.map(job => job.jobId);
      
      getMultipleJobStatuses(jobIds)
        .then(statuses => {
          setActiveJobs(prevJobs => {
            const updatedJobs = prevJobs.map(job => {
              const status = statuses.find(s => s.jobId === job.jobId);
              return {
                ...job,
                status: status || null,
                error: status ? null : 'Status not found'
              };
            });

            // Save updated jobs to storage (but don't filter here to avoid losing jobs)
            saveToStorage(updatedJobs);

            return updatedJobs;
          });
        })
        .catch(error => {
          const apiError = error as ApiError;
          setError(apiError.message || 'Failed to fetch job statuses');
        })
        .finally(() => {
          setIsLoading(false);
        });

      return currentJobs;
    });
  }, [saveToStorage]);

  // Start polling for job statuses
  useEffect(() => {
    // Only poll if there are jobs that need status updates (not completed/failed)
    const jobsNeedingUpdates = activeJobs.filter(job => 
      !job.status || (job.status.status === 'processing' || job.status.status === 'pending')
    );

    if (jobsNeedingUpdates.length > 0) {
      // Initial fetch
      fetchJobStatuses();

      // Set up polling
      pollingIntervalRef.current = setInterval(fetchJobStatuses, POLLING_INTERVAL);
    } else {
      // Clear polling if no jobs need updates
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    // Cleanup on unmount or when activeJobs changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeJobs, fetchJobStatuses]); // Watch the actual jobs, not just length

  const addJob = useCallback((jobId: string, url: string, domain: string) => {
    setActiveJobs(prevJobs => {
      // Check if job already exists
      if (prevJobs.some(job => job.jobId === jobId)) {
        return prevJobs;
      }

      const newJob: ActiveJob = {
        jobId,
        url,
        domain,
        status: null,
        error: null
      };

      const updatedJobs = [newJob, ...prevJobs];
      saveToStorage(updatedJobs);
      return updatedJobs;
    });
  }, [saveToStorage]);

  const removeJob = useCallback((jobId: string) => {
    setActiveJobs(prevJobs => {
      const updatedJobs = prevJobs.filter(job => job.jobId !== jobId);
      saveToStorage(updatedJobs);
      return updatedJobs;
    });
  }, [saveToStorage]);

  const clearCompletedJobs = useCallback(() => {
    setActiveJobs(prevJobs => {
      const activeOnly = prevJobs.filter(job => {
        if (!job.status) return true;
        return job.status.status === 'processing' || job.status.status === 'pending';
      });
      saveToStorage(activeOnly);
      return activeOnly;
    });
  }, [saveToStorage]);

  return {
    activeJobs,
    addJob,
    removeJob,
    clearCompletedJobs,
    isLoading,
    error
  };
};
