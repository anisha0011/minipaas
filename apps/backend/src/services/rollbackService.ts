import { Deployment, DeploymentStatus } from '../models/Deployment';
import { DeploymentLog } from '../models/DeploymentLog';
import * as docker from './dockerService';
import { cleanupOldImages } from './cleanupService';

export interface RollbackResult {
  success: boolean;
  newDeploymentId?: string;
  message: string;
  logs: string[];
}

export async function rollbackDeployment(applicationId: string, targetDeploymentId: string): Promise<RollbackResult> {
  const logs: string[] = [];
  const addLog = (msg: string) => {
    logs.push(msg);
    console.log('[Rollback]', msg);
  };

  let targetDeployment: any;
  try {
    targetDeployment = await Deployment.findById(targetDeploymentId);
    if (!targetDeployment) {
      return { success: false, message: 'Target deployment not found', logs };
    }
    if (targetDeployment.status !== DeploymentStatus.SUCCESS) {
      return { success: false, message: 'Target deployment is not successful', logs };
    }
    if (!targetDeployment.imageTag) {
      return { success: false, message: 'Target deployment has no image tag', logs };
    }

    addLog(`Starting rollback to deployment ${targetDeploymentId}`);

    // Check if image still exists
    const imageExists = await docker.imageExists(targetDeployment.imageTag);
    if (!imageExists) {
      return { success: false, message: 'Docker image for target deployment no longer exists', logs };
    }

    // Stop and remove current container if running
    const currentDeployment = await Deployment.findOne({
      applicationId,
      status: DeploymentStatus.SUCCESS,
    } as any).sort({ createdAt: -1 });

    if (currentDeployment?.containerName) {
      addLog(`Stopping current container: ${currentDeployment.containerName}`);
      try {
        await docker.stopContainer(currentDeployment.containerName);
      } catch (error: any) {
        addLog(`Warning: Failed to stop current container: ${error.message}`);
      }
    }

    // Create new rollback deployment record
    const rollbackDeploymentRecord = new Deployment({
      applicationId,
      status: DeploymentStatus.BUILDING,
      imageTag: targetDeployment.imageTag,
      containerName: `app-${applicationId}`,
      isRollback: true,
      rolledBackFrom: targetDeployment._id,
    });
    await rollbackDeploymentRecord.save();

    // Start the previous image
    addLog(`Starting container from image: ${targetDeployment.imageTag}`);
    const containerName = `app-${applicationId}`;
    await docker.runContainer({
      containerName,
      imageTag: targetDeployment.imageTag,
      port: targetDeployment.containerPort,
    });

    // Update rollback deployment
    rollbackDeploymentRecord.status = DeploymentStatus.SUCCESS;
    rollbackDeploymentRecord.containerName = containerName;
    rollbackDeploymentRecord.finishedAt = new Date();
    await rollbackDeploymentRecord.save();

    // Trigger cleanup
    await cleanupOldImages(applicationId);

    // Log success
    const logEntry = new DeploymentLog({
      deploymentId: rollbackDeploymentRecord._id,
      level: 'info',
      message: `Rollback to deployment ${targetDeploymentId} completed successfully`,
    });
    await logEntry.save();

    addLog('Rollback completed successfully');
    return { success: true, newDeploymentId: rollbackDeploymentRecord._id as unknown as string, message: 'Rollback successful', logs };
  } catch (error: any) {
    const errorMessage = `Rollback failed: ${error.message}`;
    addLog(errorMessage);

    // Record failure
    const failedDeployment = new Deployment({
      applicationId,
      status: DeploymentStatus.FAILED,
      errorMessage,
      isRollback: true,
      ...(targetDeployment && { rolledBackFrom: targetDeployment._id }),
    });
    await failedDeployment.save();

    const logEntry = new DeploymentLog({
      deploymentId: failedDeployment._id,
      level: 'error',
      message: errorMessage,
    });
    await logEntry.save();

    return { success: false, message: errorMessage, logs };
  }
}