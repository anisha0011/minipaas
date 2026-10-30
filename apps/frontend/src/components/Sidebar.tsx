import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Server, Rocket, FileText, Settings, Menu, X, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Applications', path: '/applications', icon: Server },
    { name: 'Deployments', path: '/deployments', icon: Rocket },
    { name: 'Logs', path: '/logs', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-gray-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">MiniPaaS</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Menu</span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-purple-600/10 text-purple-400 ring-1 ring-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Icon className={cn("w-4.5 h-4.5", isActive ? "text-purple-400" : "text-gray-500 group-hover:text-gray-300")} />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-opacity", isActive ? "opacity-100" : "opacity-0")} />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-gray-950/50 rounded-xl p-3 border border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-500 uppercase">System</p>
                <p className="text-xs font-semibold text-gray-300">v1.0.0 Stable</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
