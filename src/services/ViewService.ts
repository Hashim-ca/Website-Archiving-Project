import { Readable } from 'stream';
import { Types } from 'mongoose';
import { Snapshot, ISnapshot } from '../models/Snapshot';

export interface StreamResponse {
  stream: Readable;
  contentType: string;
  contentLength?: number;
}

export class ViewService {
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
   * Fetches file from Cloudflare R2 and returns stream
   * Note: This is a placeholder implementation - you'll need to integrate with actual R2 client
   */
  private async fetchFromR2(objectKey: string): Promise<StreamResponse> {
    // TODO: Replace with actual Cloudflare R2 implementation
    // This is a placeholder that should be replaced with:
    // - AWS S3 SDK configured for R2
    // - Proper authentication and bucket configuration
    // - Error handling for missing objects
    
    throw new Error('R2 integration not yet implemented - please configure Cloudflare R2 client');
    
    // Example of what the real implementation would look like:
    /*
    const response = await this.r2Client.getObject({
      Bucket: this.bucketName,
      Key: objectKey
    }).promise();

    if (!response.Body) {
      throw new Error('Object not found in R2');
    }

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType || this.getContentType(objectKey),
      contentLength: response.ContentLength
    };
    */
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