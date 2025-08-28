// Request/Response types for API endpoints

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

// View service types
export interface ViewContentRequest {
  snapshotId: string;
  filePath?: string;
}

export interface ViewErrorResponse {
  error: string;
}

// Job status types
export interface GetJobStatusRequest {
  jobId: string;
}

export interface GetJobStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  urlToArchive: string;
  website?: {
    domain: string;
    snapshots: {
      _id: string;
      path: string;
      status: 'processing' | 'completed' | 'failed';
      storagePath: string;
      entrypoint: string;
      createdAt: Date;
      updatedAt: Date;
    }[];
  };
}

// Site page suggestions types
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
