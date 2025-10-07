'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navigationItems = [
  { name: 'Address Book', href: '/addressbook', icon: '👥' },
  { name: 'Sites', href: '/sites', icon: '🏢' },
  { name: 'Products', href: '/products', icon: '📦' },
  { name: 'Service Work', href: '/service-work', icon: '🔧' },
  { name: 'Contract Work', href: '/contract-work', icon: '📋' },
  { name: 'Workscope', href: '/workscope', icon: '📊' },
  { name: 'Service Contract', href: '/service-contract', icon: '📄' },
  { name: 'Departments', href: '/departments', icon: '🏛️' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className={`font-bold text-xl transition-opacity ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            ENPL ERP
          </h1>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className={`transition-opacity ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
