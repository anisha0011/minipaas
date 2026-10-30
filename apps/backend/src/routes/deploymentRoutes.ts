import { Router } from 'express';
import * as ApplicationController from '../controllers/ApplicationController';

const router = Router();

router.get('/', ApplicationController.listDeployments);
router.get('/:id', ApplicationController.getDeployment);
router.get('/:id/logs', ApplicationController.getDeploymentLogs);

export default router;
