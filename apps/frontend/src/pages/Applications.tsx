import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Application } from '../types';
import { Plus, Server, Trash2, ExternalLink } from 'lucide-react';

export const Applications: React.FC = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [branch, setBranch] = useState('main');

  const fetchApps = async () => {
    try {
      const res = await api.get('/api/applications');
      setApps(res.data);
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/applications', {
        name,
        slug,
        description,
        repositoryUrl: repositoryUrl || undefined,
        branch,
      });
      setShowModal(false);
      setName('');
      setSlug('');
      setDescription('');
      setRepositoryUrl('');
      setBranch('main');
      fetchApps();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create application');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/api/applications/${id}`);
      fetchApps();
    } catch (err: any) {
      if (err.response?.status === 409) {
        alert('Cannot delete application with existing deployments. Delete deployments or history first.');
      } else {
        alert('Failed to delete application');
      }
    }
  };

  if (loading) return <div className="text-gray-400">Loading applications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Applications</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Application</span>
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <div key={app._id} className="bg-gray-900 border border-gray-800 p-6 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <Server className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-lg text-white">{app.name}</h3>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${app.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-400'}`}>
                  {app.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-2">{app.description || 'No description provided.'}</p>
              <div className="mt-4 space-y-1 text-xs text-gray-500">
                <p>Slug: <code className="text-gray-300">{app.slug}</code></p>
                <p>Branch: <code className="text-gray-300">{app.branch}</code></p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center">
              <Link
                to={`/applications/${app._id}`}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
              >
                <span>Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => handleDelete(app._id, app.name)}
                className="text-red-400 hover:text-red-300 p-1 transition-colors"
                title="Delete Application"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {apps.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No applications registered yet.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md p-6 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold text-white">Register Application</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="My App"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="my-app"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Repository URL</label>
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="https://github.com/org/repo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Branch</label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="main"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
