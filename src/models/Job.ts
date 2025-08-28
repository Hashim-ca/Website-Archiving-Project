import { Schema, model, Document, Types } from 'mongoose';
import { IWebsite } from './Website';

// TypeScript Interface
export interface IJob extends Document {
  urlToArchive: string;
  website: Types.ObjectId | IWebsite;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  processedAt?: Date;
}

// Mongoose Schema
const JobSchema = new Schema<IJob>({
  urlToArchive: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: Schema.Types.ObjectId,
    ref: 'Website',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    required: true,
    default: 'pending',
    index: true
  },
  error: {
    type: String,
    trim: true
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Only track createdAt, not updatedAt
});

// Create and export the model
export const Job = model<IJob>('Job', JobSchema);
