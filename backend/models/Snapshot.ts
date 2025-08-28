import { Schema, model, Document, Types } from 'mongoose';

// Forward declaration to avoid circular imports
interface IWebsite extends Document {}
interface IJob extends Document {}

export interface ISnapshot extends Document {
  website: Types.ObjectId | IWebsite;
  path: string;
  status: 'processing' | 'completed' | 'failed';
  storagePath: string;
  entrypoint: string;
  jobId: Types.ObjectId | IJob;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const SnapshotSchema = new Schema<ISnapshot>(
  {
    website: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      default: '/',
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      required: true,
      default: 'processing',
    },
    storagePath: {
      type: String,
      required: true,
      trim: true,
    },
    entrypoint: {
      type: String,
      required: true,
      trim: true,
      default: 'index.html',
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create and export the model
export const Snapshot = model<ISnapshot>('Snapshot', SnapshotSchema);
