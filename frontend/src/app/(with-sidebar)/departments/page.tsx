'use client';

import { useEffect, useState, useRef } from 'react';
import { nanoid } from 'nanoid';
import React from 'react';

interface Department {
  id?: number;
  departmentName: string;
  emails?: DepartmentEmail[];
}

// Permission types
interface PermissionSet {
  edit: boolean;
  read: boolean;
  create: boolean;
  delete: boolean;
}

interface DepartmentEmail {
  id?: string;
  email: string;
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

// Icons
const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Delete: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Search: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>),
  ChevronLeft: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>),
  ChevronRight: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>),
  NoAccess: () => (<svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
  Loading: () => (<svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)
};


interface DepartmentModalProps {
  show: boolean;
  editingId: number | null;
  formData: Department;
  setFormData: React.Dispatch<React.SetStateAction<Department>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  departmentPermissions: PermissionSet;
}

const DepartmentModal = React.memo(function DepartmentModal({
  show,
  editingId,
  formData,
  setFormData,
  onSubmit,
  onClose,
  departmentPermissions,
}: DepartmentModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Department' : 'Add Department'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Department Name
              </label>
              <input
                type="text"
                value={formData.departmentName}
                onChange={(e) => {
                  if (!editingId) {
                    setFormData(prev => ({ 
                      ...prev, 
                      departmentName: e.target.value 
                    }));
                  }
                }}
                readOnly={!!editingId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Department Emails
              </label>

              {formData.emails?.map(item => (
                <div key={item.id} className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={item.email}
                    onChange={e => {
                      const value = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        emails: prev.emails?.map(em =>
                          em.id === item.id ? { ...em, email: value } : em
                        ),
                      }));
                    }}
                    placeholder="email@company.com"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        emails: prev.emails?.filter(e => e.id !== item.id),
                      }))
                    }
                    disabled={(formData.emails?.length || 0) === 1}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    emails: [...(prev.emails || []), { id: nanoid(), email: '' }],
                  }))
                }
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1 flex items-center gap-1"
              >
                <Icons.Plus />
                Add another email
              </button>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                  editingId 
                    ? (departmentPermissions.edit 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70')
                    : (departmentPermissions.create 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70')
                }`}
                disabled={editingId ? !departmentPermissions.edit : !departmentPermissions.create}
                title={editingId 
                  ? (departmentPermissions.edit ? "Update department" : "No edit permission") 
                  : (departmentPermissions.create ? "Create department" : "No create permission")
                }
              >
                {editingId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});


export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Department>({
  departmentName: '',
emails: [{ id: nanoid(), email: '' }]
});

  const [loading, setLoading] = useState(false);
  
  // Permissions state
  const [allPermissions, setAllPermissions] = useState<AllPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const [departmentPermissions, setDepartmentPermissions] = useState<PermissionSet>({
    edit: false,
    read: false,
    create: false,
    delete: false
  });

  // Pagination and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  const API_URL = 'https://enplerp.electrohelps.in/backend/api/department';
  const PERMISSIONS_API = 'https://enplerp.electrohelps.in/backend/api/user-permissions';

  // Fetch permissions
const fetchPermissions = async (uid: number) => {
    try {
const res = await fetch(`${PERMISSIONS_API}/${uid}`);
      if (!res.ok) throw new Error('Failed to fetch permissions');

      const data: UserPermissionResponse = await res.json();
      const perms = data?.permissions?.permissions ?? {};

      setAllPermissions(perms);
      localStorage.setItem('userPermissions', JSON.stringify(perms));

      setDepartmentPermissions(
        perms.DEPARTMENTS ?? {
          read: false,
          create: false,
          edit: false,
          delete: false,
        }
      );
      
      console.log('✅ Department permissions loaded:', perms.DEPARTMENTS);
    } catch (err) {
      console.error('❌ Error fetching permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Filter departments based on search term and read permission
  useEffect(() => {
    if (!departmentPermissions.read && !loadingPermissions) {
      setFilteredDepartments([]);
      return;
    }
    
    const filtered = departments.filter(dept =>
      dept.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.id?.toString().includes(searchTerm)
    );
    setFilteredDepartments(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, departments, departmentPermissions.read, loadingPermissions]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDepartments = filteredDepartments.slice(startIndex, startIndex + itemsPerPage);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 🔹 Fetch departments
  const fetchDepartments = async () => {
    // Check read permission before fetching
    if (!departmentPermissions.read) {
      console.log('No read permission for DEPARTMENTS');
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (userId) {
    fetchPermissions(userId);
  }
}, [userId]);


  useEffect(() => {
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) {
    setUserId(Number(storedUserId));
  }
}, []);


  useEffect(() => {
    if (!loadingPermissions && departmentPermissions.read) {
      fetchDepartments();
    }
  }, [loadingPermissions, departmentPermissions.read]);

  // 🔹 Create or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check permissions before submitting
    if (editingId && !departmentPermissions.edit) {
      alert('You do not have permission to edit departments');
      return;
    }
    
    if (!editingId && !departmentPermissions.create) {
      alert('You do not have permission to create departments');
      return;
    }

    try {
      if (editingId) {
        // Update department - only send the fields that should be updated


const emails = formData.emails
  ?.map(e => e.email.trim())
  .filter(Boolean);

const payload = {
  departmentName: formData.departmentName.trim(),
  emails,
};

        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!res.ok) throw new Error('Failed to update department');
        
      } else {
        // Add department
const emails = formData.emails
  ?.map(e => e.email.trim())
  .filter(Boolean);

const payload = {
  departmentName: formData.departmentName.trim(),
  emails,
};

        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to add department');
      }

      await fetchDepartments();
      resetForm();
    } catch (err) {
      console.error('Error saving department:', err);
    }
  };

  // 🔹 Edit
  const handleEdit = (id: number) => {
  if (!departmentPermissions.edit) return;

  const dept = departments.find(d => d.id === id);
  if (!dept) return;

  setFormData({
    departmentName: dept.departmentName,
    emails:
      dept.emails && dept.emails.length > 0
        ? dept.emails.map(e => ({
            id: nanoid(),        // frontend-only stable key
            email: e.email,
          }))
        : [{ id: nanoid(), email: '' }],
  });

  setEditingId(id);
  setShowModal(true);
};

  // 🔹 Delete
  const handleDelete = async (id: number) => {
    if (!departmentPermissions.delete) {
      alert('You do not have permission to delete departments');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete department');
      await fetchDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
    }
  };

  // 🔹 Reset form
const resetForm = () => {
  setShowModal(false);
  setEditingId(null);
  setFormData({
    departmentName: '',
emails: [{ id: nanoid(), email: '' }]
  });
};


  // 🔹 Handle Add
  const handleAddNew = () => {
    if (!departmentPermissions.create) {
      alert('You do not have permission to create departments');
      return;
    }
    
setFormData({
  departmentName: '',
emails: [{ id: nanoid(), email: '' }]
});
    setEditingId(null);
    setShowModal(true);
  };

  // Show loading state while permissions are being fetched
  if (loadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  


  return (
    <div className="p-8 bg-gray-50 min-h-screen -mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Departments</h1>
       
      </div>

      {/* Search and Controls Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 text-black items-center">
          {/* ADD BUTTON - controlled by create permission */}
          <button
            onClick={handleAddNew}
            disabled={!departmentPermissions.create}
            className={`px-6 py-3  rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${
              departmentPermissions.create
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
            }`}
            title={departmentPermissions.create ? "Add new department" : "No create permission"}
          >
            <Icons.Plus />
            Add Department
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.Search />
          </div>
          <input
  type="text"
  placeholder="Search departments..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
/>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {currentDepartments.length} of {filteredDepartments.length} departments
        {searchTerm && (
          <span> for "<strong>{searchTerm}</strong>"</span>
        )}
      </div>

      {/* Modal */}
<DepartmentModal
  show={showModal}
  editingId={editingId}
  formData={formData}
  setFormData={setFormData}
  onSubmit={handleSubmit}
  onClose={resetForm}
  departmentPermissions={departmentPermissions}
/>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Departments</h2>
            {loading && <span className="text-sm text-blue-100">Loading...</span>}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">ID</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Department Name</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Emails</th>

                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentDepartments.length > 0 ? (
                currentDepartments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-700 font-medium">{item.id}</td>
                    <td className="px-6 py-4 text-gray-700">{item.departmentName}</td>
                    <td className="px-6 py-4 text-gray-700">
  {item.emails?.map(e => e.email).join(', ')}
</td>

                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        {/* EDIT BUTTON - controlled by edit permission */}
                        <button
                          onClick={() => handleEdit(item.id!)}
                          disabled={!departmentPermissions.edit}
                          className={`p-2 rounded transition-colors ${
                            departmentPermissions.edit
                              ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer'
                              : 'text-gray-400 cursor-not-allowed opacity-70'
                          }`}
                          aria-label="Edit"
                          title={departmentPermissions.edit ? "Edit department" : "No edit permission"}
                        >
                          <Icons.Edit />
                        </button>
                        
                        {/* DELETE BUTTON - controlled by delete permission */}
                        <button
                          onClick={() => handleDelete(item.id!)}
                          disabled={!departmentPermissions.delete}
                          className={`p-2 rounded transition-colors ${
                            departmentPermissions.delete
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer'
                              : 'text-gray-400 cursor-not-allowed opacity-70'
                          }`}
                          aria-label="Delete"
                          title={departmentPermissions.delete ? "Delete department" : "No delete permission"}
                        >
                          <Icons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-8">
                    {searchTerm ? 'No departments found matching your search' : 'No departments found'}
                    {!searchTerm && departmentPermissions.create && (
                      <div className="mt-4">
                        <button
                          onClick={handleAddNew}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm"
                        >
                          <Icons.Plus />
                          Add Your First Department
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Icons.ChevronLeft />
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 border text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <Icons.ChevronRight />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}