'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Users,
  User,
  MapPin,
  FileText,
  CheckSquare,
  Building,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronRight
} from 'lucide-react';

/* -------------------- Types -------------------- */

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
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

/* -------------------- Menu Items -------------------- */

const mainNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />
  },
  {
    name: 'Address Book',
    href: '/addressbook',
    icon: <Users className="w-4 h-4" />,
    nested: [
      { name: 'Customers', href: '/addressbook', icon: <User className="w-4 h-4" /> },
      { name: 'Sites', href: '/sites', icon: <MapPin className="w-4 h-4" /> }
    ]
  },
  { name: 'Service Contracts', href: '/service-contract', icon: <FileText className="w-4 h-4" /> },
  { name: 'Tasks', href: '/tasks', icon: <CheckSquare className="w-4 h-4" /> }
];

const setupItems: NavigationItem[] = [
  { name: 'Departments', href: '/departments', icon: <Building className="w-4 h-4" /> },
  { name: 'Products Category', href: '/products', icon: <Package className="w-4 h-4" /> },
  { name: 'Service Category', href: '/contract-work', icon: <ClipboardList className="w-4 h-4" /> },
  { name: 'WorkScope Category', href: '/workscope', icon: <BarChart3 className="w-4 h-4" /> }
];

/* -------------------- Component -------------------- */

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  // User info
  const [clientFullName, setClientFullName] = useState("User");
  const [clientUserType, setClientUserType] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("fullName");
    const type = localStorage.getItem("userType");

    if (name) setClientFullName(name);
    if (type) setClientUserType(type);
  }, []);

  // Collapse Sections
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

  const getSectionKey = (itemName: string): keyof ExpandedSections =>
    itemName.toLowerCase().replace(/\s/g, '') as keyof ExpandedSections;

  const isActive = (href: string) => pathname === href;
  const isActiveParent = (nested?: NavigationItem[]) =>
    nested?.some(item => pathname === item.href);

  /* -------------------- Render Menu Item -------------------- */

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasNested = !!item.nested?.length;
    const isActiveItem = isActive(item.href);
    const isParentActive = hasNested && isActiveParent(item.nested);
    const sectionKey = getSectionKey(item.name);

    return (
      <div key={item.href} className={`${level > 0 ? "ml-3" : ""}`}>
        {hasNested ? (
          <>
            <button
              onClick={() => toggleSection(sectionKey)}
              className={`
                flex items-center w-full py-2 px-2 rounded-md text-sm transition-all duration-300
                ${isParentActive || isActiveItem
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700/60 hover:text-white"}
              `}
            >
              <span className="mr-2">{item.icon}</span>
              {!isCollapsed && <span className="flex-1">{item.name}</span>}
              {!isCollapsed && (
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${
                    expandedSections[sectionKey] ? "rotate-90" : ""
                  }`}
                />
              )}
            </button>

            {!isCollapsed && (
              <div
                className={`ml-4 overflow-hidden transition-all duration-300 ${
                  expandedSections[sectionKey] ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-l border-gray-600 pl-3 space-y-1 mt-1">
                  {item.nested?.map(n => renderNavigationItem(n, 1))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.href}
            className={`
              flex items-center py-2 px-2 rounded-md text-sm transition-all duration-300
              ${isActiveItem
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                : "text-gray-300 hover:bg-gray-700/60 hover:text-white"}
            `}
          >
            <span className="mr-2">{item.icon}</span>
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        )}
      </div>
    );
  };

  /* -------------------- Sidebar Layout -------------------- */

  return (
    <div
      className={`
        bg-gradient-to-b from-gray-900 to-gray-800 text-white
        ${isCollapsed ? "w-16" : "w-64"}
        h-screen fixed left-0 top-0 z-50 border-r border-gray-700
        transition-all duration-300 shadow-xl
      `}
    >

      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-900/80 sticky top-0">
        <h1
          className={`
            font-extrabold text-xl bg-gradient-to-r from-blue-400 to-purple-400 
            bg-clip-text text-transparent transition-all
            ${isCollapsed ? "opacity-0 scale-75" : "opacity-100 scale-100"}
          `}
        >
          ENPL ERP
        </h1>
      </div>

      {/* Scrollable Menu */}
      <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">

        {/* Main Section */}
        {mainNavigationItems.map(item => renderNavigationItem(item))}

        {/* Users (NEW MAIN LINK) */}
        <Link
          href="/users"
          className={`
            flex items-center py-2 px-2 rounded-md text-sm transition-all duration-300
            ${pathname === "/users"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
              : "text-gray-300 hover:bg-gray-700/60 hover:text-white"}
          `}
        >
          <User className="w-4 h-4 mr-2" />
          {!isCollapsed && <span>Users</span>}
        </Link>

        {/* Setup Section */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <button
            onClick={() => toggleSection("setup")}
            className={`
              flex items-center w-full py-2 px-2 rounded-md text-sm transition-all duration-300
              ${setupItems.some(it => isActive(it.href))
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "text-gray-300 hover:bg-gray-700/60 hover:text-white"}
            `}
          >
            <Settings className="w-4 h-4 mr-2" />
            {!isCollapsed && <span className="flex-1">Setup</span>}
            {!isCollapsed && (
              <ChevronRight
                className={`w-3 h-3 transition-transform ${
                  expandedSections.setup ? "rotate-90" : ""
                }`}
              />
            )}
          </button>

          {!isCollapsed && (
            <div
              className={`
                ml-4 overflow-hidden transition-all duration-300
                ${expandedSections.setup ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}
              `}
            >
              <div className="space-y-1 border-l border-purple-500 pl-3 mt-1">
                {setupItems.map(item => renderNavigationItem(item, 1))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Footer */}
      <div
        className={`absolute bottom-0 left-0 w-full bg-gray-900/90 p-2 ${
          isCollapsed ? "pl-0" : "pl-2"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="
              w-8 h-8 flex items-center justify-center rounded-full 
              bg-gradient-to-r from-blue-500 to-purple-500 
              text-white font-semibold text-xs
            "
          >
            {clientFullName.charAt(0).toUpperCase()}
          </div>

          {!isCollapsed && (
            <div className="leading-tight">
              <div className="font-medium text-xs text-white">{clientFullName}</div>
              <div className="text-[10px] text-gray-400 capitalize">{clientUserType}</div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className={`
            w-full flex items-center justify-center py-1 rounded-md
            bg-red-500 hover:bg-red-500 text-white transition-all duration-200
            ${isCollapsed ? "text-[10px]" : "text-xs"}
          `}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
