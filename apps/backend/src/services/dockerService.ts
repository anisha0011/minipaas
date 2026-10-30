import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ContainerInfo {
  containerName: string;
  status: 'running' | 'stopped' | 'restarting' | 'exited' | 'unknown';
  health: 'healthy' | 'unhealthy' | 'unknown';
  healthMessage?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  memoryLimit?: number;
  uptime?: number;
  imageTag?: string;
}

export async function getContainerInfo(containerName: string): Promise<ContainerInfo> {
  try {
    // Simplified format to avoid health check template errors if not defined
    const { stdout } = await execAsync(
      `docker inspect --format '{{.State.Status}}|{{.State.StartedAt}}|{{.Config.Image}}' "${containerName}"`
    );

    const [status, startedAt, image] = stdout.trim().split('|');

    let containerStatus: ContainerInfo['status'] = 'unknown';
    if (status === 'running') containerStatus = 'running';
    else if (status === 'exited') containerStatus = 'exited';
    else if (status === 'restarting') containerStatus = 'restarting';

    const info: ContainerInfo = {
      containerName,
      status: containerStatus,
      health: 'unknown', // Simplified: assume unknown if no dedicated healthcheck
      imageTag: image,
    };

    if (startedAt) {
      const start = new Date(startedAt);
      if (!isNaN(start.getTime())) {
        info.uptime = Math.floor((Date.now() - start.getTime()) / 1000);
      }
    }

    return info;
  } catch (error: any) {
    return {
      containerName,
      status: 'unknown',
      health: 'unknown',
      healthMessage: error.message,
    };
  }
}

export async function getContainerStats(containerName: string): Promise<Partial<ContainerInfo>> {
  try {
    const { stdout } = await execAsync(
      `docker stats --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}|{{.MemLimit}}" "${containerName}"`
    );

    const [cpu, memUsage, memLimit] = stdout.trim().split('|');

    const stats: Partial<ContainerInfo> = {};
    if (cpu && cpu !== 'N/A') {
      stats.cpuUsage = parseFloat(cpu.replace('%', ''));
    }
    if (memUsage) {
      stats.memoryUsage = parseMemory(memUsage);
    }
    if (memLimit && memLimit !== 'N/A') {
      stats.memoryLimit = parseMemory(memLimit);
    }

    return stats;
  } catch (error: any) {
    return {};
  }
}

function parseMemory(value: string): number {
  if (!value) return 0;
  // stats output often looks like "10MiB / 100MiB"
  const parts = value.split(' / ');
  const mem = parts[0];
  const match = mem.match(/^([\d.]+)\s*([KMGT]?)i?B?$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 };
  return num * (multipliers[unit] || 1);
}

export async function stopContainer(containerName: string): Promise<void> {
  await execAsync(`docker stop "${containerName}"`);
}

export async function runContainer(config: {
  containerName: string;
  imageTag: string;
  port?: number;
  env?: Record<string, string>;
}): Promise<void> {
  const portArg = config.port ? `-p ${config.port}:80` : '';
  const envArgs = config.env
    ? Object.entries(config.env).map(([k, v]) => `-e ${k}="${v}"`).join(' ')
    : '';
  await execAsync(
    `docker run -d --name "${config.containerName}" ${portArg} ${envArgs} "${config.imageTag}"`
  );
}

export async function imageExists(imageTag: string): Promise<boolean> {
  try {
    await execAsync(`docker inspect --type=image "${imageTag}"`);
    return true;
  } catch {
    return false;
  }
}

export async function removeImage(imageTag: string): Promise<void> {
  try {
    await execAsync(`docker rmi "${imageTag}"`);
  } catch (error) {
    // Image may be in use
  }
}