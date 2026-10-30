export type ApplicationStatus = 'active' | 'inactive';

export interface Application {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  repositoryUrl?: string;
  branch: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export type DeploymentStatus = 'queued' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled';

export interface Deployment {
  _id: string;
  applicationId: string;
  status: DeploymentStatus;
  commitSha?: string;
  imageTag?: string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentLog {
  _id: string;
  deploymentId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface Stats {
  totalApplications: number;
  activeApplications: number;
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
}
