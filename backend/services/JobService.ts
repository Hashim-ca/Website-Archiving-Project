import { Types } from 'mongoose';
import { Job, IJob } from '../models/Job';
import { Website } from '../models/Website';
import { NotFoundError, ValidationError } from '../types/errors';
import { GetJobStatusResponse } from '../types';

export class JobService {
  /**
   * Get job status by job ID
   */
  public async getJobStatus(jobId: string): Promise<GetJobStatusResponse> {
    // Validate jobId is a valid ObjectId
    if (!Types.ObjectId.isValid(jobId)) {
      throw new ValidationError('Invalid job ID format');
    }

    // Find job by ID and populate website with snapshots
    const job = await Job.findById(jobId)
      .populate({
        path: 'website',
        model: Website,
        populate: {
          path: 'snapshots',
        },
      })
      .lean<IJob>();

    if (!job) {
      throw new NotFoundError(`Job not found with ID: ${jobId}`);
    }

    // Build response
    const response: GetJobStatusResponse = {
      jobId: job._id.toString(),
      status: job.status,
      error: job.error,
      createdAt: job.createdAt,
      processedAt: job.processedAt,
      urlToArchive: job.urlToArchive,
    };

    // Include website data if populated and job is completed
    if (job.status === 'completed' && job.website && typeof job.website === 'object' && 'domain' in job.website) {
      const website = job.website as any; // Type assertion for populated website
      response.website = {
        domain: website.domain,
        snapshots: website.snapshots?.map((snapshot: any) => ({
          _id: snapshot._id.toString(),
          path: snapshot.path,
          status: snapshot.status,
          storagePath: snapshot.storagePath,
          entrypoint: snapshot.entrypoint,
          createdAt: snapshot.createdAt,
          updatedAt: snapshot.updatedAt,
        })) || [],
      };
    }

    return response;
  }

  /**
   * Check if a job is complete (either completed or failed)
   */
  public async isJobComplete(jobId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new ValidationError('Invalid job ID format');
    }

    const job = await Job.findById(jobId).select('status').lean();
    
    if (!job) {
      throw new NotFoundError(`Job not found with ID: ${jobId}`);
    }

    return job.status === 'completed' || job.status === 'failed';
  }

  /**
   * Get multiple job statuses by IDs
   */
  public async getMultipleJobStatuses(jobIds: string[]): Promise<GetJobStatusResponse[]> {
    // Validate all jobIds
    const validJobIds = jobIds.filter(id => Types.ObjectId.isValid(id));
    
    if (validJobIds.length === 0) {
      return [];
    }

    const jobs = await Job.find({ _id: { $in: validJobIds } })
      .populate({
        path: 'website',
        model: Website,
        populate: {
          path: 'snapshots',
        },
      })
      .lean<IJob[]>();

    return jobs.map(job => {
      const response: GetJobStatusResponse = {
        jobId: job._id.toString(),
        status: job.status,
        error: job.error,
        createdAt: job.createdAt,
        processedAt: job.processedAt,
        urlToArchive: job.urlToArchive,
      };

      // Include website data if populated and job is completed
      if (job.status === 'completed' && job.website && typeof job.website === 'object' && 'domain' in job.website) {
        const website = job.website as any;
        response.website = {
          domain: website.domain,
          snapshots: website.snapshots?.map((snapshot: any) => ({
            _id: snapshot._id.toString(),
            path: snapshot.path,
            status: snapshot.status,
            storagePath: snapshot.storagePath,
            entrypoint: snapshot.entrypoint,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
          })) || [],
        };
      }

      return response;
    });
  }
}
