import { Readable } from 'stream';
import { Types } from 'mongoose';
import { Snapshot, ISnapshot } from '../models/Snapshot';

export interface StreamResponse {
  stream: Readable;
  contentType: string;
  contentLength?: number;
}

export class ViewService {
  constructor() {
    // Using public R2 URLs now, no need for R2StorageService
  }
  /**
   * Gets the MIME type based on file extension
   */
  private getContentType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    const mimeTypes: Record<string, string> = {
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'xml': 'application/xml',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'eot': 'application/vnd.ms-fontobject'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Constructs the full R2 object key
   */
  private constructObjectKey(storagePath: string, filePath: string): string {
    // Remove leading slash from filePath if present
    const cleanFilePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // Ensure storagePath doesn't end with slash and filePath doesn't start with slash
    const cleanStoragePath = storagePath.endsWith('/') ? storagePath.slice(0, -1) : storagePath;
    
    return `${cleanStoragePath}/${cleanFilePath}`;
  }

  /**
   * Finds snapshot by ID and validates it's completed
   */
  private async findSnapshot(snapshotId: string): Promise<ISnapshot> {
    const snapshot = await Snapshot.findById(new Types.ObjectId(snapshotId));
    
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    if (snapshot.status !== 'completed') {
      throw new Error('Snapshot is not ready for viewing');
    }

    return snapshot;
  }

  /**
   * Fetches file from Cloudflare R2 public URL and returns stream
   */
  private async fetchFromR2(objectKey: string): Promise<StreamResponse> {
    try {
      // Use the public R2 URL instead of AWS SDK
      const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_DEVELOPMENT_URL_R2}/${process.env.R2_BUCKET_PREFIX || 'web-archive-project'}/${objectKey}`;
      
      console.log(`Fetching file from R2 public URL: ${publicUrl}`);
      
      const response = await fetch(publicUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found in storage');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the response body as a stream
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stream = Readable.from(buffer);

      return {
        stream,
        contentType: response.headers.get('content-type') || this.getContentType(objectKey),
        contentLength: buffer.length
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('R2 fetch error:', error.message);
        throw new Error(`Failed to fetch file from R2: ${error.message}`);
      }
      throw new Error('Failed to fetch file from R2: Unknown error');
    }
  }

  /**
   * Gets archived file from R2 storage
   */
  public async getArchivedFile(snapshotId: string, filePath: string): Promise<StreamResponse> {
    // Find and validate snapshot
    const snapshot = await this.findSnapshot(snapshotId);
    // Construct R2 object key
    const objectKey = this.constructObjectKey(snapshot.storagePath, filePath);
    
    // Fetch from R2
    const response = await this.fetchFromR2(objectKey);

    // Ensure we have the correct content type
    const contentType = response.contentType || this.getContentType(filePath);

    return {
      ...response,
      contentType
    };
  }
}