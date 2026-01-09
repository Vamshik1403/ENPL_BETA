'use client';

import { useState, useEffect } from 'react';

interface ProductType {
  id?: number;
  productTypeName: string;
}

// Permission types
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

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductType>({
    productTypeName: '',
  });

  // Permissions state
  const [allPermissions, setAllPermissions] = useState<AllPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const [productCategoryPermissions, setProductCategoryPermissions] = useState<PermissionSet>({
    edit: false,
    read: false,
    create: false,
    delete: false
  });

  // Pagination and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);

  const API_URL = 'https://ristarerp.openwan.in/backend/producttype';
  const PERMISSIONS_API = 'https://ristarerp.openwan.in/backend/user-permissions';

  // Fetch permissions
const fetchPermissions = async (uid: number) => {
    try {
const res = await fetch(`${PERMISSIONS_API}/${uid}`);
      if (!res.ok) throw new Error('Failed to fetch permissions');

      const data: UserPermissionResponse = await res.json();
      const perms = data?.permissions?.permissions ?? {};

      setAllPermissions(perms);
      localStorage.setItem('userPermissions', JSON.stringify(perms));

      setProductCategoryPermissions(
        perms.PRODUCTS_CATEGORY ?? {
          read: false,
          create: false,
          edit: false,
          delete: false,
        }
      );
      
      console.log('✅ Product Category permissions loaded:', perms.PRODUCTS_CATEGORY);
    } catch (err) {
      console.error('❌ Error fetching permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Filter products based on search term and read permission
  useEffect(() => {
    if (!productCategoryPermissions.read && !loadingPermissions) {
      setFilteredProducts([]);
      return;
    }
    
    const filtered = products.filter(product =>
      product.productTypeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id?.toString().includes(searchTerm)
    );
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, products, productCategoryPermissions.read, loadingPermissions]);

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
    // Check read permission before fetching
    if (!productCategoryPermissions.read) {
      console.log('No read permission for PRODUCTS_CATEGORY');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(API_URL);
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

  // Load permissions on component mount
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


  // Load products after permissions are loaded
  useEffect(() => {
    if (!loadingPermissions && productCategoryPermissions.read) {
      fetchProducts();
    }
  }, [loadingPermissions, productCategoryPermissions.read]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check permissions before submitting
    if (editingId && !productCategoryPermissions.edit) {
      alert('You do not have permission to edit product types');
      return;
    }
    
    if (!editingId && !productCategoryPermissions.create) {
      alert('You do not have permission to create product types');
      return;
    }

    setLoading(true);
    
    try {
      if (editingId) {
        // Update existing product - only send the fields that should be updated
        const updateData = {
          productTypeName: formData.productTypeName,
        };
        
        const response = await fetch(`${API_URL}/${editingId}`, {
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
        const response = await fetch(API_URL, {
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
    if (!productCategoryPermissions.edit) {
      alert('You do not have permission to edit product types');
      return;
    }
    
    const item = products.find(p => p.id === id);
    if (item) {
      setFormData(item);
      setEditingId(id);
      setShowModal(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!productCategoryPermissions.delete) {
      alert('You do not have permission to delete product types');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this product type?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/${id}`, {
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
    if (!productCategoryPermissions.create) {
      alert('You do not have permission to create product types');
      return;
    }
    
    setFormData({
      productTypeName: '',
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

 

  // Modal component
  const ProductModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Product Category' : 'Add Product Category'}
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
                disabled={loading || (editingId ? !productCategoryPermissions.edit : !productCategoryPermissions.create)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
                    : editingId 
                      ? (productCategoryPermissions.edit 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70')
                      : (productCategoryPermissions.create 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70')
                }`}
                title={editingId 
                  ? (productCategoryPermissions.edit ? "Update product type" : "No edit permission") 
                  : (productCategoryPermissions.create ? "Create product type" : "No create permission")
                }
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
    <div className="p-8 bg-gray-50 min-h-screen -mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Product Category</h1>
       
      </div>

      {/* Search and Controls Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 items-center">
          {/* ADD BUTTON - controlled by create permission */}
          <button
            onClick={handleAddNew}
            disabled={!productCategoryPermissions.create}
            className={`px-6 py-3 rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${
              productCategoryPermissions.create
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
            }`}
            title={productCategoryPermissions.create ? "Add new product category" : "No create permission"}
          >
            <Icons.Plus />
            Add Product Category
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
        Showing {currentProducts.length} of {filteredProducts.length} product categories
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
                    {!searchTerm && productCategoryPermissions.create && (
                      <div className="mt-4">
                        <button
                          onClick={handleAddNew}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm"
                        >
                          <Icons.Plus />
                          Add Your First Product Category
                        </button>
                      </div>
                    )}
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
                        {/* EDIT BUTTON - controlled by edit permission */}
                        <button
                          onClick={() => handleEdit(item.id!)}
                          disabled={loading || !productCategoryPermissions.edit}
                          className={`p-2 rounded transition-colors ${
                            loading || !productCategoryPermissions.edit
                              ? 'text-gray-400 cursor-not-allowed opacity-70'
                              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer'
                          }`}
                          aria-label="Edit"
                          title={productCategoryPermissions.edit ? "Edit product type" : "No edit permission"}
                        >
                          <Icons.Edit />
                        </button>
                        
                        {/* DELETE BUTTON - controlled by delete permission */}
                        <button
                          onClick={() => handleDelete(item.id!)}
                          disabled={loading || !productCategoryPermissions.delete}
                          className={`p-2 rounded transition-colors ${
                            loading || !productCategoryPermissions.delete
                              ? 'text-gray-400 cursor-not-allowed opacity-70'
                              : 'text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer'
                          }`}
                          aria-label="Delete"
                          title={productCategoryPermissions.delete ? "Delete product type" : "No delete permission"}
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