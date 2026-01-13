"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import { FaEdit, FaSearch, FaTrashAlt } from "react-icons/fa";

interface VendorContact {
  title: string;
  firstName: string;
  lastName: string;
  contactPhoneNumber: string;
  contactEmailId: string;
  designation: string;
  department: string;
  landlineNumber: string;
}

interface BankDetail {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
}

interface Vendor {
  id?: number;
  vendorCode?: string;
  vendorName: string;
  registerAddress: string;
  gstNo: string;
  businessType?: string;
  state: string;
  city: string;
  emailId: string;
  gstpdf?: string;
  website: string;
  products: string[];
  creditTerms: string;
  creditLimit: string;
  remark: string;
  contacts: VendorContact[];
  bankDetails: BankDetail[];
}

const emptyContact: VendorContact = {
  title: "",
  firstName: "",
  lastName: "",
  contactPhoneNumber: "",
  contactEmailId: "",
  designation: "",
  department: "",
  landlineNumber: "",
};

const emptyBank: BankDetail = {
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  branchName: "",
};

const initialFormState: Vendor = {
  vendorName: "",
  registerAddress: "",
  gstNo: "",
  businessType: "",
  state: "",
  city: "",
  emailId: "",
  gstpdf: "",
  website: "",
  products: [],
  creditTerms: "",
  creditLimit: "",
  remark: "",
  contacts: [emptyContact],
  bankDetails: [emptyBank],
};

