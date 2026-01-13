'use client';

import { useEffect, useState } from 'react';

export type DashboardPermissions = {
  metrics: boolean;
  inventory: boolean;
  tasks: boolean;
  resources: boolean;
  quickActions: boolean;
  hasAnyPermission: boolean;
};

const defaultPermissions: DashboardPermissions = {
  metrics: false,
  inventory: false,
  tasks: false,
  resources: false,
  quickActions: false,
  hasAnyPermission: false,
};

export function useDashboardPermissions() {
  const [permissions, setPermissions] = useState<DashboardPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      const access_token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('userId');

      console.log("🟦 DASHBOARD PERM FETCH userId:", userId);
      console.log("🟦 DASHBOARD PERM FETCH access_token exists:", !!access_token);

      if (!userId || !access_token) {
        console.warn("❌ Missing access_token/userId in localStorage");
        setPermissions(defaultPermissions);
        return;
      }

      const response = await fetch(`http://localhost:8000/user-permissions/${userId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      console.log("🟦 Permissions API status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.warn("❌ Permissions API failed:", errText);
        setPermissions(defaultPermissions);
        return;
      }

      const data = await response.json();
      console.log("✅ FULL PERMISSION RESPONSE:", data);

      const userPermissions = data?.permissions?.permissions;
      console.log("✅ Extracted permissions object:", userPermissions);

      if (!userPermissions) {
        console.warn("❌ userPermissions missing at data.permissions.permissions");
        setPermissions(defaultPermissions);
        return;
      }

      const metrics = !!userPermissions.DASHBOARD_METRICS?.read;
      const inventory = !!userPermissions.DASHBOARD_INVENTORY?.read;
      const tasks = !!userPermissions.DASHBOARD_TASKS?.read;
      const resources = !!userPermissions.DASHBOARD_RESOURCES?.read;
      const quickActions = !!userPermissions.DASHBOARD_QUICK_ACTIONS?.read;

      const newPermissions: DashboardPermissions = {
        metrics,
        inventory,
        tasks,
        resources,
        quickActions,
        hasAnyPermission: metrics || inventory || tasks || resources || quickActions,
      };

      console.log("✅ FINAL DASHBOARD PERMISSIONS USED:", newPermissions);

      setPermissions(newPermissions);
    } catch (err) {
      console.error("❌ Permission hook crash:", err);
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const refreshPermissions = () => {
    setLoading(true);
    fetchPermissions();
  };

  return { permissions, loading, refreshPermissions };
}
