import { Deployment, DeploymentStatus } from '../models/Deployment';
import * as docker from './dockerService';

const KEEP_RECENT_IMAGES_COUNT = 5;

export async function cleanupOldImages(applicationId: string): Promise<void> {
  try {
    // Get all successful deployments for this application, sorted by date
    const successfulDeployments = await Deployment.find({
      applicationId,
      status: DeploymentStatus.SUCCESS,
      imageTag: { $exists: true, $ne: null }
    } as any).sort({ createdAt: -1 });

    if (successfulDeployments.length <= KEEP_RECENT_IMAGES_COUNT) {
      return;
    }

    // Identify images to keep (current active + most recent ones)
    const deploymentsToKeep = successfulDeployments.slice(0, KEEP_RECENT_IMAGES_COUNT);
    const imageTagsToKeep = new Set(deploymentsToKeep.map(d => d.imageTag).filter(Boolean));

    // Identify images to potentially delete
    const deploymentsToDelete = successfulDeployments.slice(KEEP_RECENT_IMAGES_COUNT);

    for (const dep of deploymentsToDelete) {
      if (dep.imageTag && !imageTagsToKeep.has(dep.imageTag)) {
        console.log(`Cleaning up old image for app ${applicationId}: ${dep.imageTag}`);
        await docker.removeImage(dep.imageTag);
      }
    }
  } catch (error: any) {
    console.error(`Image cleanup failed for application ${applicationId}:`, error.message);
  }
}

export function startCleanupTask(): void {
  // Run cleanup once a day or on a trigger. For now, let's trigger it after a successful deployment.
}