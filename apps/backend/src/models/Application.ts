import { Schema, model, Document, Types } from 'mongoose';

export enum ApplicationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface IApplication extends Document {
  name: string;
  slug: string;
  description?: string;
  repositoryUrl?: string;
  branch: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  repositoryUrl: { type: String },
  branch: { type: String, default: 'main' },
  status: { type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.ACTIVE },
}, { timestamps: true });

export const Application = model<IApplication>('Application', ApplicationSchema);
