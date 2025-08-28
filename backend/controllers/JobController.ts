import { Request, Response } from 'express';
import { JobService } from '../services/JobService';
import { GetJobStatusResponse } from '../types';
import { ValidationError, NotFoundError } from '../types/errors';

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  /**
   * Handle GET /api/jobs/:jobId requests
   */
  public getJobStatus = async (
    req: Request,
    res: Response<GetJobStatusResponse | { message: string }>
  ): Promise<void> => {
    try {
      const { jobId } = req.params;

      // Validate jobId parameter
      if (!jobId || typeof jobId !== 'string') {
        res.status(400).json({
          message: 'Job ID parameter is required',
        });
        return;
      }

      if (jobId.trim() === '') {
        res.status(400).json({
          message: 'Job ID cannot be empty',
        });
        return;
      }

      // Get job status
      const jobStatus = await this.jobService.getJobStatus(jobId.trim());

      // Return success response
      res.status(200).json(jobStatus);
    } catch (error) {
      // Handle specific error types
      if (error instanceof ValidationError) {
        res.status(400).json({
          message: error.message,
        });
        return;
      }

      if (error instanceof NotFoundError) {
        res.status(404).json({
          message: error.message,
        });
        return;
      }

      // Handle other errors
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';

      res.status(500).json({
        message: errorMessage,
      });
    }
  };

  /**
   * Handle GET /api/jobs requests with multiple job IDs
   */
  public getMultipleJobStatuses = async (
    req: Request,
    res: Response<GetJobStatusResponse[] | { message: string }>
  ): Promise<void> => {
    try {
      const { ids } = req.query;

      // Validate ids query parameter
      if (!ids) {
        res.status(400).json({
          message: 'Job IDs query parameter is required',
        });
        return;
      }

      // Handle both string and array formats
      let jobIds: string[];
      if (typeof ids === 'string') {
        jobIds = ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
      } else if (Array.isArray(ids)) {
        jobIds = ids.map(id => String(id).trim()).filter(id => id.length > 0);
      } else {
        res.status(400).json({
          message: 'Invalid job IDs format',
        });
        return;
      }

      if (jobIds.length === 0) {
        res.status(400).json({
          message: 'At least one job ID is required',
        });
        return;
      }

      // Limit the number of jobs that can be queried at once
      if (jobIds.length > 50) {
        res.status(400).json({
          message: 'Cannot query more than 50 jobs at once',
        });
        return;
      }

      // Get multiple job statuses
      const jobStatuses = await this.jobService.getMultipleJobStatuses(jobIds);

      // Return success response
      res.status(200).json(jobStatuses);
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
