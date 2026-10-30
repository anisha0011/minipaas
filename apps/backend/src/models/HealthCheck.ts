import { Schema, model, Document, Types } from 'mongoose';

export type ContainerStatus = 'running' | 'stopped' | 'restarting' | 'unhealthy' | 'exited' | 'unknown';
export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';

export interface IHealthCheck extends Document {
  applicationId: Types.ObjectId;
  deploymentId?: Types.ObjectId;
  containerName: string;
  status: ContainerStatus;
  healthStatus: HealthStatus;
  healthMessage?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  memoryLimit?: number;
  uptime?: number;
  checkedAt: Date;
}

const HealthCheckSchema = new Schema<IHealthCheck>({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  deploymentId: { type: Schema.Types.ObjectId, ref: 'Deployment', index: true },
  containerName: { type: String, required: true },
  status: { type: String, default: 'unknown' },
  healthStatus: { type: String, default: 'unknown' },
  healthMessage: { type: String },
  cpuUsage: { type: Number },
  memoryUsage: { type: Number },
  memoryLimit: { type: Number },
  uptime: { type: Number },
  checkedAt: { type: Date, default: Date.now },
}, { timestamps: true });

HealthCheckSchema.index({ applicationId: 1, checkedAt: -1 });

export const HealthCheck = model<IHealthCheck>('HealthCheck', HealthCheckSchema);