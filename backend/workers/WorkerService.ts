import { Types } from 'mongoose';
import { Job, IJob } from '../models/Job';
import { Snapshot, ISnapshot } from '../models/Snapshot';
import { Website } from '../models/Website';
import { FirecrawlService, FirecrawlResponse } from '../services/worker-services/FirecrawlService';
import { R2StorageService } from '../services/R2StorageService';
import { AssetProcessingService } from '../services/worker-services/AssetProcessingService';
import { ExternalServiceError } from '../types/errors';
import { extractPath } from '../utils/url';

export class WorkerService {
  private firecrawlService: FirecrawlService;
  private r2Service: R2StorageService;
  private assetService: AssetProcessingService;
  private isRunning = false;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor() {
    this.firecrawlService = new FirecrawlService();
    this.r2Service = new R2StorageService();
    this.assetService = new AssetProcessingService();
  }

  start(intervalMs = 5000): void {
    if (this.isRunning) {
      console.log('Worker is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Worker started with ${intervalMs}ms interval`);

    this.intervalId = setInterval(async () => {
      try {
        await this.processNextJob();
      } catch (error) {
        console.error('Error in worker loop:', error);
      }
    }, intervalMs);
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Worker is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Worker stopped');
  }

  private async processNextJob(): Promise<void> {
    const job = await this.findAndLockJob();
    if (!job) {
      return;
    }

    console.log(`Processing job ${job._id} for URL: ${job.urlToArchive}`);

    let snapshot: ISnapshot | null = null;

    try {
      snapshot = await this.createSnapshot(job);
      console.log(`Created snapshot ${snapshot._id} for job ${job._id}`);
      
      console.log(`Calling Firecrawl API for URL: ${job.urlToArchive}`);
      const firecrawlData = await this.firecrawlService.scrapeUrl(job.urlToArchive);
      console.log(`Firecrawl API response received, success: ${firecrawlData.success}`);
      
      await this.processWebsiteData(snapshot, firecrawlData, job.urlToArchive);
      await this.finalizeSuccess(job, snapshot);
      
      console.log(`Successfully completed job ${job._id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Job ${job._id} failed:`, errorMessage);
      
      await this.finalizeFailure(job, snapshot, errorMessage);
      
      if (snapshot) {
        await this.cleanupFailedSnapshot((snapshot._id as Types.ObjectId).toString());
      }
    }
  }

  private async findAndLockJob(): Promise<IJob | null> {
    try {
      const job = await Job.findOneAndUpdate(
        { status: 'pending' },
        { 
          status: 'processing',
          processedAt: new Date()
        },
        { 
          new: true,
          sort: { createdAt: 1 }
        }
      );

      return job;
    } catch (error) {
      console.error('Error finding and locking job:', error);
      return null;
    }
  }

  private async createSnapshot(job: IJob): Promise<ISnapshot> {
    const snapshot = new Snapshot({
      website: job.website,
      path: extractPath(job.urlToArchive),
      status: 'processing',
      storagePath: `snapshots/${new Types.ObjectId().toString()}`,
      entrypoint: 'index.html',
      jobId: job._id,
    });

    await snapshot.save();
    return snapshot;
  }

  private async processWebsiteData(
    snapshot: ISnapshot, 
    firecrawlData: FirecrawlResponse, 
    originalUrl: string
  ): Promise<void> {
    const snapshotId = (snapshot._id as Types.ObjectId).toString();
    
    console.log('Firecrawl response keys:', Object.keys(firecrawlData.data || {}));
    
    const rawHtml = firecrawlData.data.rawHtml || firecrawlData.data.html;
    if (!rawHtml || typeof rawHtml !== 'string') {
      throw new ExternalServiceError(
        `Invalid HTML content received from Firecrawl. Type: ${typeof rawHtml}, Keys: ${Object.keys(firecrawlData.data || {}).join(', ')}`,
        'firecrawl'
      );
    }
    
    // Process HTML assets using dedicated service
    const processedHtml = await this.assetService.processHtmlAssets(rawHtml, snapshotId, originalUrl);

    // Upload processed HTML
    const htmlPath = this.r2Service.generateStoragePath(snapshotId, 'index.html');
    await this.r2Service.uploadFile(htmlPath, processedHtml, 'text/html');

    // Process screenshot if available
    if (firecrawlData.data.screenshot) {
      await this.assetService.processScreenshot(snapshotId, firecrawlData.data.screenshot);
    }

    snapshot.storagePath = this.r2Service.generateStoragePath(snapshotId);
    await snapshot.save();
  }


  private async finalizeSuccess(job: IJob, snapshot: ISnapshot): Promise<void> {
    snapshot.status = 'completed';
    await snapshot.save();

    job.status = 'completed';
    await job.save();

    const website = await Website.findById(job.website);
    if (website) {
      (website.snapshots as Types.ObjectId[]).push(snapshot._id as Types.ObjectId);
      await website.save();
    }
  }

  private async finalizeFailure(
    job: IJob, 
    snapshot: ISnapshot | null, 
    errorMessage: string
  ): Promise<void> {
    if (snapshot) {
      snapshot.status = 'failed';
      await snapshot.save();
    }

    job.status = 'failed';
    job.error = errorMessage;
    await job.save();
  }

  private async cleanupFailedSnapshot(snapshotId: string): Promise<void> {
    try {
      const folderPrefix = `snapshots/${snapshotId}`;
      await this.r2Service.deleteFolder(folderPrefix);
    } catch (error) {
      console.error(`Failed to cleanup snapshot ${snapshotId}:`, error);
    }
  }

}