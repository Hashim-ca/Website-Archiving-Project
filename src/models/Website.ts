import { Schema, model, Document, Types } from 'mongoose';

interface ISnapshot extends Document {}

export interface IWebsite extends Document {
  domain: string;
  originalUrl: string;
  snapshots: Types.ObjectId[] | ISnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const WebsiteSchema = new Schema<IWebsite>({
  domain: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  originalUrl: {
    type: String,
    required: true,
    trim: true
  },
  snapshots: [{
    type: Schema.Types.ObjectId,
    ref: 'Snapshot'
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Create and export the model
export const Website = model<IWebsite>('Website', WebsiteSchema);
