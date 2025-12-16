'use client';

import { useEffect, useState, useCallback } from 'react';

/* -------------------------------------------------------
   Icons
------------------------------------------------------- */
const Icons = {
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  )
};

/* -------------------------------------------------------
   Modal Component (DOES NOT RE-RENDER USERS PAGE)
------------------------------------------------------- */
const UserModal = ({ open, onClose, onSubmit, formData, setFormData, editingId }: any) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg text-black">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {editingId ? 'Edit User' : 'Add User'}
          </h2>
          <button className="text-2xl text-gray-500" onClick={onClose}>×</button>
        </div>

        <form onSubmit={onSubmit}>
          {/* username */}
          <div className="mb-3">
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              required
              className="w-full mt-1 border px-3 py-2 rounded text-black"
              value={formData.username}
              onChange={(e) => setFormData((f: any) => ({ ...f, username: e.target.value }))}
            />
          </div>

          {/* password */}
          <div className="mb-3">
            <label className="text-sm font-medium">
              Password {editingId && <span className="text-xs text-gray-500">(optional)</span>}
            </label>
            <input
              type="password"
              className="w-full mt-1 border px-3 py-2 rounded text-black"
              value={formData.password}
              onChange={(e) => setFormData((f: any) => ({ ...f, password: e.target.value }))}
              required={!editingId}
            />
          </div>

          {/* fullName */}
          <div className="mb-3">
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              className="w-full mt-1 border px-3 py-2 rounded text-black"
              value={formData.fullName}
              onChange={(e) => setFormData((f: any) => ({ ...f, fullName: e.target.value }))}
            />
          </div>

          {/* userType */}
          <div className="mb-3">
            <label className="text-sm font-medium">User Type</label>
            <input
              type="text"
              className="w-full mt-1 border px-3 py-2 rounded text-black"
              value={formData.userType}
              onChange={(e) => setFormData((f: any) => ({ ...f, userType: e.target.value }))}
            />
          </div>

          {/* department */}
          <div className="mb-5">
            <label className="text-sm font-medium">Department</label>
            <input
              type="text"
              className="w-full mt-1 border px-3 py-2 rounded text-black"
              value={formData.department}
              onChange={(e) => setFormData((f: any) => ({ ...f, department: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
              {editingId ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={onClose} className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg">
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------
   Main Users Page
------------------------------------------------------- */

interface User {
  id?: number;
  username: string;
  password?: string;
  fullName?: string;
  userType?: string;
  department?: string;
}

export default function UsersPage() {
  const API = {
    LIST: "http://localhost:8000/auth/users",
    REGISTER: "http://localhost:8000/auth/register",
    UPDATE: "http://localhost:8000/auth/users",
    DELETE: "http://localhost:8000/auth/users"
  };

  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<User>({
    username: "",
    password: "",
    fullName: "",
    userType: "",
    department: ""
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(API.LIST, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Fetch error", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const t = search.toLowerCase();

    setFiltered(
      users.filter(
        (u) =>
          u.username.toLowerCase().includes(t) ||
          u.fullName?.toLowerCase().includes(t) ||
          u.userType?.toLowerCase().includes(t) ||
          u.department?.toLowerCase().includes(t)
      )
    );
  }, [search, users]);

  const openAdd = () => {
    setEditingId(null);
    setFormData({
      username: "",
      password: "",
      fullName: "",
      userType: "",
      department: ""
    });
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingId(u.id || null);
    setFormData({
      username: u.username,
      password: "",
      fullName: u.fullName || "",
      userType: u.userType || "",
      department: u.department || ""
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      let payload: any = {
        username: formData.username,
        fullName: formData.fullName,
        userType: formData.userType,
        department: formData.department
      };

      if (!editingId) {
        payload.password = formData.password;
      } else if (formData.password?.trim() !== "") {
        payload.password = formData.password;
      }

      const url = editingId
        ? `${API.UPDATE}/${editingId}`
        : API.REGISTER;

      await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.log("Save error", err);
    }
  };

  const deleteUser = async (id?: number) => {
    if (!id || !confirm("Delete this user?")) return;

    await fetch(`${API.DELETE}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    fetchUsers();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen -mt-10 text-black">

      <h1 className="text-3xl font-bold text-blue-900 mb-1">Users</h1>
      <p className="text-gray-600 mb-6">Manage system users</p>

      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow"
        >
          <Icons.Plus /> Add User
        </button>

        <div className="relative w-full sm:w-72">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icons.Search />
          </div>
          <input
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-black"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Modal */}
      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-blue-600 text-white flex justify-between">
          <h2 className="text-lg font-semibold">User List</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-blue-50">
            <tr>
              {["ID", "Username", "Full Name", "User Type", "Department", "Actions"].map((t) => (
                <th
                  key={t}
                  className="px-6 py-3 text-left text-blue-800 font-semibold"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filtered.length ? (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{u.id}</td>
                  <td className="px-6 py-3">{u.username}</td>
                  <td className="px-6 py-3">{u.fullName || "-"}</td>
                  <td className="px-6 py-3">{u.userType || "-"}</td>
                  <td className="px-6 py-3">{u.department || "-"}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                      >
                        <Icons.Delete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-center py-8 text-gray-500" colSpan={6}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
