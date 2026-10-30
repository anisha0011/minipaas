import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import type { Deployment, DeploymentLog } from '../../types';
import { ArrowLeft, Terminal, AlertTriangle, Info, ShieldAlert, CheckCircle2, Square } from 'lucide-react';

export const DeploymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  const fetchDetails = async () => {
    try {
      const [depRes, logsRes] = await Promise.all([
        api.get(`/api/deployments/${id}`),
        api.get(`/api/deployments/${id}/logs`),
      ]);
      setDeployment(depRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load deployment details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleStop = async () => {
    if (!confirm('Are you sure you want to stop this stuck deployment?')) return;
    setStopping(true);
    try {
      await api.post(`/api/deployments/${id}/cancel`);
      fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to stop deployment');
    } finally {
      setStopping(false);
    }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading logs...</div>;
  if (!deployment) return <div className="text-red-400 p-8">Deployment not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/deployments" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">Deployment Console</h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{id}</p>
          </div>
        </div>
        {(deployment.status === 'building' || deployment.status === 'queued') && (
          <button
            onClick={handleStop}
            disabled={stopping}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-50"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>{stopping ? 'Stopping...' : 'Stop Deployment'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <p className="text-xs text-gray-500">Status</p>
          <span className={`inline-flex items-center space-x-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            deployment.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            deployment.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="capitalize">{deployment.status}</span>
          </span>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <p className="text-xs text-gray-500">Created At</p>
          <p className="text-sm font-medium text-white mt-1">{new Date(deployment.createdAt).toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <p className="text-xs text-gray-500">Image Tag</p>
          <p className="text-sm font-mono text-purple-400 mt-1">{deployment.imageTag || 'None'}</p>
        </div>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono text-gray-300">Deployment Logs</span>
        </div>
        <div className="p-4 space-y-2 font-mono text-xs max-h-[500px] overflow-y-auto">
          {logs.map((l) => (
            <div key={l._id} className="flex items-start space-x-3 text-gray-300">
              <span className="text-gray-600 select-none">{new Date(l.timestamp).toLocaleTimeString()}</span>
              {l.level === 'info' && <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
              {l.level === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
              {l.level === 'error' && <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
              <span className={l.level === 'error' ? 'text-red-400' : 'text-gray-300'}>{l.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-gray-600 italic">No output logs received for this deployment task.</p>
          )}
        </div>
      </div>
    </div>
  );
};
