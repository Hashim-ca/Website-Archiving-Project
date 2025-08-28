import AWS from 'aws-sdk';
import { config } from '../config/environment';

export class R2StorageService {
  private s3: AWS.S3;
  private bucketName: string;
  private bucketPrefix: string;

  constructor() {
    this.bucketName = config.cloudflare.r2BucketName;
    this.bucketPrefix = config.cloudflare.r2BucketPrefix;

    this.s3 = new AWS.S3({
      endpoint: config.cloudflare.s3ApiEndpoint,
      accessKeyId: config.cloudflare.accessKeyId,
      secretAccessKey: config.cloudflare.secretAccessKey,
      region: 'auto',
      signatureVersion: 'v4',
    });
  }

  async uploadFile(key: string, body: Buffer | string, contentType?: string): Promise<void> {
    const fullKey = `${this.bucketPrefix}/${key}`;
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: fullKey,
      Body: body,
      ContentType: contentType,
    };

    try {
      await this.s3.upload(params).promise();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload file ${key}: ${error.message}`);
      }
      throw new Error(`Failed to upload file ${key}: Unknown error`);
    }
  }

  async deleteFolder(prefix: string): Promise<void> {
    try {
      const fullPrefix = `${this.bucketPrefix}/${prefix}`;
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucketName,
        Prefix: fullPrefix,
      };

      const listedObjects = await this.s3.listObjectsV2(listParams).promise();

      if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        console.log(`No objects found to delete for prefix: ${prefix}`);
        return;
      }

      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: this.bucketName,
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({ Key: Key! })),
        },
      };

      await this.s3.deleteObjects(deleteParams).promise();
      console.log(`Deleted ${listedObjects.Contents.length} objects with prefix: ${prefix}`);

      if (listedObjects.IsTruncated) {
        await this.deleteFolder(prefix);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        console.log(`Folder ${prefix} does not exist, skipping cleanup`);
        return;
      }
      
      if (error instanceof Error) {
        throw new Error(`Failed to delete folder ${prefix}: ${error.message}`);
      }
      throw new Error(`Failed to delete folder ${prefix}: Unknown error`);
    }
  }

  async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to download file from ${url}: ${error.message}`);
      }
      throw new Error(`Failed to download file from ${url}: Unknown error`);
    }
  }

  generateStoragePath(snapshotId: string, fileName?: string): string {
    const basePath = `snapshots/${snapshotId}`;
    return fileName ? `${basePath}/${fileName}` : basePath;
  }

  generateAssetPath(snapshotId: string, assetName: string): string {
    return `snapshots/${snapshotId}/_assets/${assetName}`;
  }

  async getObject(key: string): Promise<AWS.S3.GetObjectOutput> {
    const fullKey = `${this.bucketPrefix}/${key}`;
    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.bucketName,
      Key: fullKey,
    };

    try {
      return await this.s3.getObject(params).promise();
    } catch (error) {
      if (error instanceof Error) {
        console.log(`R2StorageService error details:`, error);
        throw new Error(`Failed to get object ${fullKey}: ${error.message}`);
      }
      throw new Error(`Failed to get object ${fullKey}: Unknown error`);
    }
  }
}