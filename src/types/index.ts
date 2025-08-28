// Request/Response types for API endpoints

export interface CreateArchiveRequest {
  url: string;
}

export interface CreateArchiveResponse {
  jobId: string;
  message: string;
}
