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
  ChevronRight,
  User2,
  UserCheckIcon
} from 'lucide-react';

/* -------------------- Types -------------------- */

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  nested?: NavigationItem[];
  permissionKey: string; // 对应API中的权限键
}

interface PermissionSet {
  edit: boolean;
  read: boolean;
  create: boolean;
  delete: boolean;
}

interface AllPermissions {
  [key: string]: PermissionSet;
}

interface UserPermissionResponse {
  id: number;
  userId: number;
  permissions: {
    permissions: AllPermissions;
  };
  createdAt: string;
  updatedAt: string;
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

/* -------------------- Menu Items Configuration -------------------- */

const mainNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    permissionKey: 'DASHBOARD'
  },
  {
    name: 'Address Book',
    href: '/addressbook',
    icon: <Users className="w-4 h-4" />,
    permissionKey: 'ADDRESSBOOK',
    nested: [
      { 
        name: 'Customers', 
        href: '/addressbook', 
        icon: <User className="w-4 h-4" />,
        permissionKey: 'CUSTOMERS'
      },
      { 
        name: 'Branches', 
        href: '/sites', 
        icon: <MapPin className="w-4 h-4" />,
        permissionKey: 'SITES'
      },
      { 
        name: 'Customer Registration', 
        href: '/customer-registration', 
        icon: <Users className="w-4 h-4" />,
        permissionKey: 'CUSTOMER_REGISTRATION'
      }
    ]
  },
  { 
    name: 'Tasks', 
    href: '/tasks', 
    icon: <CheckSquare className="w-4 h-4" />,
    permissionKey: 'TASKS'
  },
  { 
    name: 'Service Contracts', 
    href: '/service-contract', 
    icon: <FileText className="w-4 h-4" />,
    permissionKey: 'SERVICE_CONTRACTS'
  },
];

const setupItems: NavigationItem[] = [
  { 
    name: 'Departments', 
    href: '/departments', 
    icon: <Building className="w-4 h-4" />,
    permissionKey: 'DEPARTMENTS'
  },
  { 
    name: 'Products Category', 
    href: '/products', 
    icon: <Package className="w-4 h-4" />,
    permissionKey: 'PRODUCTS_CATEGORY'
  },
  { 
    name: 'Service Category', 
    href: '/contract-work', 
    icon: <ClipboardList className="w-4 h-4" />,
    permissionKey: 'SERVICE_CATEGORY'
  },
  { 
    name: 'WorkScope Category', 
    href: '/workscope', 
    icon: <BarChart3 className="w-4 h-4" />,
    permissionKey: 'WORKSCOPE_CATEGORY'
  },
  { 
    name: 'Users Permission', 
    href: '/userpermission', 
    icon: <UserCheckIcon className="w-4 h-4" />,
    permissionKey: 'USERS'
  }
];

