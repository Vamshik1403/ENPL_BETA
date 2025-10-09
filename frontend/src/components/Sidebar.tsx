'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  nested?: NavigationItem[];
}

interface ExpandedSections {
  addressbook: boolean;
  setup: boolean;
  [key: string]: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const mainNavigationItems: NavigationItem[] = [
  { 
    name: 'Address Book', 
    href: '/addressbook', 
    icon: '👥',
    nested: [
      { name: 'Customers', href: '/addressbook/customers', icon: '👤' },
      { name: 'Sites', href: '/addressbook/sites', icon: '🏢' }
    ]
  },
  { name: 'Sites', href: '/sites', icon: '📍' },
  { name: 'Service Workscope Category', href: '/workscope', icon: '📊' },
  { name: 'Service Contract Category', href: '/service-contract', icon: '📄' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
];

const setupItems: NavigationItem[] = [
  { name: 'Products Type', href: '/products', icon: '📦' },
  { name: 'Service Work Category', href: '/service-work', icon: '🔧' },
  { name: 'Contract Work Category', href: '/contract-work', icon: '📋' },
  { name: 'Departments', href: '/departments', icon: '🏛️' },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    addressbook: true,
    setup: true
  }); 

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionKey = (itemName: string): keyof ExpandedSections => {
    const key = itemName.toLowerCase().replace(' ', '');
    return key as keyof ExpandedSections;
  };

  const isActive = (href: string) => pathname === href;
  const isActiveParent = (nestedItems: NavigationItem[] | undefined) => 
    nestedItems?.some(item => pathname === item.href);

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasNested = item.nested && item.nested.length > 0;
    const isActiveItem = isActive(item.href);
    const isParentActive = hasNested && isActiveParent(item.nested);
    const sectionKey = getSectionKey(item.name);
    
    return (
      <div key={item.href} className={`${level > 0 ? 'ml-2' : ''}`}>
        {hasNested ? (
          <>
            <button
              onClick={() => toggleSection(sectionKey)}
              className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 group ${
                isParentActive || isActiveItem
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } ${level > 0 ? 'text-sm' : ''}`}
            >
              <span className="text-xl mr-3 flex-shrink-0">{item.icon}</span>
              <span className={`transition-all duration-200 ${
                isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
              } truncate flex-1 text-left`}>
                {item.name}
              </span>
              {!isCollapsed && (
                <span className={`transition-transform duration-200 ml-2 ${
                  expandedSections[sectionKey] ? 'rotate-90' : ''
                }`}>
                  ▶
                </span>
              )}
            </button>
            
            {/* Nested Items */}
            {!isCollapsed && expandedSections[sectionKey] && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-600 pl-2">
                {item.nested?.map((nestedItem: NavigationItem) => renderNavigationItem(nestedItem, level + 1))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.href}
            className={`flex items-center p-3 rounded-lg transition-all duration-200 group relative ${
              isActiveItem
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md'
            } ${level > 0 ? 'text-sm' : ''}`}
          >
            <span className="text-xl mr-3 flex-shrink-0">{item.icon}</span>
            <span className={`transition-all duration-200 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            } truncate`}>
              {item.name}
            </span>
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                {item.name}
              </div>
            )}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className={`
      bg-gradient-to-b from-gray-900 to-gray-800 text-white 
      transition-all duration-300 ease-in-out 
      ${isCollapsed ? 'w-16' : 'w-64'} 
      h-screen
      shadow-2xl border-r border-gray-700
      fixed left-0 top-0 z-50
      overflow-y-auto
    `}>
      {/* Toggle Button */}
      <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-900">
        <div className="flex items-center justify-between">
          <h1 className={`
            font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent
            transition-all duration-300
            ${isCollapsed ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
          `}>
            ENPL ERP
          </h1>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 hover:rotate-12"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="text-lg">
              {isCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="p-4 space-y-1">
        {/* Main Navigation Items */}
        {mainNavigationItems.map(item => renderNavigationItem(item))}
        
        {/* Setup Section */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={() => toggleSection('setup')}
            className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 group ${
              setupItems.some(item => isActive(item.href))
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="text-xl mr-3 flex-shrink-0">⚙️</span>
            <span className={`transition-all duration-200 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            } truncate flex-1 text-left`}>
              Setup
            </span>
            {!isCollapsed && (
              <span className={`transition-transform duration-200 ml-2 ${
                expandedSections.setup ? 'rotate-90' : ''
              }`}>
                ▶
              </span>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                Setup
              </div>
            )}
          </button>
          
          {/* Setup Items */}
          {!isCollapsed && expandedSections.setup && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-purple-500 pl-2">
              {setupItems.map(item => renderNavigationItem(item, 1))}
            </div>
          )}
        </div>
      </div>

      {/* Collapsed State Helper */}
      {isCollapsed && (
        <div className="sticky bottom-0 left-0 right-0 text-center p-4 bg-gray-900 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            Hover for menu
          </div>
        </div>
      )}
    </div>
  );
}