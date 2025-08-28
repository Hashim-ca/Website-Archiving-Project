import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { config, validateConfig } from '../config/environment';
import { WorkerService } from '../workers/WorkerService';

let cachedDb: typeof mongoose | null = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  validateConfig();
  await mongoose.connect(config.mongodb.uri);
  cachedDb = mongoose;
  return cachedDb;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    const worker = new WorkerService();
    const result = await worker.processNextJob();
    
    if (result) {
      res.status(200).json({ message: 'Job processed successfully', jobId: result });
    } else {
      res.status(200).json({ message: 'No jobs to process' });
    }
  } catch (error) {
    console.error('Error processing job:', error);
    res.status(500).json({ 
      error: 'Failed to process job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}