const VendorTable: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [gstPdfFile, setGstPdfFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Vendor>(initialFormState);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchVendors = async () => {
    const response = await axios.get("http://localhost:8000/vendors");
    setVendors(response.data.reverse());
  };

  const filteredVendors = vendors.filter((vendor) =>
    [
      vendor.vendorName,
      vendor.vendorCode,
      vendor.products,
      vendor.gstNo,
      vendor.state,
      vendor.businessType,
    ].some(
      (field) =>
        typeof field === "string" &&
        field.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVendors = filteredVendors.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:8000/category");
      const names = response.data.map((c: any) => c.categoryName);
      setCategories(names);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchCategories();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    _field: string,
    index?: number,
    type?: string
  ) => {
    const { name, value } = e.target;

    if (type === "contact" && index !== undefined) {
      const updated = [...formData.contacts];
      updated[index][name as keyof VendorContact] = value;
      setFormData((prev) => ({ ...prev, contacts: updated }));
    } else if (type === "bank" && index !== undefined) {
      const updated = [...formData.bankDetails];
      updated[index][name as keyof BankDetail] = value;
      setFormData((prev) => ({ ...prev, bankDetails: updated }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addContact = () =>
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, emptyContact],
    }));

  const removeContact = (index: number) => {
    const updated = [...formData.contacts];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, contacts: updated }));
  };

  const addBank = () =>
    setFormData((prev) => ({
      ...prev,
      bankDetails: [...prev.bankDetails, emptyBank],
    }));

  const removeBank = (index: number) => {
    const updated = [...formData.bankDetails];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, bankDetails: updated }));
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData(vendor);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    const confirm = window.confirm(
      "Are you sure you want to delete this vendor?"
    );
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:8000/vendors/${id}`);
      alert("Vendor deleted successfully!");
      fetchVendors();
    } catch (err) {
      console.error("Error deleting vendor:", err);
      alert("Failed to delete vendor.");
    }
  };

 const handleCreate = async () => {
  // ✅ Validate required fields
  const requiredFields = [
    "vendorName",
    "registerAddress",
    "gstNo",
    "state",
    "city",
    "emailId",
    "creditTerms",
    "creditLimit",
  ];

  const missingFields = requiredFields.filter(
    (field) => !formData[field as keyof Vendor]?.toString().trim()
  );

  if (missingFields.length > 0) {
    alert(`Please fill out the following fields: ${missingFields.join(", ")}`);
    return;
  }

  // ✅ Validate contacts
  const validContacts = formData.contacts.filter(
    (c) =>
      c.firstName.trim() || c.lastName.trim() || c.contactPhoneNumber.trim()
  );
  if (validContacts.length === 0) {
    alert("Please add at least one valid contact.");
    return;
  }

  // ✅ Validate bank details
  const validBanks = formData.bankDetails.filter(
    (b) => b.accountNumber.trim() || b.ifscCode.trim() || b.bankName.trim()
  );

  try {
    // ✅ Construct FormData for both create and update
    const payload = new FormData();

    payload.append("vendorName", formData.vendorName);
    payload.append("registerAddress", formData.registerAddress);
    payload.append("gstNo", formData.gstNo);
    payload.append("businessType", formData.businessType || "");
    payload.append("state", formData.state);
    payload.append("city", formData.city);
    payload.append("emailId", formData.emailId);
    payload.append("website", formData.website);
    payload.append("creditTerms", formData.creditTerms);
    payload.append("creditLimit", formData.creditLimit);
    payload.append("remark", formData.remark);
    payload.append("products", JSON.stringify(formData.products));
    payload.append("contacts", JSON.stringify(validContacts));
    payload.append("bankDetails", JSON.stringify(validBanks));

    if (gstPdfFile) {
      payload.append("gstCertificate", gstPdfFile);
    }

    // ✅ Choose endpoint based on whether it's create or update
    if (formData.id) {
      await axios.put(
        `http://localhost:8000/vendors/${formData.id}`,
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    } else {
      await axios.post("http://localhost:8000/vendors", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    // ✅ Success feedback
    alert(
      formData.id
        ? "Vendor updated successfully!"
        : "Vendor created successfully!"
    );
    setFormData(initialFormState);
    setGstPdfFile(null); // Reset file
    setIsCreateModalOpen(false);
    fetchVendors();
  } catch (err) {
    console.error("Error saving vendor:", err);
    alert("Failed to save vendor. Please try again.");
  }
};

  return (
  <div className="p-8 bg-gray-50 min-h-screen -mt-10 text-black">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Vendors</h1>
    </div>

    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

  <button
    onClick={() => {
      setFormData(initialFormState); // clear form
      setIsCreateModalOpen(true);
    }}
    className="bg-gradient-to-r cursor-pointer from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl shadow-md hover:scale-105 transition-transform duration-300 w-full md:w-auto"
  >
    Add Vendor  
  </button>
  
  <div className="relative w-full md:w-64">
    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
      <FaSearch />
    </span>
    <input
      type="text"
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
    />
  </div>
</div>


      <div className="overflow-x-auto" style={{ maxWidth: "100vw" }}>
        <table className="w-full text-sm text-gray-700 bg-white rounded-xl shadow-md overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
            <tr>
              <th className="p-2 border">Vendor ID</th>
              <th className="p-2 border">Vendor Type</th>
              <th className="p-2 border">Company Name</th>
              <th className="p-2 border">GST No.</th>
              <th className="p-2 border">State</th>
              <th className="p-2 border">City</th>
              <th className="p-2 border">Products</th>
              <th className="p-2 border">GST Certificate</th>
              <th className="p-2 border">Credit Terms</th>

              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentVendors.map((vendor) => (
              <tr key={vendor.id} className="border-b">
                <td className="p-2 border">{vendor.vendorCode}</td>
                <td className="p-2 border">{vendor.businessType}</td>
                <td className="p-2 border">{vendor.vendorName || 'N/A'}</td>
                <td className="p-2 border">{vendor.gstNo}</td>
                <td className="p-2 border">{vendor.state}</td>
                <td className="p-2 border">{vendor.city}</td>
                <td className="p-2 border  text-yellow-800">
                  {Array.isArray(vendor.products)
                    ? vendor.products.map((p) => p).join(", ")
                    : "N/A"}
                </td>
                <td className="p-2 border text-blue-900">
                  {vendor.gstpdf ? (
                    <a
                      href={`http://localhost:8000/gst/${vendor.gstpdf}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF
                    </a>
                  ) : (
                    "No PDF"
                  )}
                </td>
                <td className="p-2 border">{vendor.creditTerms}</td>

                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(vendor)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full shadow transition-transform transform hover:scale-110"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow transition-transform transform hover:scale-110"
                    title="Delete"
                  >
                    <FaTrashAlt />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 border rounded ${page === currentPage ? "bg-blue-500 text-white" : "bg-gray-100"
              } hover:bg-gray-200`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {isCreateModalOpen && (
         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
<div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl animate-fadeIn">
            <div className="overflow-auto max-h-[90vh]">
                <h3 className="text-xl font-semibold mb-4 text-indigo-600">
                  {formData.id ? "Edit Vendor" : "Create Vendor"}
                </h3>



                <div className="mt-4">
                  <label className="font-semibold block mb-2">
                    Business Type
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={(e) => handleInputChange(e, "businessType")}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select Business Type</option>
                    <option value="OEM">OEM</option>
                    <option value="ND">ND</option>
                    <option value="RD">RD</option>
                    <option value="Stockist">Stockist</option>
                    <option value="Reseller">Reseller</option>
                    <option value="System Integrator">System Integrator</option>
                    <option value="Service Provider">Service Provider</option>
                    <option value="Consultant">Consultant</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                  {[
                    "vendorName",
                    "registerAddress",
                    "state",
                    "city",
                    "gstNo",
                    "emailId",
                    "creditTerms",
                    "creditLimit",
                    "website",
                    "remark",
                  ].map((field) => (
                    <input
                      key={field}
                      name={field}
                      placeholder={field.replace(/([A-Z])/g, " $1")}
                      value={(formData as any)[field]}
                      onChange={(e) => handleInputChange(e, field)}
                      className="border p-2 rounded"
                    />
                  ))}
                </div>

                <div className="mt-4">
  <label className="font-semibold block mb-2">
    GST Certificate (PDF)
  </label>

  {/* File input for uploading new PDF */}
  <input
    type="file"
    accept="application/pdf"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file && file.type === "application/pdf") {
        setGstPdfFile(file);
      } else {
        alert("Please upload a valid PDF file.");
      }
    }}
    className="block w-full border p-2 rounded"
  />

  {/* Show newly selected file name */}
  {gstPdfFile && (
    <p className="text-sm text-green-700 mt-1">{gstPdfFile.name}</p>
  )}

  {/* Show existing GST PDF link if editing and PDF exists */}
  {!gstPdfFile && formData.gstpdf && (
    <a
      href={`http://localhost:8000/gst/${formData.gstpdf}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline text-sm mt-2 block"
    >
      View existing GST certificate
    </a>
  )}
</div>


                <div className="mt-6">
                  <label className="font-semibold block mb-2">
                    Product Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {categories.map((category) => (
                      <label
                        key={category}
                        className="inline-flex items-center"
                      >
                        <input
                          type="checkbox"
                          value={category}
                          checked={formData.products.includes(category)}
                          onChange={(e) => {
                            const { checked, value } = e.target;
                            setFormData((prev) => ({
                              ...prev,
                              products: checked
                                ? [...prev.products, value]
                                : prev.products.filter((p) => p !== value),
                            }));
                          }}
                          className="mr-2"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Contacts</h4>
                    <button onClick={addContact} className="text-blue-600">
                      <Plus size={20} />
                    </button>
                  </div>
                  {formData.contacts.map((contact, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 items-center"
                    >
                      {Object.keys(emptyContact).map((key) => (
                        <input
                          key={key}
                          name={key}
                          placeholder={key.replace(/([A-Z])/g, " $1")}
                          value={(contact as any)[key]}
                          onChange={(e) =>
                            handleInputChange(e, key, i, "contact")
                          }
                          className="border p-2 rounded"
                        />
                      ))}
                      <button
                        onClick={() => removeContact(i)}
                        className="text-red-600"
                      >
                        -
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Bank Details</h4>
                    <button onClick={addBank} className="text-blue-600">
                      <Plus size={20} />
                    </button>
                  </div>
                  {formData.bankDetails.map((bank, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 items-center"
                    >
                      {Object.keys(emptyBank).map((key) => (
                        <input
                          key={key}
                          name={key}
                          placeholder={key.replace(/([A-Z])/g, " $1")}
                          value={(bank as any)[key]}
                          onChange={(e) => handleInputChange(e, key, i, "bank")}
                          className="border p-2 rounded"
                        />
                      ))}
                      <button
                        onClick={() => removeBank(i)}
                        className="text-red-800 "
                      >
                        -
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded bg-gray-500 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                  >
                    {formData.id ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default VendorTable;
