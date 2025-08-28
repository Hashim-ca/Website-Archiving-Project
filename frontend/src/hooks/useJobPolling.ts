import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useJobStore } from '@/stores/jobStore';
import { getMultipleJobStatuses } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';

const POLLING_INTERVAL = 3000; // 3 seconds - more reasonable than 5s

export const useJobPolling = () => {
  const {
    jobs,
    getActiveJobs,
    updateJobStatus,
    hasActiveJobs,
    setPolling,
    isPolling
  } = useJobStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeJobs = getActiveJobs();
  const jobIds = activeJobs.map(job => job.jobId);

  // Query for job statuses - only enabled when there are active jobs
  const { data: jobStatuses, isLoading } = useQuery({
    queryKey: queryKeys.multipleJobStatus(jobIds),
    queryFn: () => getMultipleJobStatuses(jobIds),
    enabled: jobIds.length > 0,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Update job statuses in store when data changes
  useEffect(() => {
    if (jobStatuses) {
      jobStatuses.forEach(status => {
        updateJobStatus(status.jobId, status);
      });
    }
  }, [jobStatuses, updateJobStatus]);

  // Handle polling state
  useEffect(() => {
    const shouldPoll = hasActiveJobs();
    setPolling(shouldPoll && isLoading);
  }, [hasActiveJobs, isLoading, setPolling]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isPolling,
    activeJobsCount: activeJobs.length,
    totalJobsCount: jobs.length,
  };
};