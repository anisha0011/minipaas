import { Router, Request, Response } from 'express';
import * as ApplicationController from '../controllers/ApplicationController';
import { Deployment, DeploymentStatus } from '../models/Deployment';
import { DeploymentLog } from '../models/DeploymentLog';

const router = Router();

router.get('/', ApplicationController.listDeployments);
router.get('/:id', ApplicationController.getDeployment);
router.get('/:id/logs', ApplicationController.getDeploymentLogs);

// Stop / Cancel stuck deployment
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment) return res.status(404).json({ error: 'Deployment not found' });

    deployment.status = DeploymentStatus.CANCELLED;
    await deployment.save();

    await DeploymentLog.create({
      deploymentId: deployment._id,
      level: 'error',
      message: 'Deployment was manually cancelled or stopped by the user.',
    });

    res.json({ success: true, message: 'Deployment stopped successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to stop deployment' });
  }
});

export default router;
