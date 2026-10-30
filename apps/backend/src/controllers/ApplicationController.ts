import { Request, Response } from 'express';
import { Application } from '../models/Application';
import { Deployment } from '../models/Deployment';
import { DeploymentLog } from '../models/DeploymentLog';
import { HealthCheck } from '../models/HealthCheck';
import { triggerDeploymentWorkflow } from '../services/githubService';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Application Controllers
export const listApplications = async (req: Request, res: Response) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

export const getApplication = async (req: Request, res: Response) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json(app);
  } catch (error) {
    res.status(400).json({ error: 'Invalid ID' });
  }
};

export const createApplication = async (req: Request, res: Response) => {
  try {
    const app = new Application(req.body);
    await app.save();
    res.status(201).json(app);
  } catch (error: any) {
    if (error.code === 11000) res.status(400).json({ error: 'Slug must be unique' });
    else res.status(400).json({ error: 'Failed to create application' });
  }
};

export const updateApplication = async (req: Request, res: Response) => {
  try {
    const app = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json(app);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
};

export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const appId = req.params.id;

    // Stop and remove running container if any
    const containerName = `app-${appId}`;
    try {
      await execAsync(`docker rm -f "${containerName}"`);
    } catch {
      // container might not exist or be running, ignore
    }

    // Find all deployments for this application to clean up their logs first
    const deployments = await Deployment.find({ applicationId: appId });
    const deploymentIds = deployments.map(d => d._id);

    // Delete associated logs, deployments, and health checks
    if (deploymentIds.length > 0) {
      await DeploymentLog.deleteMany({ deploymentId: { $in: deploymentIds } });
      await Deployment.deleteMany({ applicationId: appId });
    }
    await HealthCheck.deleteMany({ applicationId: appId });

    // Delete the application itself
    const app = await Application.findByIdAndDelete(appId);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    res.status(200).json({ success: true, message: 'Application and its history deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(400).json({ error: 'Deletion failed' });
  }
};

// Deployment Controllers
export const listDeployments = async (req: Request, res: Response) => {
  try {
    const { applicationId, status, page = 1, limit = 10 } = req.query;
    const filter: any = {};
    if (applicationId) filter.applicationId = applicationId;
    if (status) filter.status = status;
    const deployments = await Deployment.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
};

export const getDeployment = async (req: Request, res: Response) => {
  try {
    const dep = await Deployment.findById(req.params.id);
    if (!dep) return res.status(404).json({ error: 'Deployment not found' });
    res.json(dep);
  } catch (error) {
    res.status(400).json({ error: 'Invalid ID' });
  }
};

export const createDeployment = async (req: Request, res: Response) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const deployment = new Deployment({ ...req.body, applicationId: req.params.id });
    await deployment.save();

    // Trigger GitHub Workflow
    try {
      await triggerDeploymentWorkflow({
        deploymentId: deployment._id as unknown as string,
        applicationId: req.params.id as string,
        repositoryUrl: app.repositoryUrl || '',
        branch: app.branch,
      });
    } catch (githubError: any) {
      const detail = githubError.response?.data ? JSON.stringify(githubError.response.data) : githubError.message;
      console.error(`Failed to trigger GitHub workflow: ${detail}`);
    }

    res.status(201).json(deployment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create deployment' });
  }
};

export const getDeploymentLogs = async (req: Request, res: Response) => {
  try {
    const logs = await DeploymentLog.find({ deploymentId: req.params.id }).sort({ timestamp: 1 });
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch logs' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalApplications = await Application.countDocuments();
    const activeApplications = await Application.countDocuments({ status: 'active' } as any);
    const totalDeployments = await Deployment.countDocuments();
    const successfulDeployments = await Deployment.countDocuments({ status: 'success' } as any);
    const failedDeployments = await Deployment.countDocuments({ status: 'failed' } as any);

    res.json({
      totalApplications,
      activeApplications,
      totalDeployments,
      successfulDeployments,
      failedDeployments
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
