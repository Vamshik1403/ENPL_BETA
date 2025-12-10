'use client';

import { useState, useEffect } from 'react';

interface ServiceWorkCategory {
  id?: number;
  serviceWorkCategoryName: string;
}

export default function ServiceWorkPage() {
  const [serviceWorkCategories, setServiceWorkCategories] = useState<ServiceWorkCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ServiceWorkCategory>({
    serviceWorkCategoryName: '',
  });

  // Fetch service work categories from backend API
  const fetchServiceWorkCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/serviceworkcategory');
      if (response.ok) {
        const data = await response.json();
        setServiceWorkCategories(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch service work categories');
        setServiceWorkCategories([]);
      }
    } catch (error) {
      console.error('Error fetching service work categories:', error);
      setServiceWorkCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Load service work categories on component mount
  useEffect(() => {
    fetchServiceWorkCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        // Update existing service work category - only send the fields that should be updated
        const updateData = {
          serviceWorkCategoryName: formData.serviceWorkCategoryName,
        };
        
        const response = await fetch(`http://localhost:8000/serviceworkcategory/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (response.ok) {
          await fetchServiceWorkCategories(); // Refresh the list
          resetForm();
        } else {
          console.error('Failed to update service work category');
        }
      } else {
        // Create new service work category
        const response = await fetch('http://localhost:8000/serviceworkcategory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          await fetchServiceWorkCategories(); // Refresh the list
          resetForm();
        } else {
          console.error('Failed to create service work category');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    const item = serviceWorkCategories.find(s => s.id === id);
    if (item) {
      setFormData(item);
      setEditingId(id);
      setShowModal(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this service work category?')) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/serviceworkcategory/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await fetchServiceWorkCategories(); // Refresh the list
        } else {
          console.error('Failed to delete service work category');
        }
      } catch (error) {
        console.error('Error deleting service work category:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      serviceWorkCategoryName: '',
    });
  };

  const handleAddNew = () => {
    setFormData({
      serviceWorkCategoryName: '',
    });
    setEditingId(null);
    setShowModal(true);
  };

  // Modal component
  const ServiceWorkModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Service Work Category' : 'Add Service Work Category'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Work Category Name
              </label>
              <input
                type="text"
                value={formData.serviceWorkCategoryName}
                onChange={(e) => setFormData({ ...formData, serviceWorkCategoryName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Service Work Category
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Work</h1>
        <p className="text-black">Manage service work categories</p>
      </div>

      <div className="mb-6">
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Service Work Category
        </button>
      </div>

      {/* Modal */}
      {showModal && <ServiceWorkModal />}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Service Work Categories</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Work Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Loading service work categories...
                  </td>
                </tr>
              ) : !Array.isArray(serviceWorkCategories) || serviceWorkCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No service work categories found. Add one to get started.
                  </td>
                </tr>
              ) : (
                serviceWorkCategories.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.serviceWorkCategoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item.id!)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded hover:bg-blue-50"
                        aria-label="Edit"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded hover:bg-red-50"
                        aria-label="Delete"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
