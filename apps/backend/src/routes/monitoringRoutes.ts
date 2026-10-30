import { Router } from 'express';
import { getLatestHealth, getHealthHistory } from '../services/monitoringService';

const router = Router();

router.get('/applications/:id/health', async (req, res) => {
  try {
    const health = await getLatestHealth(req.params.id);
    if (!health) return res.status(404).json({ error: 'No health data found' });
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch health data' });
  }
});

router.get('/applications/:id/health/history', async (req, res) => {
  try {
    const history = await getHealthHistory(req.params.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch health history' });
  }
});

export default router;