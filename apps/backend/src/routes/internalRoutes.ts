import { Router } from 'express';
import { Application } from '../models/Application';
import { Deployment } from '../models/Deployment';
import { DeploymentLog } from '../models/DeploymentLog';
import { HealthCheck } from '../models/HealthCheck';
import { verifyWorkerToken } from '../middleware/auth';
import { rollbackDeployment } from '../services/rollbackService';

const router = Router();

// Protect all internal/worker routes
router.use(verifyWorkerToken);

router.patch('/deployments/:id/status', async (req, res) => {
  try {
    const updateData: any = { status: req.body.status };
    if (req.body.status === 'success' || req.body.status === 'failed' || req.body.status === 'cancelled') {
      updateData.finishedAt = new Date();
    }
    if (req.body.status === 'building') {
      updateData.startedAt = new Date();
    }
    if (req.body.errorMessage) {
      updateData.errorMessage = req.body.errorMessage;
    }
    if (req.body.imageTag) {
      updateData.imageTag = req.body.imageTag;
    }
    if (req.body.commitSha) {
      updateData.commitSha = req.body.commitSha;
    }
    if (req.body.containerName) {
      updateData.containerName = req.body.containerName;
    }
    if (req.body.containerPort) {
      updateData.containerPort = req.body.containerPort;
    }

    const dep = await Deployment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(dep);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update status' });
  }
});

router.post('/deployments/:id/logs', async (req, res) => {
  try {
    const log = new DeploymentLog({ ...req.body, deploymentId: req.params.id });
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add log' });
  }
});

// Rollback endpoint
router.post('/applications/:appId/rollback/:deploymentId', async (req, res) => {
  try {
    const result = await rollbackDeployment(req.params.appId, req.params.deploymentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Rollback failed' });
  }
});

router.delete('/test/cleanup/:appId', async (req, res) => {
  try {
    const appId = req.params.appId;
    const dep = await Deployment.findOneAndDelete({ applicationId: appId });
    if (dep) {
      await DeploymentLog.deleteMany({ deploymentId: dep._id });
    }
    await Application.findByIdAndDelete(appId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

export default router;