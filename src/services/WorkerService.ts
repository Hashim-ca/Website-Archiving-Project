import { Types } from 'mongoose';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import * as path from 'path';
import { Job, IJob } from '../models/Job';
import { Snapshot, ISnapshot } from '../models/Snapshot';
import { Website } from '../models/Website';
import { FirecrawlService, FirecrawlResponse } from './FirecrawlService';
import { R2StorageService } from './R2StorageService';

interface ProcessedAsset {
  originalUrl: string;
  hashedName: string;
  relativePath: string;
}

export class WorkerService {
  private firecrawlService: FirecrawlService;
  private r2Service: R2StorageService;
  private isRunning = false;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor() {
    this.firecrawlService = new FirecrawlService();
    this.r2Service = new R2StorageService();
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
      throw new Error(`Invalid HTML content received from Firecrawl. Type: ${typeof rawHtml}, Keys: ${Object.keys(firecrawlData.data || {}).join(', ')}`);
    }
    
    const $ = cheerio.load(rawHtml);

    const assetPromises: Promise<ProcessedAsset>[] = [];

    $('link[href], script[src], img[src]').each((_, element) => {
      const $element = $(element);
      const assetUrl = $element.attr('href') || $element.attr('src');
      
      if (assetUrl && this.isValidAssetUrl(assetUrl)) {
        const absoluteUrl = this.resolveAbsoluteUrl(assetUrl, originalUrl);
        assetPromises.push(this.processAsset(snapshotId, absoluteUrl, $element));
      }
    });

    const processedAssets = await Promise.allSettled(assetPromises);
    
    const failed = processedAssets.filter(result => result.status === 'rejected');
    const successful = processedAssets.filter(result => result.status === 'fulfilled');
    
    if (failed.length > 0) {
      console.log(`Asset processing summary: ${successful.length} successful, ${failed.length} failed/skipped`);
    } else {
      console.log(`Successfully processed ${successful.length} assets`);
    }

    const modifiedHtml = $.html();
    const htmlPath = this.r2Service.generateStoragePath(snapshotId, 'index.html');
    await this.r2Service.uploadFile(htmlPath, modifiedHtml, 'text/html');

    if (firecrawlData.data.screenshot) {
      await this.processScreenshot(snapshotId, firecrawlData.data.screenshot);
    }

    snapshot.storagePath = this.r2Service.generateStoragePath(snapshotId);
    await snapshot.save();
  }

  private async processAsset(
    snapshotId: string,
    absoluteUrl: string,
    $element: cheerio.Cheerio
  ): Promise<ProcessedAsset> {
    const hashedName = this.generateAssetHash(absoluteUrl);
    const assetPath = this.r2Service.generateAssetPath(snapshotId, hashedName);
    const relativePath = `_assets/${hashedName}`;

    try {
      const assetBuffer = await this.r2Service.downloadFile(absoluteUrl);
      const contentType = this.getContentTypeFromUrl(absoluteUrl);
      
      await this.r2Service.uploadFile(assetPath, assetBuffer, contentType);

      if ($element.attr('href')) {
        $element.attr('href', relativePath);
      } else if ($element.attr('src')) {
        $element.attr('src', relativePath);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP error! status: 404')) {
        console.log(`Asset not found (404), keeping original URL: ${absoluteUrl}`);
        return {
          originalUrl: absoluteUrl,
          hashedName,
          relativePath: absoluteUrl,
        };
      }
      
      console.warn(`Failed to process asset ${absoluteUrl}, keeping original URL:`, error instanceof Error ? error.message : 'Unknown error');
      return {
        originalUrl: absoluteUrl,
        hashedName,
        relativePath: absoluteUrl,
      };
    }

    return {
      originalUrl: absoluteUrl,
      hashedName,
      relativePath,
    };
  }

  private async processScreenshot(snapshotId: string, screenshotUrl: string): Promise<void> {
    try {
      const screenshotBuffer = await this.r2Service.downloadFile(screenshotUrl);
      const thumbnailPath = this.r2Service.generateStoragePath(snapshotId, 'thumbnail.png');
      
      await this.r2Service.uploadFile(thumbnailPath, screenshotBuffer, 'image/png');
    } catch (error) {
      console.warn(`Failed to process screenshot for snapshot ${snapshotId}:`, error);
    }
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

  private isValidAssetUrl(url: string): boolean {
    if (!url || url.trim() === '') {
      return false;
    }
    
    return !url.startsWith('data:') && 
           !url.startsWith('javascript:') && 
           !url.startsWith('#') &&
           !url.startsWith('mailto:') &&
           !url.startsWith('tel:') &&
           !url.startsWith('blob:') &&
           url.length < 2048; // Reasonable URL length limit
  }

  private resolveAbsoluteUrl(assetUrl: string, baseUrl: string): string {
    try {
      return new URL(assetUrl, baseUrl).href;
    } catch {
      return assetUrl;
    }
  }

  private generateAssetHash(url: string): string {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const extension = this.getFileExtension(url);
    return `${hash}${extension}`;
  }

  private getFileExtension(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const extension = path.extname(pathname);
      return extension || '.asset';
    } catch {
      return '.asset';
    }
  }

  private getContentTypeFromUrl(url: string): string {
    const extension = this.getFileExtension(url).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}