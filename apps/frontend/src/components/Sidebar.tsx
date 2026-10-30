import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Server, Rocket, FileText, Settings } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Applications', path: '/applications', icon: Server },
    { name: 'Deployments', path: '/deployments', icon: Rocket },
    { name: 'Logs', path: '/logs', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 text-gray-300">
      <div className="p-6 border-b border-gray-800 flex items-center space-x-2">
        <Rocket className="w-6 h-6 text-purple-400" />
        <span className="font-bold text-lg text-white">MiniPaaS</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                    : 'hover:bg-gray-800 text-gray-400 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        MiniPaaS v1.0.0
      </div>
    </aside>
  );
};
