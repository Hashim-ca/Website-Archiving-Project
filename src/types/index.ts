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
