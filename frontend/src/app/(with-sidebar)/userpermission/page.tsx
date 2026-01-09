'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

/* -------------------------------------------------------
   Icons
------------------------------------------------------- */
const Icons = {
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="20 20 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4 bg-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
           m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Delete: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
           a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6
           m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0
           7 7 0 0114 0z" />
    </svg>
  ),
  Permission: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
};

/* -------------------------------------------------------
   Types
------------------------------------------------------- */
interface User {
  id?: number;
  username: string;
  password?: string;
  fullName?: string;
  email?: string;
  userType?: string;
  department?: string;
  createdAt?: string;
}

interface Department {
  id: number;
  departmentName: string;
}

type CrudPerm = { read: boolean; create: boolean; edit: boolean; delete: boolean };
type PermissionsJson = Record<string, CrudPerm>;

/* -------------------------------------------------------
   API Endpoints
------------------------------------------------------- */
const API = {
  LIST: "https://enplerp.electrohelps.in/backend/auth/users",
  REGISTER: "https://enplerp.electrohelps.in/backend/auth/register",
  UPDATE: "https://enplerp.electrohelps.in/backend/auth/users",
  DELETE: "https://enplerp.electrohelps.in/backend/auth/users",
  PERMISSION: (userId: number) => `https://enplerp.electrohelps.in/backend/user-permissions/${userId}`,
  USER_DETAIL: (userId: number) => `https://enplerp.electrohelps.in/backend/auth/users/${userId}`,
  DEPARTMENTS: "https://enplerp.electrohelps.in/backend/department"
};

/* -------------------------------------------------------
   Modules Configuration
------------------------------------------------------- */
const MODULES: { key: string; label: string }[] = [
  { key: 'DASHBOARD', label: 'Dashboard' },
  { key: 'CUSTOMERS', label: 'Customers' },
  { key: 'SITES', label: 'Sites' },
  { key: 'SERVICE_CONTRACTS', label: 'Service Contracts' },
  { key: 'TASKS', label: 'Tasks' },
  { key: 'USERS', label: 'Users Permission' },
  { key: 'CUSTOMER_REGISTRATION', label: 'Customer Registration' },
  { key: 'DEPARTMENTS', label: 'Departments' },
  { key: 'PRODUCTS_CATEGORY', label: 'Products Category' },
  { key: 'SERVICE_CATEGORY', label: 'Service Category' },
  { key: 'WORKSCOPE_CATEGORY', label: 'WorkScope Category' },
];

const emptyCrud = (): CrudPerm => ({ read: false, create: false, edit: false, delete: false });

function normalizePermissions(raw: any): PermissionsJson {
  const base: PermissionsJson = {};
  for (const m of MODULES) base[m.key] = emptyCrud();

  if (!raw) return base;

const p =
  raw?.permissions?.permissions ??
  raw?.permissions ??
  raw;

  if (p && typeof p === 'object') {
    for (const k of Object.keys(p)) {
      const v = p[k];
      if (!v || typeof v !== 'object') continue;

      base[k] = {
        read: !!v.read,
        create: !!v.create,
        edit: !!v.edit,
        delete: !!v.delete,
      };
    }
  }

  for (const m of MODULES) {
    if (!base[m.key]) base[m.key] = emptyCrud();
  }
  return base;
}

