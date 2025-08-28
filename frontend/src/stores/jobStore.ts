import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GetJobStatusResponse } from '@/types';

export interface JobState {
  jobId: string;
  url: string;
  domain: string;
  status: GetJobStatusResponse | null;
  error: string | null;
  addedAt: number;
}

export interface JobsState {
  // Active jobs
  jobs: JobState[];
  
  // Polling state
  isPolling: boolean;
  pollInterval: number;
  
  // Actions
  addJob: (jobId: string, url: string, domain: string) => void;
  updateJobStatus: (jobId: string, status: GetJobStatusResponse | null, error?: string | null) => void;
  removeJob: (jobId: string) => void;
  clearCompletedJobs: () => void;
  clearAllJobs: () => void;
  getJobsByDomain: (domain: string) => JobState[];
  getActiveJobs: () => JobState[];
  hasActiveJobs: () => boolean;
  setPolling: (isPolling: boolean) => void;
}

const STORAGE_KEY = 'website-archive-jobs';
const MAX_JOBS = 100;
const DEFAULT_POLL_INTERVAL = 5000;

export const useJobStore = create<JobsState>()(
  persist(
    (set, get) => ({
      // Initial state
      jobs: [],
      isPolling: false,
      pollInterval: DEFAULT_POLL_INTERVAL,

      // Actions
      addJob: (jobId: string, url: string, domain: string) => {
        set(state => {
          // Check if job already exists
          if (state.jobs.some(job => job.jobId === jobId)) {
            return state;
          }

          const newJob: JobState = {
            jobId,
            url,
            domain,
            status: null,
            error: null,
            addedAt: Date.now(),
          };

          // Add at the beginning and limit total jobs
          const newJobs = [newJob, ...state.jobs].slice(0, MAX_JOBS);

          return { jobs: newJobs };
        });
      },

      updateJobStatus: (jobId: string, status: GetJobStatusResponse | null, error: string | null = null) => {
        set(state => ({
          jobs: state.jobs.map(job =>
            job.jobId === jobId
              ? { ...job, status, error }
              : job
          ),
        }));
      },

      removeJob: (jobId: string) => {
        set(state => ({
          jobs: state.jobs.filter(job => job.jobId !== jobId),
        }));
      },

      clearCompletedJobs: () => {
        set(state => ({
          jobs: state.jobs.filter(job => {
            if (!job.status) return true;
            const status = job.status.status;
            return status === 'pending' || status === 'processing';
          }),
        }));
      },

      clearAllJobs: () => {
        set({ jobs: [] });
      },

      getJobsByDomain: (domain: string) => {
        const { jobs } = get();
        return jobs.filter(job => job.domain === domain);
      },

      getActiveJobs: () => {
        const { jobs } = get();
        return jobs.filter(job => {
          if (!job.status) return true;
          const status = job.status.status;
          return status === 'pending' || status === 'processing';
        });
      },

      hasActiveJobs: () => {
        const { jobs } = get();
        return jobs.some(job => {
          if (!job.status) return true;
          const status = job.status.status;
          return status === 'pending' || status === 'processing';
        });
      },

      setPolling: (isPolling: boolean) => {
        set({ isPolling });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        jobs: state.jobs.map(job => ({
          jobId: job.jobId,
          url: job.url,
          domain: job.domain,
          addedAt: job.addedAt,
          // Don't persist status and error as they should be refetched
        })),
      }),
    }
  )
);