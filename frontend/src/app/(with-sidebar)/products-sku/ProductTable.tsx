"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateProductModal from "./CreateProductModal";
import Papa from "papaparse";
import { FaDownload, FaEdit, FaSearch, FaTrashAlt } from "react-icons/fa"; // for the CSV icon
import UpdateProductModal from "./UpdateProductModal";

interface Product {
  id: string;
  productId: string;
  productName: string;
  productDescription: string;
  HSN: string;
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
  const itemsPerPage = 8;

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:8000/products");
      setProducts(response.data.reverse());
    } catch (error) {
      console.error("Error fetching products:", error);
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
    if (products.length === 0) return;

    const csv = Papa.unparse(
      products.map(
        ({
          id,
          productId,
          productName,
          productDescription,
          HSN,
          categoryId,
          subCategoryId,
        }) => ({
          ID: id,
          ProductID: productId,
          ProductName: productName,
          ProductDescription: productDescription,
          HSN,
          Category: getCategoryName(categoryId),
          SubCategory: getSubCategoryName(subCategoryId),
        })
      )
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setSelectedProductId(product.id);
    setShowUpdateModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmDelete) {
      return;
    }
    try {
      await axios.delete(`http://localhost:8000/products/${id}`);
      alert("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
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

  // 1. Filter products based on searchTerm
const filteredProducts = products.filter((product) =>
  product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
  product.productDescription.toLowerCase().includes(searchTerm.toLowerCase())
);

// 2. Sort the filtered products
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

// 3. Paginate the sorted + filtered products
const indexOfLastUser = currentPage * itemsPerPage;
const indexOfFirstUser = indexOfLastUser - itemsPerPage;
const currentProducts = sortedProducts.slice(indexOfFirstUser, indexOfLastUser);

const handleSort = (field: keyof Product | "category" | "subCategory") => {
  if (field === sortField) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortOrder("asc");
  }
};

  


  

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  

  return (
  <div className="p-8 bg-gray-50 min-h-screen -mt-10 text-black">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Products</h1>
    </div>

    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
          >
            Add Product
          </button>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
              />
            </div>
            <button
              onClick={handleDownloadCSV}
              className="text-blue-500 hover:text-blue-700 text-xl"
              title="Download CSV"
            >
              <FaDownload />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto" style={{ maxWidth: "100vw" }}>
          <table className="w-full text-sm text-gray-700 bg-white rounded-xl shadow-md overflow-hidden">
            <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
              <tr className="bg-gray-200">

                <th
  onClick={() => handleSort("category")}
  className="border border-gray-300 p-2 cursor-pointer"
>
  Category
  <span className="ml-1">{sortField === "category" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}</span>
</th>
<th
  onClick={() => handleSort("subCategory")}
  className="border border-gray-300 p-2 cursor-pointer"
>
  Sub Category
  <span className="ml-1">{sortField === "subCategory" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}</span>
</th>

{/* <th
  onClick={() => handleSort("productId")}
  className="border border-gray-300 p-2 cursor-pointer"
>
  ProductId
  <span className="ml-1">{sortField === "productId" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}</span>
</th> */}
<th
  onClick={() => handleSort("productName")}
  className="border border-gray-300 p-2 cursor-pointer"
>
  ProductName
  <span className="ml-1">{sortField === "productName" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}</span>
</th>
<th
  onClick={() => handleSort("productDescription")}
  className="border border-gray-300 p-2 cursor-pointer"
>
  ProductDescription
  <span className="ml-1">{sortField === "productDescription" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}</span>
</th>
<th
  onClick={() => handleSort("HSN")}
  className="border border-gray-300 p-2 cursor-pointer"
>
  HSN
  <span className="ml-1">{sortField === "HSN" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}</span>
</th>
                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-100">
                   <td className="border border-gray-300 p-2">
                    {getCategoryName(product.categoryId)}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {getSubCategoryName(product.subCategoryId)}
                  </td>
                  {/* <td className="border border-gray-300 p-2">
                    {product.productId}
                  </td> */}
                  <td className="border border-gray-300 p-2">
                    {product.productName}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {product.productDescription}
                  </td>
                  <td className="border border-gray-300 p-2">{product.HSN}</td>
                 
                  <td className="border border-gray-300 p-2 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full shadow transition-transform transform hover:scale-110"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow transition-transform transform hover:scale-110"
                        title="Delete"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {[...Array(Math.ceil(filteredProducts.length / itemsPerPage))].map(
            (_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`mx-1 px-4 py-2 rounded ${
                  currentPage === index + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-700"
                } hover:bg-blue-400`}
              >
                {index + 1}
              </button>
            )
          )}

          <button
            onClick={() => paginate(currentPage + 1)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            disabled={
              currentPage === Math.ceil(filteredProducts.length / itemsPerPage)
            }
          >
            Next
          </button>
        </div>

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