/* -------------------------------------------------------
   Helper Functions
------------------------------------------------------- */
const safeFetchJson = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) {
    return null; // Return null for empty responses
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', error, 'Text:', text);
    return null;
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/* -------------------------------------------------------
   User Modal Component
------------------------------------------------------- */
const UserModal = ({ 
  open, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  editingId, 
  loading,
  departments = [] 
}: any) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg text-black">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {editingId ? 'Edit User' : 'Add User'}
          </h2>
          <button 
            className="text-2xl text-gray-500 hover:text-gray-700 disabled:opacity-50" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="text-sm font-medium">Username *</label>
            <input
              type="text"
              required
              disabled={loading}
              className="w-full mt-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={formData.username}
              onChange={(e) => setFormData((f: any) => ({ ...f, username: e.target.value }))}
            />
          </div>

          <div className="mb-3">
            <label className="text-sm font-medium">
              Password {editingId && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              disabled={loading}
              className="w-full mt-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={formData.password}
              onChange={(e) => setFormData((f: any) => ({ ...f, password: e.target.value }))}
              required={!editingId}
            />
          </div>

          <div className="mb-3">
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              disabled={loading}
              className="w-full mt-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={formData.fullName}
              onChange={(e) => setFormData((f: any) => ({ ...f, fullName: e.target.value }))}
            />
          </div>

          <div className="mb-3">
            <label className="text-sm font-medium">User Type</label>
            <select
              disabled={loading}
              className="w-full mt-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={formData.userType}
              onChange={(e) => setFormData((f: any) => ({ ...f, userType: e.target.value }))}
            >
              <option value="">Select type</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
              <option value="USER">USER</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="text-sm font-medium">Email</label>
            <input
              disabled={loading}
              className="w-full mt-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={formData.email}
              onChange={(e) => setFormData((f: any) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium">Department</label>
            <select
              disabled={loading}
              className="w-full mt-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={formData.department}
              onChange={(e) => setFormData((f: any) => ({ ...f, department: e.target.value }))}
            >
              <option value="">Select department</option>
              {departments.map((dept: Department) => (
                <option key={dept.id} value={dept.departmentName}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  {editingId ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingId ? 'Update' : 'Add'
              )}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-black py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------
   Permissions Modal Component
------------------------------------------------------- */
const PermissionsModal = ({ 
  open, 
  onClose, 
  user, 
  permissions, 
  setPermissions, 
  loadingPerm, 
  savingPerm, 
  permError,
  onSave 
}: any) => {
  if (!open || !user) return null;

  const isAllChecked = (p: CrudPerm) => p.read && p.create && p.edit && p.delete;

  const toggleAllForModule = (moduleKey: string, checked: boolean) => {
    setPermissions((prev: PermissionsJson) => ({
      ...prev,
      [moduleKey]: {
        read: checked,
        create: checked,
        edit: checked,
        delete: checked,
      },
    }));
  };

  const setModulePerm = (moduleKey: string, patch: Partial<CrudPerm>) => {
    setPermissions((prev: PermissionsJson) => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || emptyCrud()),
        ...patch,
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <div className="text-xl font-bold text-gray-900">
              Manage Permissions for {user.username}
            </div>
            <div className="text-sm text-gray-600">{user.fullName} • {user.department || 'No department'}</div>
          </div>
          <button
            onClick={onClose}
            disabled={savingPerm}
            className="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-50"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {permError && (
            <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
              {permError}
            </div>
          )}

          {loadingPerm ? (
            <div className="py-10 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
              <p className="text-gray-600 mt-3">Loading permissions…</p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <div className="max-h-[55vh] overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Module
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        All
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Read
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Create
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Edit
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Delete
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {MODULES.map(m => {
                      const p = permissions[m.key] || emptyCrud();
                      const all = isAllChecked(p);

                      return (
                        <tr key={m.key} className="hover:bg-blue-50/20">
                          <td className="px-4 py-3 font-medium text-gray-900">{m.label}</td>

                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-blue-600 cursor-pointer"
                              checked={all}
                              onChange={e => toggleAllForModule(m.key, e.target.checked)}
                            />
                          </td>

                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-blue-600 cursor-pointer"
                              checked={p.read}
                              onChange={e => setModulePerm(m.key, { read: e.target.checked })}
                            />
                          </td>

                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-blue-600 cursor-pointer"
                              checked={p.create}
                              onChange={e => setModulePerm(m.key, { create: e.target.checked })}
                            />
                          </td>

                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-blue-600 cursor-pointer"
                              checked={p.edit}
                              onChange={e => setModulePerm(m.key, { edit: e.target.checked })}
                            />
                          </td>

                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-blue-600 cursor-pointer"
                              checked={p.delete}
                              onChange={e => setModulePerm(m.key, { delete: e.target.checked })}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white">
                <button
                  onClick={onClose}
                  disabled={savingPerm}
                  className="px-5 py-2 rounded-lg border text-black border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={savingPerm}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {savingPerm ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                      Saving…
                    </>
                  ) : (
                    'Save Permissions'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------
   Main Users Page
------------------------------------------------------- */
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [usersError, setUsersError] = useState<string>('');
  
  // Departments State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // User Modal States
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userFormData, setUserFormData] = useState<User>({
    username: "",
    password: "",
    fullName: "",
    userType: "",
    email: "",
    department: ""
  });
  const [savingUser, setSavingUser] = useState(false);

  // Permissions Modal States
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<PermissionsJson>(() => normalizePermissions(null));
  const [loadingPerm, setLoadingPerm] = useState(false);
  const [savingPerm, setSavingPerm] = useState(false);
  const [permError, setPermError] = useState<string>('');
  // Loading State
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    setLoadingDepartments(true);
    try {
      const res = await fetch(API.DEPARTMENTS, {
        cache: 'no-store',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        console.error(`Failed to fetch departments (${res.status})`);
        return;
      }
      
      const data = await safeFetchJson(res);
      if (Array.isArray(data)) {
        setDepartments(data);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const res = await fetch(API.LIST, {
        cache: 'no-store',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch users (${res.status}): ${errorText || 'No error message'}`);
      }
      
      const data = await safeFetchJson(res);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch users error:", err);
      setUsersError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [fetchUsers, fetchDepartments]);

  useEffect(() => {
    const t = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.username?.toLowerCase().includes(t) ||
          u.fullName?.toLowerCase().includes(t) ||
          u.userType?.toLowerCase().includes(t) ||
          u.email?.toLowerCase().includes(t) ||
          u.department?.toLowerCase().includes(t)
      )
    );
  }, [search, users]);

  // User Modal Handlers
  const openAddUser = () => {
    setEditingId(null);
    setUserFormData({
      username: "",
      password: "",
      fullName: "",
      userType: "",
      email: "",
      department: ""
    });
    setUserModalOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditingId(u.id || null);
    setUserFormData({
      username: u.username || "",
      password: "",
      fullName: u.fullName || "",
      userType: u.userType || "",
      email: u.email || "",
      department: u.department || ""
    });
    setUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);

    try {
      let payload: any = {
        username: userFormData.username,
        fullName: userFormData.fullName,
        userType: userFormData.userType,
        email: userFormData.email,
        department: userFormData.department
      };

      if (!editingId) {
        payload.password = userFormData.password;
      } else if (userFormData.password?.trim() !== "") {
        payload.password = userFormData.password;
      }

      const url = editingId
        ? `${API.UPDATE}/${editingId}`
        : API.REGISTER;

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to save user (${res.status}): ${errorText || 'No error message'}`);
      }

      // Try to parse response, but don't fail if it's empty
      await safeFetchJson(res);

      setUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Save user error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async (id?: number) => {
    if (!id || !confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${API.DELETE}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete user (${res.status}): ${errorText || 'No error message'}`);
      }

      fetchUsers();
    } catch (err: any) {
      console.error("Delete user error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // Permissions Modal Handlers
  const openPermissions = async (user: User) => {
    if (!user.id) return;
    
    setSelectedUser(user);
    setPermModalOpen(true);
    setPermError('');
    setLoadingPerm(true);

    try {
      const res = await fetch(API.PERMISSION(user.id), { 
        cache: 'no-store',
        headers: getAuthHeaders()
      });

      if (res.status === 404) {
        setPermissions(normalizePermissions(null));
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Permission API failed (${res.status}): ${errorText || 'No error message'}`);
      }

      const data = await safeFetchJson(res);
      setPermissions(normalizePermissions(data));
    } catch (e: any) {
      console.error("Load permissions error:", e);
      setPermError(e?.message || 'Failed to load permissions');
      setPermissions(normalizePermissions(null));
    } finally {
      setLoadingPerm(false);
    }
  };

  const closePermModal = () => {
    if (savingPerm) return;
    setPermModalOpen(false);
    setSelectedUser(null);
    setPermError('');
    setLoadingPerm(false);
    setSavingPerm(false);
  };

  const savePermissions = async () => {
    if (!selectedUser?.id) return;

    setPermError('');
    setSavingPerm(true);

    try {
      const res = await fetch(API.PERMISSION(selectedUser.id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissions }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to save permissions (${res.status}): ${errorText || 'No error message'}`);
      }

      // Try to parse response, but don't fail if it's empty
      await safeFetchJson(res);
      
      closePermModal();
    } catch (e: any) {
      console.error("Save permissions error:", e);
      setPermError(e?.message || 'Failed to save permissions');
    } finally {
      setSavingPerm(false);
    }
  };

  // Header actions
  const headerRight = useMemo(() => {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={fetchUsers}
          disabled={loadingUsers}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh"
        >
          <Icons.Refresh />
          Refresh
        </button>

        <button
          onClick={openAddUser}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Icons.Plus />
          Add User
        </button>
      </div>
    );
  }, [loadingUsers, fetchUsers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 mt-1">Manage system users and permissions</p>
          </div>
          {headerRight}
        </div>

        {/* Error Display */}
        {usersError && (
          <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
            <div className="font-medium">Error loading users</div>
            <div className="text-sm mt-1">{usersError}</div>
            <button
              onClick={fetchUsers}
              className="mt-2 text-sm text-red-700 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative w-full md:w-96">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Search />
            </div>
            <input
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
              placeholder="Search users by username, name, type, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* User Modal */}
        <UserModal
          open={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          onSubmit={handleUserSubmit}
          formData={userFormData}
          setFormData={setUserFormData}
          editingId={editingId}
          loading={savingUser}
          departments={departments}
        />

        {/* Permissions Modal */}
        <PermissionsModal
          open={permModalOpen}
          onClose={closePermModal}
          user={selectedUser}
          permissions={permissions}
          setPermissions={setPermissions}
          loadingPerm={loadingPerm}
          savingPerm={savingPerm}
          permError={permError}
          onSave={savePermissions}
        />

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b  from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">User List</div>
                <div className="text-sm text-gray-600">
                  {loadingUsers ? 'Loading users…' : `${users.length} users found`}
                </div>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
              <p className="text-gray-600 mt-3">Loading users…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["Username", "Full Name", "User Type", "Department", "email", "Actions"].map((t) => (
                      <th
                        key={t}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filtered.length ? (
                    filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-blue-50/30 transition">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{u.username}</div>
                          <div className="text-xs text-gray-500">ID: #{u.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{u.fullName || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.userType === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800' :
                            u.userType === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                            u.userType === 'USER' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {u.userType || 'Not set'}
                          </span>
                        </td>
                      
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{u.department || '-'}</div>
                        </td>
                          <td className="px-6 py-4">
                          <div className="text-gray-900">{u.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditUser(u)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                              title="Edit User"
                            >
                              <Icons.Edit />
                            </button>
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete User"
                            >
                              <Icons.Delete />
                            </button>
                            <button
                              onClick={() => openPermissions(u)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                              title="Manage Permissions"
                            >
                              <Icons.Permission />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-600">
                        {search ? 'No users match your search' : 'No users found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {users.length > 0 && !loadingUsers && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filtered.length} of {users.length} users
            {search && ` • Filtered by: "${search}"`}
          </div>
        )}
      </div>
    </div>
  );
}