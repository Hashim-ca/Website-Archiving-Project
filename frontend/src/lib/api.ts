import { 
  CreateArchiveRequest, 
  CreateArchiveResponse, 
  GetWebsiteResponse, 
  SitePageSuggestionsResponse,
  ApiError 
} from '@/types';

// API base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          field: errorData.field,
        };
        throw apiError;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server');
      }
      throw error;
    }
  }

  // Archive endpoints
  async createArchive(data: CreateArchiveRequest): Promise<CreateArchiveResponse> {
    return this.request<CreateArchiveResponse>('/api/archive', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Website endpoints
  async getWebsite(domain: string, path?: string): Promise<GetWebsiteResponse> {
    const params = new URLSearchParams({ domain });
    if (path) {
      params.set('path', path);
    }
    
    return this.request<GetWebsiteResponse>(`/api/websites?${params.toString()}`);
  }

  // Site page suggestions endpoints
  async getSitePageSuggestions(domain: string): Promise<SitePageSuggestionsResponse> {
    const params = new URLSearchParams({ domain });
    return this.request<SitePageSuggestionsResponse>(`/api/site-page-suggestions?${params.toString()}`);
  }

  // View content endpoint (returns URL for viewing)
  getViewUrl(snapshotId: string, filePath: string = 'index.html'): string {
    return `${this.baseUrl}/view/${snapshotId}/${filePath}`;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export individual API functions for easier usage
export const createArchive = (data: CreateArchiveRequest) => apiClient.createArchive(data);
export const getWebsite = (domain: string, path?: string) => apiClient.getWebsite(domain, path);
export const getSitePageSuggestions = (domain: string) => apiClient.getSitePageSuggestions(domain);
export const getViewUrl = (snapshotId: string, filePath?: string) => apiClient.getViewUrl(snapshotId, filePath);