"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import { FaEdit, FaEye, FaSearch, FaTrashAlt } from "react-icons/fa";

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
  contacts: [{ ...emptyContact }],
  bankDetails: [{ ...emptyBank }],
};

const VendorTable: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [gstPdfFile, setGstPdfFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Vendor>(initialFormState);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const itemsPerPage = 5;

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/vendors");
      setVendors(response.data.reverse());
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      alert("Failed to load vendors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    [
      vendor.vendorName,
      vendor.vendorCode,
      vendor.products?.join(", "),
      vendor.gstNo,
      vendor.state,
      vendor.businessType,
    ].some(
      (field) =>
        field &&
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
      alert("Failed to load categories. Please refresh the page.");
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchCategories();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields from Prisma model
    const requiredFields = [
      { key: "vendorName", label: "Vendor Name" },
      { key: "registerAddress", label: "Register Address" },
      { key: "gstNo", label: "GST Number" },
      { key: "emailId", label: "Email ID" },
      { key: "creditTerms", label: "Credit Terms" },
      { key: "creditLimit", label: "Credit Limit" },
    ];

    requiredFields.forEach(({ key, label }) => {
      const value = formData[key as keyof Vendor];
      if (!value || (typeof value === "string" && !value.trim())) {
        newErrors[key] = `${label} is required`;
      }
    });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.emailId && !emailRegex.test(formData.emailId)) {
      newErrors.emailId = "Please enter a valid email address";
    }

    // GST validation (basic format check)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (formData.gstNo && !gstRegex.test(formData.gstNo)) {
      newErrors.gstNo = "Please enter a valid GST number";
    }

    // Validate at least one contact
    const validContacts = formData.contacts.filter(
      (c) => c.firstName.trim() || c.lastName.trim() || c.contactPhoneNumber.trim()
    );
    if (validContacts.length === 0) {
      newErrors.contacts = "At least one contact is required";
    }

    // Validate each contact
    formData.contacts.forEach((contact, index) => {
      if (contact.firstName.trim() || contact.lastName.trim() || contact.contactPhoneNumber.trim()) {
        if (!contact.firstName.trim()) {
          newErrors[`contacts[${index}].firstName`] = "First name is required";
        }
        if (!contact.lastName.trim()) {
          newErrors[`contacts[${index}].lastName`] = "Last name is required";
        }
        if (!contact.contactPhoneNumber.trim()) {
          newErrors[`contacts[${index}].contactPhoneNumber`] = "Phone number is required";
        }
        if (contact.contactEmailId && !emailRegex.test(contact.contactEmailId)) {
          newErrors[`contacts[${index}].contactEmailId`] = "Invalid email format";
        }
      }
    });

    // Validate bank details (optional but if provided, validate)
    formData.bankDetails.forEach((bank, index) => {
      if (bank.accountNumber.trim() || bank.ifscCode.trim() || bank.bankName.trim()) {
        if (!bank.accountNumber.trim()) {
          newErrors[`bankDetails[${index}].accountNumber`] = "Account number is required";
        }
        if (!bank.ifscCode.trim()) {
          newErrors[`bankDetails[${index}].ifscCode`] = "IFSC code is required";
        }
        if (!bank.bankName.trim()) {
          newErrors[`bankDetails[${index}].bankName`] = "Bank name is required";
        }
        // IFSC code format validation
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (bank.ifscCode && !ifscRegex.test(bank.ifscCode)) {
          newErrors[`bankDetails[${index}].ifscCode`] = "Invalid IFSC code format";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: string,
    index?: number,
    type?: string
  ) => {
    const { name, value } = e.target;

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Handle contact fields
    if (type === "contact" && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        contacts: prev.contacts.map((contact, i) =>
          i === index ? { ...contact, [name]: value || "" } : contact
        ),
      }));
      return;
    }

    // Handle bank fields
    if (type === "bank" && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        bankDetails: prev.bankDetails.map((bank, i) =>
          i === index ? { ...bank, [name]: value || "" } : bank
        ),
      }));
      return;
    }

    // Handle normal fields - ensure value is never null
    setFormData((prev) => ({
      ...prev,
      [name]: value || ""
    }));
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { ...emptyContact }],
    }));

    // Clear contact errors when adding new contact
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('contacts[')) delete newErrors[key];
      });
      return newErrors;
    });
  };

  const removeContact = (index: number) => {
    if (formData.contacts.length === 1) {
      alert("At least one contact is required");
      return;
    }

    const updated = [...formData.contacts];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, contacts: updated }));
  };

  const addBank = () => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: [...prev.bankDetails, { ...emptyBank }],
    }));
  };

  const removeBank = (index: number) => {
    const updated = [...formData.bankDetails];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, bankDetails: updated }));
  };

  const handleView = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsViewModalOpen(true);
  };

  const handleEdit = (vendor: Vendor) => {
    // Ensure all fields have string values, not null/undefined
    const cleanedVendor: Vendor = {
      ...vendor,
      vendorName: vendor.vendorName || "",
      registerAddress: vendor.registerAddress || "",
      gstNo: vendor.gstNo || "",
      businessType: vendor.businessType || "",
      state: vendor.state || "",
      city: vendor.city || "",
      emailId: vendor.emailId || "",
      website: vendor.website || "",
      creditTerms: vendor.creditTerms || "",
      creditLimit: vendor.creditLimit || "",
      remark: vendor.remark || "",
      products: vendor.products || [],
      contacts: vendor.contacts?.map(contact => ({
        ...emptyContact,
        ...contact,
        title: contact.title || "",
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        contactPhoneNumber: contact.contactPhoneNumber || "",
        contactEmailId: contact.contactEmailId || "",
        designation: contact.designation || "",
        department: contact.department || "",
        landlineNumber: contact.landlineNumber || "",
      })) || [{ ...emptyContact }],
      bankDetails: vendor.bankDetails?.map(bank => ({
        ...emptyBank,
        ...bank,
        accountNumber: bank.accountNumber || "",
        ifscCode: bank.ifscCode || "",
        bankName: bank.bankName || "",
        branchName: bank.branchName || "",
      })) || [{ ...emptyBank }],
    };

    setFormData(cleanedVendor);
    setErrors({});
    setGstPdfFile(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const confirm = window.confirm(
      "Are you sure you want to delete this vendor? This action cannot be undone."
    );
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:8000/vendors/${id}`);
      alert("Vendor deleted successfully!");
      fetchVendors();
    } catch (err: any) {
      console.error("Error deleting vendor:", err);
      alert(err.response?.data?.message || "Failed to delete vendor.");
    }
  };

  const ReadBox = ({ label, value }: { label: string; value?: any }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-800 min-h-[42px] flex items-center">
        <span className="text-sm break-words">{value ?? "N/A"}</span>
      </div>
    </div>
  );

  const ReadRichBox = ({
    label,
    value,
    rows = 4,
  }: {
    label: string;
    value?: any;
    rows?: number;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <textarea
        value={value ?? "N/A"}
        readOnly
        rows={rows}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-800 text-sm resize-none"
      />
    </div>
  );


  const handleCreate = async () => {
    if (!validateForm()) {
      alert("Please fill all details before submit.");
      return;
    }

    try {
      const payload = new FormData();

      // Add all required fields
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

      // Filter out empty contacts
      const validContacts = formData.contacts.filter(
        (c) => c.firstName.trim() || c.lastName.trim() || c.contactPhoneNumber.trim()
      );
      payload.append("contacts", JSON.stringify(validContacts));

      // Filter out empty bank details
      const validBanks = formData.bankDetails.filter(
        (b) => b.accountNumber.trim() || b.ifscCode.trim() || b.bankName.trim()
      );
      payload.append("bankDetails", JSON.stringify(validBanks));

      if (gstPdfFile) {
        payload.append("gstCertificate", gstPdfFile);
      }

      let response;
      if (formData.id) {
        response = await axios.put(
          `http://localhost:8000/vendors/${formData.id}`,
          payload,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        response = await axios.post("http://localhost:8000/vendors", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      alert(
        formData.id
          ? "Vendor updated successfully!"
          : "Vendor created successfully!"
      );
      setFormData(initialFormState);
      setGstPdfFile(null);
      setErrors({});
      setIsCreateModalOpen(false);
      fetchVendors();
    } catch (err: any) {
      console.error("Error saving vendor:", err);
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to save vendor. Please try again.";
      alert(errorMessage);
    }
  };

  const getFieldValue = (fieldName: string): string => {
    const value = formData[fieldName as keyof Vendor];
    return value !== null && value !== undefined ? String(value) : "";
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen -mt-10 text-black">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Vendors</h1>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <button
          onClick={() => {
            setFormData(initialFormState);
            setErrors({});
            setGstPdfFile(null);
            setIsCreateModalOpen(true);
          }}
          className="bg-gradient-to-r cursor-pointer from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform duration-300 w-full md:w-auto flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Vendor
        </button>

        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <FaSearch />
          </span>
          <input
            type="text"
            placeholder="Search by name, GST, products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto" style={{ maxWidth: "100vw" }}>
            <table className="w-full text-sm text-gray-700 bg-white rounded-xl shadow-md overflow-hidden">
              <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                <tr>
                  <th className="p-4 border">Vendor ID</th>
                  <th className="p-4 border">Vendor Type</th>
                  <th className="p-4 border">Company Name</th>
                  <th className="p-4 border">GST No.</th>
                  <th className="p-4 border">State</th>
                  <th className="p-4 border">City</th>
                  <th className="p-4 border">Products</th>
                  <th className="p-4 border">GST Certificate</th>
                  <th className="p-4 border">Credit Terms</th>
                  <th className="p-4 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentVendors.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      No vendors found. {searchQuery && "Try a different search."}
                    </td>
                  </tr>
                ) : (
                  currentVendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 border font-mono">{vendor.vendorCode || 'N/A'}</td>
                      <td className="p-4 border">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {vendor.businessType || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 border font-medium">{vendor.vendorName || 'N/A'}</td>
                      <td className="p-4 border font-mono">{vendor.gstNo || 'N/A'}</td>
                      <td className="p-4 border">{vendor.state || 'N/A'}</td>
                      <td className="p-4 border">{vendor.city || 'N/A'}</td>
                      <td className="p-4 border">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(vendor.products) && vendor.products.length > 0 ? (
                            vendor.products.slice(0, 3).map((p, idx) => (
                              <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">No products</span>
                          )}
                          {Array.isArray(vendor.products) && vendor.products.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{vendor.products.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border">
                        {vendor.gstpdf ? (
                          <a
                            href={`http://localhost:8000/gst/${vendor.gstpdf}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            <span className="text-red-500">📄</span> View PDF
                          </a>
                        ) : (
                          <span className="text-gray-400">No PDF</span>
                        )}
                      </td>
                      <td className="p-4 border font-medium">{vendor.creditTerms || 'N/A'}</td>
                      <td className="p-4 border">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleView(vendor)}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg shadow transition-all hover:shadow-lg hover:scale-105"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg shadow transition-all hover:shadow-lg hover:scale-105"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id)}
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

          {filteredVendors.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVendors.length)} of {filteredVendors.length} vendors
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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



      {isViewModalOpen && selectedVendor && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">

            {/* Sticky Header */}
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-6 py-4 border-b">
              <div>
                <h3 className="text-2xl font-bold text-blue-700">Vendor Details</h3>
                <p className="text-sm text-gray-500">
                  {selectedVendor.vendorCode} • {selectedVendor.vendorName}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedVendor(null);
                }}
                className="text-gray-500 hover:text-gray-800 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

              {/* TOP GRID: Left basic info / Right summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left = Details (2 columns inside) */}
                <div className="lg:col-span-2 border rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">
                    Basic Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadBox label="Vendor Code" value={selectedVendor.vendorCode} />
                    <ReadBox label="Vendor Name" value={selectedVendor.vendorName} />

                    <ReadBox label="GST No" value={selectedVendor.gstNo} />
                    <ReadBox label="Email" value={selectedVendor.emailId} />

                    <ReadBox label="Business Type" value={selectedVendor.businessType} />
                    <ReadBox label="Website" value={selectedVendor.website} />

                    <ReadBox label="State" value={selectedVendor.state} />
                    <ReadBox label="City" value={selectedVendor.city} />
                  </div>

                  {/* Rich boxes */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadRichBox label="Registered Address" value={selectedVendor.registerAddress} rows={4} />
                    <ReadRichBox label="Remark" value={selectedVendor.remark} rows={4} />
                  </div>
                </div>

                {/* Right = Compact summary + attachment */}
                <div className="border rounded-xl p-5 space-y-5">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2 border-b pb-2">
                    Finance & Docs
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <ReadBox label="Credit Terms" value={selectedVendor.creditTerms} />
                    <ReadBox label="Credit Limit" value={selectedVendor.creditLimit} />
                  </div>

                  {/* Products compact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Products</label>
                    <div className="min-h-[70px] border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-wrap gap-2">
                      {Array.isArray(selectedVendor.products) && selectedVendor.products.length > 0 ? (
                        selectedVendor.products.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No products</span>
                      )}
                    </div>
                  </div>

                  {/* Attachment — FIXED compact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Certificate
                    </label>

                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {selectedVendor.gstpdf ? selectedVendor.gstpdf : "No file uploaded"}
                        </p>
                        <p className="text-xs text-gray-500">Document attachment</p>
                      </div>

                      {selectedVendor.gstpdf && (
                        <a
                          href={`http://localhost:8000/gst/${selectedVendor.gstpdf}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                        >
                          View PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="border rounded-xl p-5">
                <h4 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">
                  Contacts
                </h4>

                {selectedVendor.contacts?.length ? (
                  <div className="space-y-4">
                    {selectedVendor.contacts.map((c, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                        <p className="font-semibold text-gray-800 mb-3">
                          Contact {idx + 1}: {c.firstName} {c.lastName}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <ReadBox label="Title" value={c.title} />
                          <ReadBox label="First Name" value={c.firstName} />
                          <ReadBox label="Last Name" value={c.lastName} />

                          <ReadBox label="Phone" value={c.contactPhoneNumber} />
                          <ReadBox label="Email" value={c.contactEmailId} />
                          <ReadBox label="Designation" value={c.designation} />

                          <ReadBox label="Department" value={c.department} />
                          <ReadBox label="Landline" value={c.landlineNumber} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No contacts available</p>
                )}
              </div>

              {/* Bank Details */}
              <div className="border rounded-xl p-5">
                <h4 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">
                  Bank Details
                </h4>

                {selectedVendor.bankDetails?.length ? (
                  <div className="space-y-4">
                    {selectedVendor.bankDetails.map((b, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                        <p className="font-semibold text-gray-800 mb-3">
                          Bank {idx + 1}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(b)
                            .filter(([key]) => !["id", "vendorId"].includes(key))
                            .map(([key, value]) => (
                              <ReadBox
                                key={key}
                                label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                                value={String(value ?? "")}
                              />
                            ))}


                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No bank details available</p>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedVendor(null);
                }}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {isCreateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h3 className="text-2xl font-bold text-indigo-700">
                {formData.id ? "✏️ Edit Vendor" : "➕ Create New Vendor"}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2">
              {errors.contacts && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-medium">{errors.contacts}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-blue-900 border-b pb-2">Basic Information</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="businessType"
                      value={getFieldValue("businessType")}
                      onChange={(e) => handleInputChange(e, "businessType")}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  {[
                    { field: "vendorName", label: "Vendor Name", required: true },
                    { field: "registerAddress", label: "Registered Address", required: true },
                    { field: "state", label: "State", required: true },
                    { field: "city", label: "City", required: true },
                    { field: "gstNo", label: "GST Number", required: true },
                    { field: "emailId", label: "Email ID", required: true, type: "email" },
                    { field: "creditTerms", label: "Credit Terms", required: true },
                    { field: "creditLimit", label: "Credit Limit", required: true },
                    { field: "website", label: "Website", required: false },
                    { field: "remark", label: "Remarks", required: false },
                  ].map(({ field, label, required, type = "text" }) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label} {required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={type}
                        name={field}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        value={getFieldValue(field)}
                        onChange={(e) => handleInputChange(e, field)}
                        className={`w-full border ${errors[field] ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                      {errors[field] && (
                        <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* GST Certificate & Products Section */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 border-b pb-2 mb-4">
                      GST Certificate
                    </h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        id="gst-pdf"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type === "application/pdf") {
                              setGstPdfFile(file);
                            } else {
                              alert("Please upload only PDF files.");
                            }
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="gst-pdf" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <span className="text-4xl mb-2">📄</span>
                          <p className="text-sm text-gray-600">
                            {gstPdfFile ? gstPdfFile.name : "Click to upload GST Certificate (PDF)"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Max size: 5MB</p>
                        </div>
                      </label>
                    </div>
                    {!gstPdfFile && formData.gstpdf && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1">Existing certificate:</p>
                        <a
                          href={`http://localhost:8000/gst/${formData.gstpdf}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <span>📄</span> View GST Certificate
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 border-b pb-2 mb-4">
                      Product Categories
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2">
                      {categories.map((category) => (
                        <label
                          key={category}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
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
                            className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm">{category}</span>
                        </label>
                      ))}
                    </div>
                    {formData.products.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1">Selected ({formData.products.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.products.map((product) => (
                            <span key={product} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contacts Section */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-blue-900">
                    Contacts
                  </h4>
                  <button
                    type="button"
                    onClick={addContact}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus size={16} /> Add Contact
                  </button>
                </div>

                {formData.contacts.map((contact, i) => (
                  <div key={i} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-medium text-gray-700">Contact {i + 1}</h5>
                      {formData.contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(i)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove Contact
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.keys(emptyContact).map((key) => {
                        const fieldName = key as keyof VendorContact;
                        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
                        const required = ["firstName", "lastName", "contactPhoneNumber"].includes(key);

                        return (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {label} {required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              name={key}
                              placeholder={`Enter ${label.toLowerCase()}`}
                              value={contact[fieldName] || ""}
                              onChange={(e) => handleInputChange(e, key, i, "contact")}
                              className={`w-full border ${errors[`contacts[${i}].${key}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors[`contacts[${i}].${key}`] && (
                              <p className="mt-1 text-xs text-red-600">{errors[`contacts[${i}].${key}`]}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bank Details Section */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-blue-900">
                    Bank Details
                  </h4>
                  <button
                    type="button"
                    onClick={addBank}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus size={16} /> Add Bank
                  </button>
                </div>

                {formData.bankDetails.map((bank, i) => (
                  <div key={i} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-medium text-gray-700">Bank Account {i + 1}</h5>
                      {formData.bankDetails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBank(i)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove Bank
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.keys(emptyBank).map((key) => {
                        const fieldName = key as keyof BankDetail;
                        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
                        const required = ["accountNumber", "ifscCode", "bankName"].includes(key);

                        return (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {label} {required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              name={key}
                              placeholder={`Enter ${label.toLowerCase()}`}
                              value={bank[fieldName] || ""}
                              onChange={(e) => handleInputChange(e, key, i, "bank")}
                              className={`w-full border ${errors[`bankDetails[${i}].${key}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors[`bankDetails[${i}].${key}`] && (
                              <p className="mt-1 text-xs text-red-600">{errors[`bankDetails[${i}].${key}`]}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setErrors({});
                }}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
              >
                {formData.id ? "Update Vendor" : "Create Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorTable;