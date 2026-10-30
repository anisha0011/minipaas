import { Router } from 'express';
import { Application } from '../models/Application';
import { Deployment } from '../models/Deployment';
import { DeploymentLog } from '../models/DeploymentLog';

const router = Router();

// Internal/Worker endpoints
router.patch('/deployments/:id/status', async (req, res) => {
  try {
    const dep = await Deployment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
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

// Cleanup tool for tests
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
