import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Stats } from '../types';

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/api/applications/stats').then((res: any) => setStats(res.data));
  }, []);

  if (!stats) return <div className="text-gray-400">Loading dashboard...</div>;

  const statCards = [
    { title: 'Total Applications', value: stats.totalApplications },
    { title: 'Active', value: stats.activeApplications },
    { title: 'Total Deployments', value: stats.totalDeployments },
    { title: 'Successful', value: stats.successfulDeployments },
    { title: 'Failed', value: stats.failedDeployments },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map(s => (
          <div key={s.title} className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400">{s.title}</p>
            <p className="text-2xl font-bold mt-1 text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
