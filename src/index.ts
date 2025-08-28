import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import archiveRoutes from './routes/archive';
import websiteRoutes from './routes/websites';
import viewRoutes from './routes/view';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
async function connectToDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.mongo_uri;
    if (!mongoUri) {
      throw new Error('mongo_uri environment variable is required');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

app.use(express.json());

// Routes
app.use('/api', archiveRoutes);
app.use('/api', websiteRoutes);
app.use('/view', viewRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Website Archiving Project' });
});

// Start server
async function startServer(): Promise<void> {
  await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
