import { Schema, model, Document, Types } from 'mongoose';

export interface IDeploymentLog extends Document {
  deploymentId: Types.ObjectId;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

const DeploymentLogSchema = new Schema<IDeploymentLog>({
  deploymentId: { type: Schema.Types.ObjectId, ref: 'Deployment', required: true, index: true },
  level: { type: String, enum: ['info', 'warn', 'error'], required: true },
  message: { type: String, required: true },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

export const DeploymentLog = model<IDeploymentLog>('DeploymentLog', DeploymentLogSchema);
