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
      { name: 'Customers', href: '/addressbook', icon: '👤' },
      { name: 'Sites', href: '/sites', icon: '📍' }
    ]
  },
  { name: 'Service Contracts ', href: '/service-contract', icon: '📄' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
  // { name: 'Support Tickets', href: '/support-tickets', icon: '🎫' },
  // { name: 'Ticket Users', href: '/support-ticket-users', icon: '🧑‍💻' },
];

const setupItems: NavigationItem[] = [
    { name: 'Departments', href: '/departments', icon: '🏛️' },
  { name: 'Products Type', href: '/products', icon: '📦' },
  { name: 'CW Category', href: '/contract-work', icon: '📋' },
    { name: 'Task Services', href: '/workscope', icon: '📊' },

];



export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    addressbook: true,
    setup: true
  }); 

  const toggleSection = (section: keyof ExpandedSections) => {
    // Accordion behavior: open the clicked section, close others
    setExpandedSections(prev => {
      const next: ExpandedSections = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as ExpandedSections);
      return { ...next, [section]: !prev[section] };
    });
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
              className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 ease-in-out group ${
                isParentActive || isActiveItem
                  ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/30 ring-1 ring-blue-400/30'
                  : 'text-gray-300 hover:bg-gray-700/70 hover:text-white hover:shadow-md'
              } ${level > 0 ? 'text-sm' : ''}`}
            >
              <span className="text-xl mr-3 flex-shrink-0">{item.icon}</span>
              <span className={`transition-all duration-300 ${
                isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
              } truncate flex-1 text-left`}>
                {item.name}
              </span>
              {!isCollapsed && (
                <span
                  className={`ml-2 transition-transform duration-300 ease-in-out ${
                    expandedSections[sectionKey] ? 'rotate-90' : 'rotate-0'
                  }`}
                  aria-hidden
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
            
            {/* Nested Items with smooth transition */}
            {!isCollapsed && (
              <div
                className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedSections[sectionKey] ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-1 border-l-2 border-gray-600 pl-2">
                  {item.nested?.map((nestedItem: NavigationItem) => renderNavigationItem(nestedItem, level + 1))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.href}
            className={`flex items-center p-3 rounded-lg transition-all duration-300 ease-in-out group relative ${
              isActiveItem
                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/30 ring-1 ring-blue-400/30'
                : 'text-gray-300 hover:bg-gray-700/70 hover:text-white hover:shadow-md'
            } ${level > 0 ? 'text-sm' : ''}`}
          >
            <span className="text-xl mr-3 flex-shrink-0">{item.icon}</span>
            <span className={`transition-all duration-300 ${
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
      <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-900/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className={`
            font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent
            transition-all duration-300
            ${isCollapsed ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
          `}>
            ENPL ERP
          </h1>
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
            className={`flex items-center w-full p-3 rounded-lg transition-all duration-300 ease-in-out group ${
              setupItems.some(item => isActive(item.href))
                ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-900/30 ring-1 ring-purple-400/30'
                : 'text-gray-300 hover:bg-gray-700/70 hover:text-white hover:shadow-md'
            }`}
          >
            <span className="text-xl mr-3 flex-shrink-0">⚙️</span>
            <span className={`transition-all duration-300 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            } truncate flex-1 text-left`}>
              Setup
            </span>
            {!isCollapsed && (
              <span
                className={`ml-2 transition-transform duration-300 ease-in-out ${
                  expandedSections.setup ? 'rotate-90' : 'rotate-0'
                }`}
                aria-hidden
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                Setup
              </div>
            )}
          </button>
          
          {/* Setup Items with smooth transition */}
          {!isCollapsed && (
            <div
              className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                expandedSections.setup ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1 border-l-2 border-purple-500 pl-2">
                {setupItems.map(item => renderNavigationItem(item, 1))}
              </div>
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
