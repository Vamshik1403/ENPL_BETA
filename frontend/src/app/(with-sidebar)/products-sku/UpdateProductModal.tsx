import React, { useState, useEffect } from "react";
import axios from "axios";

interface UpdateProductModalProps {
  show: boolean;
  onHide: () => void;
  productId: string;
  fetchProducts: () => void;
}

const UpdateProductModal: React.FC<UpdateProductModalProps> = ({
  show,
  onHide,
  productId,
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
    { id: number; categoryName: string; subCategories: { id: number; subCategoryName: string }[] }[]
  >([]);
  const [subCategories, setSubCategories] = useState<{ id: number; subCategoryName: string }[]>([]);


  // Fetch categories on component mount
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

  useEffect(() => {
    if (categories.length > 0 && categoryId) {
      fetchSubCategories(categoryId);
    }
  }, [categories, categoryId]);
  

  useEffect(() => {
    const fetchProductData = async () => {
      if (productId) {
        try {
          const response = await axios.get(`http://localhost:8000/products/${productId}`);
          const productData = response.data;
          setProductName(productData.productName);
          setProductDescription(productData.productDescription);
          setHSN(productData.HSN);
          setGstRate(productData.gstRate.toString());
          setUnit(productData.unit.toString());
          setCategoryId(productData.categoryId.toString()); // Convert categoryId to string for select
          setSubCategoryId(productData.subCategoryId.toString()); // Convert subCategoryId to string for select
        } catch (error) {
          console.error("Error fetching product data:", error);
        }
      }
    };

    if (show) {
      fetchProductData();
    }
  }, [productId, show]);

  const fetchSubCategories = (categoryId: string) => {
    const category = categories.find((cat) => cat.id.toString() === categoryId);
    setSubCategories(category ? category.subCategories : []);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategoryId = e.target.value;
    setCategoryId(selectedCategoryId);
    fetchSubCategories(selectedCategoryId);
    setSubCategoryId(""); // Reset subcategory selection

  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubCategoryId(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedProduct = {
        productName,
        productDescription,
        HSN,
        unit,
        gstRate,
        categoryId: parseInt(categoryId, 10),
        subCategoryId: parseInt(subCategoryId, 10),
      };
      await axios.put(`http://localhost:8000/products/${productId}`, updatedProduct);

      fetchProducts();
      alert("Product Updated Successfully")
      onHide();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };
  
  const handleCancel = () => {
    onHide();
  };



  return (
    <div
      className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 transition-opacity ${
        show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Update Product</h3>
          <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">Product Name</label>
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
              <label className="text-sm font-medium text-gray-700">Product Description</label>
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
                GST Rate
              </label>            
                <input
                type="text"
                className="p-3 border border-gray-300 rounded-md mt-1"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
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
              </select>
            </div>

           


            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                className="p-3 border border-gray-300 rounded-md mt-1"
                value={categoryId}
                onChange={handleCategoryChange}
                required

              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">Subcategory</label>
              <select
                className="p-3 border border-gray-300 rounded-md mt-1"
                value={subCategoryId}
                onChange={handleSubCategoryChange}
                required
              >
                <option value="">Select Subcategory</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id.toString()}>
                    {subCategory.subCategoryName}
                  </option>
                ))}
              </select>
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
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProductModal;
