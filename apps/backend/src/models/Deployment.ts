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
  containerName?: string;
  containerPort?: number;
  healthCheckPath?: string;
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string;
  isRollback?: boolean;
  rolledBackFrom?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema = new Schema<IDeployment>({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  status: { type: String, enum: Object.values(DeploymentStatus), default: DeploymentStatus.QUEUED },
  commitSha: { type: String },
  imageTag: { type: String },
  containerName: { type: String },
  containerPort: { type: Number },
  healthCheckPath: { type: String },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  errorMessage: { type: String },
  isRollback: { type: Boolean, default: false },
  rolledBackFrom: { type: Schema.Types.ObjectId, ref: 'Deployment' },
}, { timestamps: true });

export const Deployment = model<IDeployment>('Deployment', DeploymentSchema);