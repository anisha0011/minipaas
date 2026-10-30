import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import applicationRoutes from './routes/applicationRoutes';
import deploymentRoutes from './routes/deploymentRoutes';
import internalRoutes from './routes/internalRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection
connectDatabase();

// Routes
app.use('/api/applications', applicationRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/internal', internalRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'minipaas-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', (_req: Request, res: Response) => {
  if (process.env.MONGODB_URI && mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: 'error', message: 'Database disconnected' });
  }
  res.json({ status: 'ok' });
});

// Basic Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
