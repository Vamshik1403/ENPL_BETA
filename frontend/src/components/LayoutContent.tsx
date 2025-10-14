// components/LayoutContent.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Check if current route should hide sidebar - ONLY for /tasks/view/ pages
  const shouldHideSidebar = pathname.startsWith('/tasks/view/');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!shouldHideSidebar && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}
      <main 
        className={`min-h-screen transition-all duration-300 ${
          shouldHideSidebar 
            ? 'w-full' 
            : isCollapsed 
              ? 'ml-16 flex-1' 
              : 'ml-64 flex-1'
        }`}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}