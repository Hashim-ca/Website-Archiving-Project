import { SitePageSuggestionsResponse, SitePageSuggestion } from '../types';
import { ArchiveError } from '../types/errors';
import { normalizeDomain } from '../utils/url';
import { config } from '../config/environment';

interface FirecrawlMapResult {
  url: string;
}

interface FirecrawlMapResponse {
  success: boolean;
  links: FirecrawlMapResult[];
}

export class SitePageSuggestionsService {
  private readonly firecrawlApiUrl = 'https://api.firecrawl.dev/v2/map';
  private readonly firecrawlApiKey = config.firecrawl.apiKey;

  /**
   * Get page suggestions for a given domain using Firecrawl site mapper
   */
  public async getSitePageSuggestions(
    domain: string
  ): Promise<SitePageSuggestionsResponse> {
    try {
      const normalizedDomain = normalizeDomain(domain);

      const requestBody = {
        url: normalizedDomain,
        sitemap: 'include'
      };

      const response = await fetch(this.firecrawlApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new ArchiveError(
          `Firecrawl API request failed: ${response.status} ${response.statusText}`
        );
      }

      const rawData: unknown = await response.json();
      
      // Type guard to validate response structure
      if (!rawData || typeof rawData !== 'object') {
        throw new ArchiveError('Invalid response format from Firecrawl API');
      }
      
      const data = rawData as FirecrawlMapResponse;

      if (!data.success) {
        throw new ArchiveError('Firecrawl API returned unsuccessful response');
      }

      // Transform Firecrawl results to our format
      const suggestions: SitePageSuggestion[] = data.links.map((result) => ({
        url: result.url
      }));

      return {
        domain: normalizedDomain,
        suggestions
      };
    } catch (error) {
      if (error instanceof ArchiveError) {
        throw error;
      }
      
      throw new ArchiveError(
        `Failed to get site page suggestions: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}