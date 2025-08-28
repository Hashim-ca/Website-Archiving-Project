import { Request, Response } from 'express';
import { WebsiteService } from '../services/WebsiteService';
import { GetWebsiteResponse } from '../types';

export class WebsiteController {
  private websiteService: WebsiteService;

  constructor() {
    this.websiteService = new WebsiteService();
  }

  /**
   * Handle GET /api/websites requests
   */
  public getWebsites = async (
    req: Request,
    res: Response<GetWebsiteResponse | { message: string }>
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

      // Get website with snapshots
      const website = await this.websiteService.getWebsiteByDomain(
        domain.trim()
      );

      if (!website) {
        res.status(404).json({
          message: `Website not found for domain: ${domain}`,
        });
        return;
      }

      // Return success response
      res.status(200).json(website);
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
