import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Stats } from '../types';
import { LayoutDashboard, Server, Rocket, CheckCircle2, XCircle, Loader2, Activity } from 'lucide-react';

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/applications/stats');
      setStats(res.data);
    } catch (err) {
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl flex flex-col items-center gap-4 text-center">
      <p className="font-medium text-lg">{error}</p>
      <button onClick={fetchData} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors">Retry Connection</button>
    </div>
  );

  if (!stats) return <div className="text-gray-400">No data available.</div>;

  const statCards = [
    { title: 'Applications', value: stats.totalApplications, icon: Server, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { title: 'Active Services', value: stats.activeApplications, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { title: 'Deployments', value: stats.totalDeployments, icon: Rocket, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    { title: 'Successful', value: stats.successfulDeployments, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { title: 'Failed Tasks', value: stats.failedDeployments, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
          <LayoutDashboard className="w-8 h-8 text-purple-500" />
          <span>Platform Overview</span>
        </h1>
        <p className="text-gray-400">Real-time status and deployment metrics for your self-hosted infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {statCards.map(s => (
          <div key={s.title} className={`bg-gray-900/50 backdrop-blur-sm border ${s.border} p-6 rounded-2xl flex flex-col justify-between shadow-xl`}>
            <div className="flex justify-between items-start">
              <div className={`${s.bg} p-2 rounded-lg`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-400">{s.title}</p>
              <p className="text-3xl font-bold mt-1 text-white tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Infrastructure Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
              <span className="text-gray-300">Docker Engine</span>
              <span className="flex items-center space-x-2 text-emerald-400 text-sm font-medium">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>Connected</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
              <span className="text-gray-300">GitHub Actions Runner</span>
              <span className="flex items-center space-x-2 text-emerald-400 text-sm font-medium">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
              <span className="text-gray-300">Database (Atlas)</span>
              <span className="flex items-center space-x-2 text-emerald-400 text-sm font-medium">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>Healthy</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-purple-600/5 border border-purple-500/20 p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 bg-purple-500/10 w-48 h-48 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
          <h2 className="text-xl font-semibold text-white mb-2 relative z-10">Welcome to MiniPaaS</h2>
          <p className="text-gray-400 relative z-10 max-w-sm">
            Your high-performance application hosting is up and running. Register a repository to start deploying.
          </p>
          <div className="mt-8 relative z-10">
            <Link to="/applications" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-900/20">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
