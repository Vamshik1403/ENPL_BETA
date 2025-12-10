'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Hide sidebar on login page + tasks/view/*
  const shouldHideSidebar =
    pathname === '/login' ||
    pathname.startsWith('/tasks/view/');

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* SIDEBAR (hidden on login & certain paths) */}
      {!shouldHideSidebar && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      {/* MAIN CONTENT */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          shouldHideSidebar
            ? 'w-full ml-0'
            : isCollapsed
            ? 'ml-16 flex-1'
            : 'ml-64 flex-1'
        }`}
      >
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