/* -------------------- Component -------------------- */

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  // User info
  const [clientFullName, setClientFullName] = useState("User");
  const [clientUserType, setClientUserType] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  // ✅ SUPERADMIN flag (new)
  const isSuperAdmin = clientUserType === "SUPERADMIN";
  
  // Permissions state
  const [allPermissions, setAllPermissions] = useState<AllPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Collapse Sections
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    addressbook: true,
    setup: true
  });

  useEffect(() => {
    const name = localStorage.getItem("fullName");
    const type = localStorage.getItem("userType");
    const storedUserId = localStorage.getItem("userId");

    if (name) setClientFullName(name);
    if (type) setClientUserType(type);
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  // 🔹 Fetch permissions with dynamic userId
  const fetchPermissions = async () => {
    try {
      // ✅ If SUPERADMIN → show all links, no need to fetch permissions
      if (isSuperAdmin) {
        setAllPermissions({});
        setLoadingPermissions(false);
        return;
      }

      const storedUserId = localStorage.getItem("userId");
      
      if (!storedUserId) {
        console.warn('No user ID found in localStorage');
        setLoadingPermissions(false);
        return;
      }

      // Convert to number for API call
      const userId = parseInt(storedUserId);
      
      // Fetch permissions for specific user
      const res = await fetch(`https://enplerp.electrohelps.in/backend/user-permissions/${userId}`);
      
      if (!res.ok) {
        console.warn(`Failed to fetch permissions for user ${userId}, using default`);
        setAllPermissions({});
        return;
      }

      // ✅ FIX: Avoid res.json() when body is empty or not JSON
      const contentType = res.headers.get("content-type") || "";
      const rawText = await res.text();

      if (!rawText) {
        console.warn(`Empty response body for user ${userId} permissions`);
        setAllPermissions({});
        return;
      }

      if (!contentType.includes("application/json")) {
        console.warn(`Non-JSON response for user ${userId} permissions:`, rawText);
        setAllPermissions({});
        return;
      }

      let data: UserPermissionResponse | null = null;
      try {
        data = JSON.parse(rawText) as UserPermissionResponse;
      } catch (e) {
        console.warn(`Invalid JSON response for user ${userId} permissions:`, rawText);
        setAllPermissions({});
        return;
      }

      // Extract permissions from response
      if (data && data.permissions && data.permissions.permissions) {
        const perms = data.permissions.permissions;
        setAllPermissions(perms);
        console.log(`✅ Sidebar permissions loaded for user ${userId}:`, perms);
      } else {
        console.warn('Invalid permissions data structure:', data);
        setAllPermissions({});
      }
    } catch (err) {
      console.error('❌ Error fetching sidebar permissions:', err);
      setAllPermissions({});
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
    // ✅ re-run when userId OR userType changes (SUPERADMIN)
  }, [userId, isSuperAdmin]); // Re-fetch when userId changes

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

  // 🔹 Check if user has read permission for a menu item
  const hasReadPermission = (permissionKey: string): boolean => {
    // ✅ SUPERADMIN sees everything
    if (isSuperAdmin) return true;

    if (loadingPermissions) return false; 
    
    const permission = allPermissions[permissionKey];
    if (!permission) {
      console.warn(`No permission found for key: ${permissionKey}`);
      return false;
    }
    
    return permission.read === true;
  };

  // 🔹 Filter navigation items based on read permission
  const filterNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    // ✅ SUPERADMIN: show all without filtering
    if (isSuperAdmin) return items;

    return items
      .map(item => {
        // Handle nested items first
        if (item.nested && item.nested.length > 0) {
          const filteredNested = filterNavigationItems(item.nested);

          // If parent has NO read permission but children do → show children ONLY
          if (!hasReadPermission(item.permissionKey)) {
            return filteredNested.length > 0
              ? { ...item, nested: filteredNested }
              : null;
          }

          // Parent has permission → show with filtered children
          return filteredNested.length > 0
            ? { ...item, nested: filteredNested }
            : hasReadPermission(item.permissionKey)
            ? item
            : null;
        }

        // Non-nested item → normal permission check
        return hasReadPermission(item.permissionKey) ? item : null;
      })
      .filter(Boolean) as NavigationItem[];
  };

  // 🔹 Render filtered navigation items
  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasNested = !!item.nested?.length;
    const isActiveItem = isActive(item.href);
    const isParentActive = hasNested && isActiveParent(item.nested);
    const sectionKey = getSectionKey(item.name);

    return (
      <div key={`${item.href}-${level}`} className={`${level > 0 ? "ml-3" : ""}`}>
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

  // 🔹 Filter all menu items based on permissions
  const filteredMainItems = filterNavigationItems(mainNavigationItems);
  const filteredSetupItems = filterNavigationItems(setupItems);

  // 🔹 Check if any Setup items are visible
  const hasVisibleSetupItems = filteredSetupItems.length > 0;

  // 🔹 Show loading state while fetching permissions
  if (loadingPermissions) {
    return (
      <div className={`
        bg-gradient-to-b from-gray-900 to-gray-800 text-white
        ${isCollapsed ? "w-16" : "w-64"}
        h-screen fixed left-0 top-0 z-50 border-r border-gray-700
        transition-all duration-300 shadow-xl
      `}>
        <div className="p-4 border-b border-gray-700 bg-gray-900/80 sticky top-0">
          <h1 className="font-extrabold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ENPL ERP
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-sm">Loading permissions...</span>
        </div>
      </div>
    );
  }

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

        {/* Main Section - Only show if items exist */}
        {filteredMainItems.length > 0 && (
          <>
            {filteredMainItems.map(item => renderNavigationItem(item))}
          </>
        )}

        {/* Setup Section - Only show if items exist */}
        {hasVisibleSetupItems && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <button
              onClick={() => toggleSection("setup")}
              className={`
                flex items-center w-full py-2 px-2 rounded-md text-sm transition-all duration-300
                ${filteredSetupItems.some(it => isActive(it.href))
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
                  ${expandedSections.setup ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}
                `}
              >
                <div className="space-y-1 border-l border-purple-500 pl-3 mt-1">
                  {filteredSetupItems.map(item => renderNavigationItem(item, 1))}
                </div>
              </div>
            )}
          </div>
        )}
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
              <div className="text-[9px] text-gray-500">ID: {userId}</div>
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