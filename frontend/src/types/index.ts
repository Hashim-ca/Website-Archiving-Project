// Core domain types matching backend models exactly
export interface Website {
  domain: string;
  originalUrl: string;
  snapshots: Snapshot[];
  createdAt: string; // ISO date string for API transport
  updatedAt: string;
}

export interface Snapshot {
  _id: string;
  path: string;
  status: 'processing' | 'completed' | 'failed';
  storagePath: string;
  entrypoint: string;
  jobId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  _id: string;
  urlToArchive: string;
  website: string; // ObjectId as string
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
  processedAt?: string;
}

// API Request/Response types matching backend exactly
export interface CreateArchiveRequest {
  url: string;
}

export interface CreateArchiveResponse {
  jobId: string;
  message: string;
}

export interface GetWebsiteResponse {
  domain: string;
  originalUrl: string;
  snapshots: {
    _id: string;
    path: string;
    status: 'processing' | 'completed' | 'failed';
    storagePath: string;
    entrypoint: string;
    jobId: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ViewContentRequest {
  snapshotId: string;
  filePath?: string;
}

export interface ViewErrorResponse {
  error: string;
}

export interface SitePageSuggestionsRequest {
  domain: string;
}

export interface SitePageSuggestion {
  url: string;
}

export interface SitePageSuggestionsResponse {
  domain: string;
  suggestions: SitePageSuggestion[];
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// Form validation types
export interface FormError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormError[];
}

// API Error types
export interface ApiError {
  message: string;
  statusCode?: number;
  field?: string;
}

// Hook return types
export interface UseAsyncResult<T> extends AsyncState<T> {
  refetch: () => Promise<void>;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Status-related types and utilities
export type SnapshotStatus = 'processing' | 'completed' | 'failed';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export const isCompletedStatus = (status: SnapshotStatus | JobStatus): boolean => {
  return status === 'completed';
};

export const isFailedStatus = (status: SnapshotStatus | JobStatus): boolean => {
  return status === 'failed';
};

export const isProcessingStatus = (status: SnapshotStatus | JobStatus): boolean => {
  return status === 'processing' || status === 'pending';
};