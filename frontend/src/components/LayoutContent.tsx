'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from './Sidebar';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={`flex-1 bg-gray-50 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
}
