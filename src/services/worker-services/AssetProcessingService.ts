import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import * as path from 'path';
import { R2StorageService } from '../R2StorageService';
import { StorageError } from '../../types/errors';

export interface ProcessedAsset {
  originalUrl: string;
  hashedName: string;
  relativePath: string;
}

export class AssetProcessingService {
  private r2Service: R2StorageService;

  constructor() {
    this.r2Service = new R2StorageService();
  }

  /**
   * Process all assets in HTML content (images, scripts, stylesheets)
   */
  public async processHtmlAssets(
    html: string,
    snapshotId: string,
    originalUrl: string
  ): Promise<string> {
    const $ = cheerio.load(html);
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

    return $.html();
  }

  /**
   * Process a screenshot from Firecrawl
   */
  public async processScreenshot(snapshotId: string, screenshotUrl: string): Promise<void> {
    try {
      const screenshotBuffer = await this.r2Service.downloadFile(screenshotUrl);
      const thumbnailPath = this.r2Service.generateStoragePath(snapshotId, 'thumbnail.png');
      
      await this.r2Service.uploadFile(thumbnailPath, screenshotBuffer, 'image/png');
    } catch (error) {
      throw new StorageError(
        `Failed to process screenshot for snapshot ${snapshotId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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