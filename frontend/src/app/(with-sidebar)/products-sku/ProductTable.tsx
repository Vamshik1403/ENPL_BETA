"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateProductModal from "./CreateProductModal";
import Papa from "papaparse";
import { FaDownload, FaEdit, FaSearch, FaTrashAlt, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import UpdateProductModal from "./UpdateProductModal";

interface Product {
  id: string;
  productId: string;
  productName: string;
  productDescription: string;
  HSN: string;
  unit: string;
  gstRate: string;
  categoryId: number;
  subCategoryId: string;
}

interface Category {
  id: number;
  categoryName: string;
  subCategoryName: string;
}

const ProductTable: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortField, setSortField] = useState<keyof Product | "category" | "subCategory">("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 8;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/products");
      setProducts(response.data.reverse());
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to load products. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:8000/category");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get("http://localhost:8000/subcategory");
      setSubCategories(response.data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const handleDownloadCSV = () => {
    if (products.length === 0) {
      alert("No products to download.");
      return;
    }

    try {
      const csv = Papa.unparse(
        products.map(
          ({
            id,
            productId,
            productName,
            productDescription,
            HSN,
            unit,
            gstRate,
            categoryId,
            subCategoryId,
          }) => ({
            ID: id,
            ProductID: productId,
            ProductName: productName,
            ProductDescription: productDescription,
            HSN,
            Unit: unit,
            GST_Rate: gstRate,
            Category: getCategoryName(categoryId),
            SubCategory: getSubCategoryName(subCategoryId),
          })
        )
      );

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `products_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("CSV downloaded successfully!");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV. Please try again.");
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setSelectedProductId(product.id);
    setShowUpdateModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:8000/products/${id}`);
      alert("Product deleted successfully!");
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to delete product. Please try again.";
      alert(errorMessage);
    }
  };

  const getCategoryName = (id: number): string => {
    const category = categories.find((cat) => cat.id === id);
    return category ? category.categoryName : "Unknown";
  };

  const getSubCategoryName = (id: string): string => {
    const subCategory = subCategories.find(
      (subCat) => subCat.id === Number(id)
    );
    return subCategory ? subCategory.subCategoryName : "Unknown";
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubCategories();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(product.categoryId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSubCategoryName(product.subCategoryId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aField: string | number = a[sortField as keyof Product] ?? "";
    let bField: string | number = b[sortField as keyof Product] ?? "";

    if (sortField === "category") {
      aField = getCategoryName(a.categoryId);
      bField = getCategoryName(b.categoryId);
    }

    if (sortField === "subCategory") {
      aField = getSubCategoryName(a.subCategoryId);
      bField = getSubCategoryName(b.subCategoryId);
    }

    const result =
      typeof aField === "string"
        ? aField.localeCompare(String(bField))
        : (aField as number) - (bField as number);

    return sortOrder === "asc" ? result : -result;
  });

  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleSort = (field: keyof Product | "category" | "subCategory") => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: keyof Product | "category" | "subCategory") => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return sortOrder === "asc" ? 
      <FaSortUp className="ml-1 text-blue-600" /> : 
      <FaSortDown className="ml-1 text-blue-600" />;
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
<div className="w-full -ml-13 sm:ml-0 px-4 py-4 sm:px-6 text-black">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Products</h1>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform duration-300 w-full md:w-auto flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> Add Product
        </button>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search by name, category, HSN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
            />
          </div>
          <button
            onClick={handleDownloadCSV}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
            title="Download CSV"
            disabled={products.length === 0}
          >
            <FaDownload />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-xl shadow-md">
            <table className="w-full text-sm text-gray-700">
              <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                <tr>
                  <th className="p-4 border border-gray-300 text-left cursor-pointer" onClick={() => handleSort("category")}>
                    <div className="flex items-center">
                      Category
                      {getSortIcon("category")}
                    </div>
                  </th>
                  <th className="p-4 border border-gray-300 text-left cursor-pointer" onClick={() => handleSort("subCategory")}>
                    <div className="flex items-center">
                      Sub Category
                      {getSortIcon("subCategory")}
                    </div>
                  </th>
                  <th className="p-4 border border-gray-300 text-left cursor-pointer" onClick={() => handleSort("productName")}>
                    <div className="flex items-center">
                      Product Name
                      {getSortIcon("productName")}
                    </div>
                  </th>
                  <th className="p-4 border border-gray-300 text-left cursor-pointer" onClick={() => handleSort("productDescription")}>
                    <div className="flex items-center">
                      Description
                      {getSortIcon("productDescription")}
                    </div>
                  </th>
                  <th className="p-4 border border-gray-300 text-left cursor-pointer" onClick={() => handleSort("HSN")}>
                    <div className="flex items-center">
                      HSN
                      {getSortIcon("HSN")}
                    </div>
                  </th>
                  <th className="p-4 border border-gray-300">Unit</th>
                  <th className="p-4 border border-gray-300">GST Rate</th>
                  <th className="p-4 border border-gray-300 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      {searchTerm ? "No products found matching your search." : "No products available. Add your first product!"}
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 border border-gray-300">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {getCategoryName(product.categoryId)}
                        </span>
                      </td>
                      <td className="p-4 border border-gray-300">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {getSubCategoryName(product.subCategoryId)}
                        </span>
                      </td>
                      <td className="p-4 border border-gray-300 font-medium">{product.productName}</td>
                      <td className="p-4 border border-gray-300 text-gray-600">{product.productDescription}</td>
                      <td className="p-4 border border-gray-300 font-mono">{product.HSN}</td>
                      <td className="p-4 border border-gray-300">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          {product.unit}
                        </span>
                      </td>
                      <td className="p-4 border border-gray-300">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {product.gstRate}%
                        </span>
                      </td>
                      <td className="p-4 border border-gray-300">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg shadow transition-all hover:shadow-lg hover:scale-105"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow transition-all hover:shadow-lg hover:scale-105"
                            title="Delete"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateProductModal
        show={isCreateModalOpen}
        onHide={() => setIsCreateModalOpen(false)}
        fetchProducts={fetchProducts}
      />

      {showUpdateModal && selectedProduct && (
        <UpdateProductModal
          show={showUpdateModal}
          onHide={() => setShowUpdateModal(false)}
          productId={selectedProductId}
          fetchProducts={fetchProducts}
        />
      )}
    </div>
  );
};

export default ProductTable;