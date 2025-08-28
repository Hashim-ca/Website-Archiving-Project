import { Request, Response } from 'express';
import { SitePageSuggestionsService } from '../services/SitePageSuggestionsService';
import { SitePageSuggestionsResponse } from '../types';

export class SitePageSuggestionsController {
  private sitePageSuggestionsService: SitePageSuggestionsService;

  constructor() {
    this.sitePageSuggestionsService = new SitePageSuggestionsService();
  }

  /**
   * Handle GET /api/site-page-suggestions requests
   */
  public getSitePageSuggestions = async (
    req: Request,
    res: Response<SitePageSuggestionsResponse | { message: string }>
  ): Promise<void> => {
    try {
      const { domain } = req.query;

      // Validate domain query parameter
      if (!domain || typeof domain !== 'string') {
        res.status(400).json({
          message: 'Domain query parameter is required',
        });
        return;
      }

      if (domain.trim() === '') {
        res.status(400).json({
          message: 'Domain cannot be empty',
        });
        return;
      }

      // Get site page suggestions using Firecrawl
      const suggestions = await this.sitePageSuggestionsService.getSitePageSuggestions(domain);

      // Return success response
      res.status(200).json(suggestions);
    } catch (error) {
      // Handle service errors
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';

      res.status(500).json({
        message: errorMessage,
      });
    }
  };
}