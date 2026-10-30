import { Schema, model, Document, Types } from 'mongoose';

export enum DeploymentStatus {
  QUEUED = 'queued',
  BUILDING = 'building',
  DEPLOYING = 'deploying',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface IDeployment extends Document {
  applicationId: Types.ObjectId;
  status: DeploymentStatus;
  commitSha?: string;
  imageTag?: string;
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema = new Schema<IDeployment>({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  status: { type: String, enum: Object.values(DeploymentStatus), default: DeploymentStatus.QUEUED },
  commitSha: { type: String },
  imageTag: { type: String },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  errorMessage: { type: String },
}, { timestamps: true });

export const Deployment = model<IDeployment>('Deployment', DeploymentSchema);
