'use client';

import { useEffect, useState } from 'react';

interface ContractWorkCategory {
  id?: number;
  contractWorkCategoryName: string;
}

export default function ContractWorkPage() {
  const [contractWorkCategories, setContractWorkCategories] = useState<ContractWorkCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ContractWorkCategory>({ contractWorkCategoryName: '' });
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:8000/contractworkcategory';

  // 🔹 Fetch all categories from backend
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setContractWorkCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setContractWorkCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🔹 Submit (Add / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update existing category - only send the fields that should be updated
        const updateData = {
          contractWorkCategoryName: formData.contractWorkCategoryName,
        };
        
        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
        if (!res.ok) throw new Error('Failed to update category');
      } else {
        // Add new category
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to add category');
      }

      await fetchCategories();
      resetForm();
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  // 🔹 Edit existing category
  const handleEdit = (id: number) => {
    const item = contractWorkCategories.find((c) => c.id === id);
    if (item) {
      // Only set the fields we need, excluding nested objects
      setFormData({
        contractWorkCategoryName: item.contractWorkCategoryName,
      });
      setEditingId(id);
      setShowModal(true);
    }
  };

  // 🔹 Delete category
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  // 🔹 Reset form
  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ contractWorkCategoryName: '' });
  };

  // 🔹 Handle Add New
  const handleAddNew = () => {
    setFormData({ contractWorkCategoryName: '' });
    setEditingId(null);
    setShowModal(true);
  };

  // Modal component
  const ContractWorkModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Contract Work Category' : 'Add New Contract Work Category'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Contract Work Category Name
              </label>
              <input
                type="text"
                value={formData.contractWorkCategoryName}
                onChange={(e) => setFormData({ ...formData, contractWorkCategoryName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1"
              >
                {editingId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={resetForm}
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Work</h1>
        <p className="text-black">Manage contract work categories</p>
      </div>

      <div className="mb-6">
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Contract Work Category
        </button>
      </div>

      {/* Modal */}
      {showModal && <ContractWorkModal />}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Contract Work Categories</h2>
          {loading && <span className="text-sm text-gray-500">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(contractWorkCategories) && contractWorkCategories.length > 0 ? (
                contractWorkCategories.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.contractWorkCategoryName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item.id!)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-4">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}