import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Application, Deployment, HealthCheck } from '../types';
import { Rocket, ArrowLeft, GitBranch, Globe, RotateCcw, Activity } from 'lucide-react';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [appRes, depRes, healthRes] = await Promise.all([
        api.get(`/api/applications/${id}`),
        api.get(`/api/deployments?applicationId=${id}`),
        api.get(`/api/monitoring/applications/${id}/health`).catch(() => ({ data: null })),
      ]);
      setApp(appRes.data);
      setDeployments(depRes.data);
      setHealth(healthRes.data);
    } catch (err) {
      console.error('Failed to load application details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleDeploy = async () => {
    if (!confirm('Trigger deployment via GitHub Actions?')) return;
    try {
      await api.post(`/api/applications/${id}/deployments`, { status: 'queued' });
      alert('Deployment triggered successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to trigger deployment');
    }
  };

  const handleRollback = async (deploymentId: string) => {
    if (!confirm('Are you sure you want to rollback to this deployment?')) return;
    setRollbackLoading(deploymentId);
    try {
      const res = await api.post(`/api/internal/applications/${id}/rollback/${deploymentId}`);
      if (res.data.success) {
        alert('Rollback successful!');
      } else {
        alert(`Rollback failed: ${res.data.message}`);
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to trigger rollback');
    } finally {
      setRollbackLoading(null);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatUptime = (seconds?: number) => {
    if (seconds === undefined) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  if (loading) return <div className="text-gray-400">Loading application...</div>;
  if (!app) return <div className="text-red-400">Application not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/applications" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-white">{app.name}</h1>
        </div>
        <button
          onClick={handleDeploy}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
        >
          <Rocket className="w-4 h-4" />
          <span>Trigger Deployment</span>
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Slug</p>
            <p className="text-sm font-medium text-white">{app.slug}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Branch</p>
            <p className="text-sm font-medium text-white flex items-center space-x-1">
              <GitBranch className="w-3.5 h-3.5 text-gray-400" />
              <span>{app.branch}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Repository</p>
            <p className="text-sm font-medium text-white flex items-center space-x-1 truncate">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <a href={app.repositoryUrl} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline truncate">
                {app.repositoryUrl || 'None'}
              </a>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {app.status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg space-y-4">
        <h2 className="text-lg font-medium text-white flex items-center space-x-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <span>Container Metrics & Health</span>
        </h2>

        {health ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-base font-bold mt-1 text-white capitalize">{health.status}</p>
            </div>
            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500">CPU Usage</p>
              <p className="text-base font-bold mt-1 text-white">
                {health.cpuUsage !== undefined ? `${health.cpuUsage.toFixed(2)}%` : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500">Memory</p>
              <p className="text-base font-bold mt-1 text-white">
                {formatBytes(health.memoryUsage)} / {formatBytes(health.memoryLimit)}
              </p>
            </div>
            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500">Uptime</p>
              <p className="text-base font-bold mt-1 text-white">{formatUptime(health.uptime)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No active health metrics available.</p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white">Deployment History</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Image Tag</th>
                <th className="p-4 font-medium">Created At</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {deployments.map((d) => (
                <tr key={d._id} className="hover:bg-gray-800/50">
                  <td className="p-4 font-mono text-xs text-gray-300">
                    {d._id}
                    {d.isRollback && (
                      <span className="ml-2 text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">
                        Rollback
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      d.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      d.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-400">{d.imageTag || 'N/A'}</td>
                  <td className="p-4 text-gray-400">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    {d.status === 'success' && d.imageTag && (
                      <button
                        onClick={() => handleRollback(d._id)}
                        disabled={rollbackLoading === d._id}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 ml-auto transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{rollbackLoading === d._id ? 'Rolling back...' : 'Rollback'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {deployments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No deployments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
