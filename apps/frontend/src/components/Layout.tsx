import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#030712] selection:bg-purple-500/30">
      <Sidebar />
      <main className="flex-1 lg:ml-64 transition-all duration-300 min-w-0 overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10 min-h-screen flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};
