import { Router } from 'express';
import * as ApplicationController from '../controllers/ApplicationController';

const router = Router();

router.get('/stats', ApplicationController.getStats);
router.get('/', ApplicationController.listApplications);
router.post('/', ApplicationController.createApplication);
router.get('/:id', ApplicationController.getApplication);
router.patch('/:id', ApplicationController.updateApplication);
router.delete('/:id', ApplicationController.deleteApplication);

router.post('/:id/deployments', ApplicationController.createDeployment);

export default router;
