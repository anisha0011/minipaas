import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Deployment } from '../../types';
import { Clock, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export const Deployments: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeployments = async () => {
    try {
      const res = await api.get('/api/deployments');
      setDeployments(res.data);
    } catch (err) {
      setError('Failed to load deployments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Deployments</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-950 text-gray-400 border-b border-gray-800 font-medium">
            <tr>
              <th className="p-4">Deployment ID</th>
              <th className="p-4">Status</th>
              <th className="p-4">Artifact</th>
              <th className="p-4">Timestamp</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {deployments.map((d) => (
              <tr key={d._id} className="hover:bg-gray-800/50 transition-colors">
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-gray-300">{d._id}</span>
                    {d.isRollback && (
                      <span className="mt-1 w-fit text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">
                        Rollback
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    d.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    d.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    d.status === 'building' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {d.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                    {d.status === 'failed' && <XCircle className="w-3 h-3" />}
                    {d.status === 'building' && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span className="capitalize">{d.status}</span>
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col space-y-1">
                    {d.imageTag ? (
                      <span className="font-mono text-[11px] text-gray-400 bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
                        {d.imageTag}
                      </span>
                    ) : (
                      <span className="text-gray-600">No artifact</span>
                    )}
                    {d.commitSha && <span className="text-[10px] text-gray-500 italic">sha: {d.commitSha.substring(0,7)}</span>}
                  </div>
                </td>
                <td className="p-4 text-gray-400">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{new Date(d.createdAt).toLocaleString()}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <Link
                    to={`/deployments/${d._id}`}
                    className="inline-flex items-center space-x-1 text-purple-400 hover:text-purple-300 font-medium group"
                  >
                    <span>View Logs</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {deployments.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500 italic">
                  No deployment history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
