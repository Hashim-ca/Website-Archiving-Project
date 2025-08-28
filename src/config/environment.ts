import dotenv from 'dotenv';

dotenv.config();

interface Config {
  mongodb: {
    uri: string;
  };
  firecrawl: {
    apiKey: string;
  };
  cloudflare: {
    tokenValue: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3ApiEndpoint: string;
    publicDevUrl: string;
    r2BucketName: string;
  };
}

export const config: Config = {
  mongodb: {
    uri: process.env.MONGO_URI || '',
  },
  firecrawl: {
    apiKey: process.env.FIRECRAWL_KEY || '',
  },
  cloudflare: {
    tokenValue: process.env.CLOUDFLARE_TOKEN_VALUE || '',
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
    s3ApiEndpoint: process.env.S3_API || '',
    publicDevUrl: process.env.CLOUDFLARE_PUBLIC_DEVELOPMENT_URL_R2 || '',
    r2BucketName: process.env.R2_BUCKET_NAME || '',
  },
};

export function validateConfig(): void {
  const requiredFields = [
    'MONGO_URI',
    'FIRECRAWL_KEY',
    'CLOUDFLARE_ACCESS_KEY_ID',
    'CLOUDFLARE_SECRET_ACCESS_KEY',
    'S3_API',
    'R2_BUCKET_NAME',
  ];

  const missing = requiredFields.filter(field => !process.env[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}