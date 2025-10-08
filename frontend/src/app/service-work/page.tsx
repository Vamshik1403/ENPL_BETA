'use client';

import { useState, useEffect } from 'react';

interface ServiceWorkCategory {
  id?: number;
  serviceWorkCategoryName: string;
}

export default function ServiceWorkPage() {
  const [serviceWorkCategories, setServiceWorkCategories] = useState<ServiceWorkCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
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
        setServiceWorkCategories(data);
      } else {
        console.error('Failed to fetch service work categories');
      }
    } catch (error) {
      console.error('Error fetching service work categories:', error);
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
          setShowForm(false);
          setEditingId(null);
          setFormData({ serviceWorkCategoryName: '' });
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
          setShowForm(false);
          setFormData({ serviceWorkCategoryName: '' });
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
      setShowForm(true);
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Work</h1>
        <p className="text-black">Manage service work categories</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Service Work Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Service Work Category' : 'Add New Service Work Category'}
          </h2>
          <form onSubmit={handleSubmit} className="max-w-md">
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
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Service Work Category
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    serviceWorkCategoryName: '',
                  });
                }}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
              ) : serviceWorkCategories.length === 0 ? (
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
                        className="text-black hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
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
