import { config } from '../../config/environment';

export interface FirecrawlResponse {
  success: boolean;
  data: {
    html?: string;
    rawHtml?: string;
    screenshot?: string;
    metadata: {
      title: string;
      description: string;
      language: string;
      sourceURL: string;
      statusCode: number;
      error?: string;
    };
  };
}

export class FirecrawlService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.firecrawl.dev/v2/scrape';

  constructor() {
    this.apiKey = config.firecrawl.apiKey;
    if (!this.apiKey) {
      throw new Error('Firecrawl API key is required');
    }
  }

  async scrapeUrl(url: string): Promise<FirecrawlResponse> {
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        formats: [
          'rawHtml',
          { type: 'screenshot', fullPage: true }
        ],
        onlyMainContent: true,
        maxAge: 172800000,
        parsers: ['pdf']
      })
    };

    try {
      const response = await fetch(this.baseUrl, options);
      
      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as FirecrawlResponse;
      
      if (!data.success) {
        throw new Error(`Firecrawl scraping failed: ${data.data?.metadata?.error || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to scrape URL ${url}: ${error.message}`);
      }
      throw new Error(`Failed to scrape URL ${url}: Unknown error`);
    }
  }
}