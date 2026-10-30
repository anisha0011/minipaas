import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Application, Deployment } from '../types';
import { Rocket, ArrowLeft, GitBranch, Globe } from 'lucide-react';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [appRes, depRes] = await Promise.all([
        api.get(`/api/applications/${id}`),
        api.get(`/api/deployments?applicationId=${id}`),
      ]);
      setApp(appRes.data);
      setDeployments(depRes.data);
    } catch (err) {
      console.error('Failed to load application details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {deployments.map((d) => (
                <tr key={d._id} className="hover:bg-gray-800/50">
                  <td className="p-4 font-mono text-xs text-gray-300">{d._id}</td>
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
                </tr>
              ))}
              {deployments.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
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
