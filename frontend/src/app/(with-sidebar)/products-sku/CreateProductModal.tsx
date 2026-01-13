import React, { useState, useEffect } from "react";
import axios from "axios";
import CategoryCombobox from "@/components/ui/CategoryCombobox";

interface CreateProductModalProps {
  show: boolean;
  onHide: () => void;
  fetchProducts: () => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({
  show,
  onHide,
  fetchProducts,
}) => {
  const [productName, setProductName] = useState<string>("");
  const [productDescription, setProductDescription] = useState<string>("");
  const [HSN, setHSN] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [gstRate, setGstRate] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<
    {
      id: number;
      categoryName: string;
      subCategories: { id: number; subCategoryName: string }[];
    }[]
  >([]);
  const [subCategories, setSubCategories] = useState<
    { id: number; subCategoryName: string }[]
  >([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:8000/category");
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchSubCategories = (categoryId: string) => {
    const category = categories.find((cat) => cat.id.toString() === categoryId);
    const validSubCategories = category
      ? category.subCategories.filter(
          (sub) => sub.subCategoryName && sub.subCategoryName.trim() !== ""
        )
      : [];
    setSubCategories(validSubCategories);
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubCategoryId(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProduct = {
        productName,
        productDescription,
        HSN,
        unit,
        gstRate: gstRate.toString(), 
        categoryId: parseInt(categoryId, 10),
        subCategoryId: parseInt(subCategoryId, 10),
      };
      await axios.post("http://localhost:8000/products", newProduct);
      fetchProducts();
      alert("Product created successfully");
      resetForm();
      onHide();
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  const handleCancel = () => {
    resetForm();
    onHide();
  };

  const resetForm = () => {
    setProductName("");
    setProductDescription("");
    setHSN("");
    setUnit("");
    setGstRate("");
    setCategoryId("");
    setSubCategoryId("");
    setSubCategories([]);
  };

  return (
    <div
      className={`fixed inset-0 bg-gray-600 text-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity ${
        show
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Add New Product
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">

            <label className="text-sm font-medium text-black">Category</label>
              <CategoryCombobox
                selectedValue={parseInt(categoryId) || 0}
                onSelect={(value) => {
                  const selectedCategoryId = value.toString();
                  setCategoryId(selectedCategoryId);
                  fetchSubCategories(selectedCategoryId);
                  setSubCategoryId("");
                }}
                placeholder="Select Category"
              />
            </div>
  

          <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">
                Subcategory
              </label>
              <select
                className="p-3 border border-gray-300 rounded-md mt-1"
                value={subCategoryId}
                onChange={handleSubCategoryChange}
                required
              >
                <option value="">Select Subcategory</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.subCategoryName}
                  </option>
                ))}
              </select>
            </div>
          
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                className="p-3 border border-gray-300 rounded-md mt-1"
                placeholder="Enter Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Product Description
              </label>
              <input
                type="text"
                className="p-3 border border-gray-300 rounded-md mt-1"
                placeholder="Enter Product Description"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">HSN</label>
              <input
                type="text"
                className="p-3 border border-gray-300 rounded-md mt-1"
                placeholder="Enter HSN"
                value={HSN}
                onChange={(e) => setHSN(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
                Unit
              </label>             
              <select
                className="p-3 border border-gray-300 rounded-md mt-1"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}

                required
              >
                <option value="">Select Unit</option>
                <option value="Nos">Nos</option>
                <option value="Box">Box</option>
                <option value="Pkt">Pkt</option>
                <option value="Mtrs">Mtrs</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </select>
            </div>

            <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">
                GST Rate
              </label>            
                <input
                type="text"
                className="p-3 border border-gray-300 rounded-md mt-1"
                placeholder="Enter GST Rate in %"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                required
              />
            </div>
            </div>
            

            

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;
