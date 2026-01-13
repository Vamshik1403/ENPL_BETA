"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaSearch, FaTrashAlt } from "react-icons/fa";

interface SubCategory {
  id: number;
  subCategoryName: string;
}

interface Category {
  id: number;
  categoryName: string;
  categoryId: string;
  subCategories: SubCategory[];
}

const CategoryTable: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Category; direction: "asc" | "desc" } | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [formData, setFormData] = useState({
    categoryName: "",
    categoryId: "",
    subCategories: [{ subCategoryName: "" }],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:8000/category");
      setCategories(response.data.reverse());
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };



  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await axios.delete(`http://localhost:8000/category/${id}`);
        alert("Category deleted successfully!");
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        alert(
          "Failed to delete category. Ensure there are no dependent entries."
        );
      }
    }
  };

  const handleCreate = async () => {
    const { categoryName } = formData;

    if (!categoryName) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      await axios.post("http://localhost:8000/category", {
        categoryName: formData.categoryName,
        categoryId: formData.categoryId,
        subCategories: formData.subCategories,
      });
      alert("Category created successfully!");
      setIsCreateModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory) return;

    try {
      await axios.put(`http://localhost:8000/category/${selectedCategory.id}`, {
        categoryName: formData.categoryName,
        categoryId: String(formData.categoryId), // ensure it's a string
        subCategories: formData.subCategories,
      });
      alert("Category updated successfully!");
      setIsUpdateModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category.");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(
    (category) =>
      category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.categoryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.subCategories.some((subCategory) =>
        subCategory.subCategoryName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (!sortConfig) return 0;
    const key = sortConfig.key;
    const direction = sortConfig.direction === "asc" ? 1 : -1;
    return a[key].toString().localeCompare(b[key].toString()) * direction;
  });

  const requestSort = (key: keyof Category) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentCategories = sortedCategories.slice(indexOfFirstUser, indexOfLastUser);


  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);




return (
  <div className="p-8 bg-gray-50 min-h-screen -mt-10 text-black">
  
        <div className="flex justify-between items-center mb-5 mt-16">
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setFormData({
                categoryName: "",
                categoryId: "",
                subCategories: [{ subCategoryName: "" }],
              });
            }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
          >
            Add Product Category
          </button>
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

<div className="bg-white rounded-xl shadow-md overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
    <h2 className="text-xl font-semibold text-white">Categories</h2>
  </div>
            <table className="w-full text-sm text-gray-700 bg-white rounded-xl shadow-md overflow-hidden">
            <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => requestSort("categoryId")}>
                  Category ID {sortConfig?.key === "categoryId" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                </th>
                <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => requestSort("categoryName")}>
                  Category Name {sortConfig?.key === "categoryName" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
                </th>

                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCategories.length > 0 ? (
                currentCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-2">
                      {category.categoryId}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {category.categoryName}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedCategory(category);
                            setFormData({
                              categoryName: category.categoryName,
                              categoryId: category.categoryId,
                              subCategories: category.subCategories.map(
                                (sub) => ({
                                  subCategoryName: sub.subCategoryName,
                                })
                              ),
                            });
                            setIsUpdateModalOpen(true);
                          }}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full shadow transition-transform transform hover:scale-110"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow transition-transform transform hover:scale-110"
                          title="Delete"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-3 text-gray-500">
                    No categories available.
                  </td>
                </tr>
              )}
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
          {/* Page Numbers */}
          {[...Array(Math.ceil(categories.length / itemsPerPage))].map(
            (_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`mx-1 px-4 py-2 rounded ${currentPage === index + 1
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
              currentPage === Math.ceil(categories.length / itemsPerPage)
            }
          >
            Next
          </button>
        </div>
  

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Product Category</h2>

            <input
              type="text"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              placeholder="Category Id"
              className="border p-2 rounded mb-2 w-full"
            />

            <input
              type="text"
              value={formData.categoryName}
              onChange={(e) =>
                setFormData({ ...formData, categoryName: e.target.value })
              }
              placeholder="Category Name"
              className="border p-2 rounded mb-2 w-full"
            />

            <div className="mt-4">
              <button
                onClick={handleCreate}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Category</h2>

            <input
              type="text"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              placeholder="Category Id"
              className="border p-2 rounded mb-2 w-full"
            />
            <input
              type="text"
              value={formData.categoryName}
              onChange={(e) =>
                setFormData({ ...formData, categoryName: e.target.value })
              }
              placeholder="Category Name"
              className="border p-2 rounded mb-2 w-full"
            />

            <div className="mt-4">
              <button
                onClick={handleUpdate}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mr-2"
              >
                Update
              </button>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTable;
