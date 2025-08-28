import mongoose from 'mongoose';
import { config, validateConfig } from './config/environment';
import { WorkerService } from './services/WorkerService';

async function startWorker(): Promise<void> {
  try {
    validateConfig();
    console.log('Environment configuration validated');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB successfully');

    const worker = new WorkerService();
    
    const gracefulShutdown = () => {
      console.log('\nReceived shutdown signal. Gracefully shutting down worker...');
      worker.stop();
      
      setTimeout(() => {
        mongoose.connection.close().then(() => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      }, 100);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    worker.start(5000);
    console.log('Worker is now running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startWorker().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}