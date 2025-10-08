'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

<<<<<<< Updated upstream
const mainNavigationItems = [
  { name: 'Address Book', href: '/addressbook', icon: '👥' },
  { name: 'Sites', href: '/sites', icon: '🏢' },
  { name: 'Service Workscope Category', href: '/workscope', icon: '📊' },
  { name: 'Service Contract Category', href: '/service-contract', icon: '📄' },
=======
const navigationItems = [
  
  { name: 'Customers', href: '/addressbook', icon: '👥' },
  { name: 'Sites', href: '/sites', icon: '🏢' },
  { name: 'Products Type', href: '/products', icon: '📦' },
  { name: 'Service Work Category', href: '/service-work', icon: '🔧' },
  { name: 'Contract Work Category', href: '/contract-work', icon: '📋' },
  { name: 'Service Workscope Category', href: '/workscope', icon: '📊' },
  { name: 'Service Contract', href: '/service-contract', icon: '📄' },
  { name: 'Departments', href: '/departments', icon: '🏛️' },
>>>>>>> Stashed changes
  { name: 'Tasks', href: '/tasks', icon: '✅' },
];

const setupItems = [
  { name: 'Products Type', href: '/products', icon: '📦' },
  { name: 'Service Work Category', href: '/service-work', icon: '🔧' },
  { name: 'Contract Work Category', href: '/contract-work', icon: '📋' },
  { name: 'Departments', href: '/departments', icon: '🏛️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSetupExpanded, setIsSetupExpanded] = useState(true);

  const renderNavigationItem = (item: any) => {
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
  };

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
          {/* Main Navigation Items */}
          {mainNavigationItems.map(renderNavigationItem)}
          
          {/* Setup Section */}
          <div className="mt-6">
            <button
              onClick={() => setIsSetupExpanded(!isSetupExpanded)}
              className={`flex items-center w-full p-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white ${
                !isCollapsed ? 'justify-between' : 'justify-center'
              }`}
            >
              <div className="flex items-center">
                <span className="text-xl mr-3">⚙️</span>
                <span className={`transition-opacity ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                  Setup
                </span>
              </div>
              {!isCollapsed && (
                <span className={`transition-transform ${isSetupExpanded ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              )}
            </button>
            
            {/* Setup Items */}
            {isSetupExpanded && !isCollapsed && (
              <div className="ml-6 mt-2 space-y-1">
                {setupItems.map(renderNavigationItem)}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
