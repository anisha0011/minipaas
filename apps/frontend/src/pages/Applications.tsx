import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Application } from '../types';
import { Plus, Server, Trash2, ExternalLink, Search, Filter, Loader2, GitBranch, X } from 'lucide-react';

export const Applications: React.FC = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [branch, setBranch] = useState('main');

  const fetchApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/applications');
      setApps(res.data);
    } catch (err) {
      setError('Failed to load applications. Please try again.');
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
    if (!confirm(`Are you sure you want to delete ${name}? This will also remove its deployment history and logs.`)) return;
    try {
      await api.delete(`/api/applications/${id}`);
      fetchApps();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete application');
    }
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Applications</h1>
          <p className="text-gray-400 mt-1">Manage and deploy your web services</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-purple-900/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Register Application</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>
        <div className="flex items-center space-x-2 text-gray-400 text-sm">
          <Filter className="w-4 h-4" />
          <span>{filteredApps.length} services found</span>
        </div>
      </div>

      {loading && apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-gray-400">Fetching your services...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl flex flex-col items-center gap-4 text-center">
          <p className="font-medium">{error}</p>
          <button onClick={fetchApps} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <div key={app._id} className="group bg-gray-900/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-purple-500/30 transition-all hover:shadow-2xl hover:shadow-purple-500/5 backdrop-blur-sm">
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                    <Server className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-lg font-bold border ${
                    app.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <h3 className="font-bold text-xl text-white mt-4 group-hover:text-purple-400 transition-colors">{app.name}</h3>
                <p className="text-sm text-gray-400 mt-2 line-clamp-2 min-h-[40px] leading-relaxed">
                  {app.description || 'No description provided for this service.'}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <div className="flex items-center space-x-1.5 bg-gray-950 px-2.5 py-1 rounded-lg border border-white/5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Slug</span>
                    <code className="text-xs text-gray-300 font-mono">{app.slug}</code>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-gray-950 px-2.5 py-1 rounded-lg border border-white/5">
                    <GitBranch className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-gray-300">{app.branch}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center">
                <Link
                  to={`/applications/${app._id}`}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all active:scale-95"
                >
                  <span>Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleDelete(app._id, app.name)}
                  className="text-gray-500 hover:text-red-400 p-2 transition-colors rounded-lg hover:bg-red-400/10"
                  title="Delete Application"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {filteredApps.length === 0 && (
            <div className="col-span-full bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl py-20 flex flex-col items-center justify-center text-center">
              <Server className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-gray-500 text-lg">No services found.</p>
              <button onClick={() => setShowModal(true)} className="mt-4 text-purple-400 font-semibold hover:underline">Register your first application</button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-200">
          <div className="bg-gray-900 border border-white/10 w-full max-w-lg p-8 rounded-3xl shadow-2xl shadow-black/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Register Service</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white p-1 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Service Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-700"
                  placeholder="Production API"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Unique Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-700"
                  placeholder="prod-api"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Deployment Branch</label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-700"
                  placeholder="main"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Repository URL</label>
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-700"
                  placeholder="https://github.com/org/repo"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-700 resize-none"
                  placeholder="Briefly describe this service..."
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-gray-400 hover:text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
