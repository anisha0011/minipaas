import { Application } from '../models/Application';
import { Deployment } from '../models/Deployment';
import { HealthCheck } from '../models/HealthCheck';
import { DeploymentLog } from '../models/DeploymentLog';
import * as docker from './dockerService';

let monitoringInterval: NodeJS.Timeout | null = null;
let isRunning = false;

const POLL_INTERVAL_MS = 30000;

export async function runMonitoringCycle(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const activeApps = await Application.find({ status: 'active' } as any);
    for (const app of activeApps) {
      try {
        await monitorApplication(app._id as unknown as string);
      } catch (error: any) {
        console.error(`Monitoring failed for application:`, error.message);
      }
    }
  } finally {
    isRunning = false;
  }
}

async function monitorApplication(applicationId: string): Promise<void> {
  const latestDeployment = await Deployment.findOne({ applicationId })
    .sort({ createdAt: -1 })
    .limit(1);

  if (!latestDeployment || !latestDeployment.containerName) {
    return;
  }

  const containerName = latestDeployment.containerName;
  const info = await docker.getContainerInfo(containerName);
  const stats = await docker.getContainerStats(containerName);

  const healthRecord = new HealthCheck({
    applicationId,
    deploymentId: latestDeployment._id,
    containerName,
    status: info.status,
    healthStatus: info.health,
    healthMessage: info.healthMessage,
    cpuUsage: stats.cpuUsage,
    memoryUsage: stats.memoryUsage,
    memoryLimit: stats.memoryLimit,
    uptime: info.uptime,
    checkedAt: new Date(),
  });

  await healthRecord.save();

  // Detect unexpected container exits
  if (info.status === 'exited' && latestDeployment.status === 'success') {
    const log = new DeploymentLog({
      deploymentId: latestDeployment._id,
      level: 'error',
      message: `Container "${containerName}" exited unexpectedly. Previous status was success.`,
    });
    await log.save();
  }
}

export function startMonitoring(): void {
  if (monitoringInterval) return;
  monitoringInterval = setInterval(() => {
    runMonitoringCycle().catch(err => console.error('Monitoring cycle failed:', err));
  }, POLL_INTERVAL_MS);
}

export function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

export async function getLatestHealth(applicationId: string) {
  return HealthCheck.findOne({ applicationId } as any).sort({ checkedAt: -1 });
}

export async function getHealthHistory(applicationId: string, limit = 50) {
  return HealthCheck.find({ applicationId } as any).sort({ checkedAt: -1 }).limit(limit);
}