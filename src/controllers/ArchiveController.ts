import { Request, Response } from 'express';
import { ArchiveService } from '../services/ArchiveService';
import { CreateArchiveRequest, CreateArchiveResponse } from '../types';

export class ArchiveController {
  private archiveService: ArchiveService;

  constructor() {
    this.archiveService = new ArchiveService();
  }

  /**
   * Handle POST /api/archive requests
   */
  public createArchive = async (req: Request<{}, CreateArchiveResponse, CreateArchiveRequest>, res: Response<CreateArchiveResponse>): Promise<void> => {
    try {
      const { url } = req.body;

      // Validate request body
      if (!url || typeof url !== 'string') {
        res.status(400).json({
          jobId: '',
          message: 'URL is required and must be a string'
        });
        return;
      }

      if (url.trim() === '') {
        res.status(400).json({
          jobId: '',
          message: 'URL cannot be empty'
        });
        return;
      }

      // Create archive job
      const jobId = await this.archiveService.createArchiveJob(url.trim());

      // Return success response
      res.status(202).json({
        jobId,
        message: 'Archiving has been queued.'
      });

    } catch (error) {
      // Handle validation and other errors
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      res.status(400).json({
        jobId: '',
        message: errorMessage
      });
    }
  };
}
