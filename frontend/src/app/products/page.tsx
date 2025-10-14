'use client';

import { useState, useEffect } from 'react';

interface ProductType {
  id?: number;
  productTypeName: string;
}

// Icons
const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Delete: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Search: () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>),
  ChevronLeft: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>),
  ChevronRight: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>),
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductType>({
    productTypeName: '',
  });

  // Pagination and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);

  // Filter products based on search term
  useEffect(() => {
    const filtered = products.filter(product =>
      product.productTypeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id?.toString().includes(searchTerm)
    );
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, products]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

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

  // Fetch products from backend API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/producttype');
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        // Update existing product - only send the fields that should be updated
        const updateData = {
          productTypeName: formData.productTypeName,
        };
        
        const response = await fetch(`http://localhost:8000/producttype/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (response.ok) {
          await fetchProducts(); // Refresh the list
          resetForm();
        } else {
          console.error('Failed to update product');
        }
      } else {
        // Create new product
        const response = await fetch('http://localhost:8000/producttype', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          await fetchProducts(); // Refresh the list
          resetForm();
        } else {
          console.error('Failed to create product');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    const item = products.find(p => p.id === id);
    if (item) {
      setFormData(item);
      setEditingId(id);
      setShowModal(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product type?')) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/producttype/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await fetchProducts(); // Refresh the list
        } else {
          console.error('Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      productTypeName: '',
    });
  };

  const handleAddNew = () => {
    setFormData({
      productTypeName: '',
    });
    setEditingId(null);
    setShowModal(true);
  };

  // Modal component
  const ProductModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Product Type' : 'Add New Product Type'}
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
                Product Type Name
              </label>
              <input
                type="text"
                value={formData.productTypeName}
                onChange={(e) => setFormData({ ...formData, productTypeName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Product Type
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Product Types</h1>
        <p className="text-gray-600">Manage product types and categories</p>
      </div>

      {/* Search and Controls Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 items-center">
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center gap-2"
          >
            <Icons.Plus />
            Add New Product Type
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.Search />
          </div>
          <input
            type="text"
            placeholder="Search product types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {currentProducts.length} of {filteredProducts.length} product types
        {searchTerm && (
          <span> for "<strong>{searchTerm}</strong>"</span>
        )}
      </div>

      {/* Modal */}
      {showModal && <ProductModal />}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Product Types</h2>
            {loading && <span className="text-sm text-blue-100">Loading...</span>}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">ID</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">
                  Product Type Name
                </th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No product types found matching your search' : 'No product types found. Add one to get started.'}
                  </td>
                </tr>
              ) : (
                currentProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.productTypeName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(item.id!)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800 transition-colors p-2 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Delete"
                          title="Delete"
                        >
                          <Icons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
