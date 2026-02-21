"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, PencilLine, Plus, X } from "lucide-react";
import { VendorCombobox } from "@/components/ui/VendorCombobox";
import { ProductCombobox } from "@/components/ui/ProductCombobox";
import Papa from "papaparse";
import { FaDownload, FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

interface ProductInventory {
    productId: number;
    make: string;
    model: string;
    serialNumber: string;
    macAddress: string;
    warrantyPeriod: string;
    purchaseRate: string;
    noSerialMac?: boolean;
    autoGenerateSerial?: boolean;   
}

interface Inventory {
    id?: number;
    vendorId: number;
    creditTerms?: string;
    invoiceNetAmount?: string;
    gstAmount?: string;
    dueDate?: string;
    invoiceGrossAmount?: string;
    purchaseDate: string;
    dueAmount?: string | number;
    purchaseInvoice: string;
    status?: string;
    duration?: string;
    products: ProductInventory[];
}

interface Vendor {
    id: number;
    vendorName: string;
}

interface Product {
    id: number;
    productId: string;
    productName: string;
    productDescription?: string;
    HSN?: string;
    unit?: string;
    gstRate?: string;
    categoryId: number;
    subCategoryId: number;
    category?: {
        id: number;
        categoryName: string;
        categoryId: string;
    };
    subCategory?: {
        id: number;
        subCategoryName: string;
        subCategoryId: string;
        categoryId: number;
    };
}

const initialFormState: Inventory = {
    vendorId: 0,
    purchaseDate: "",
    dueAmount: 0,
    purchaseInvoice: "",
    status: "In Stock",
    dueDate: "",
    creditTerms: "",
    invoiceNetAmount: "",
    gstAmount: "",
    invoiceGrossAmount: "",
    products: [],
};

const InventoryTable: React.FC = () => {
    const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
    const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [formData, setFormData] = useState<Inventory>(initialFormState);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [productErrors, setProductErrors] = useState<Record<number, Record<string, string>>>({});

    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    } | null>(null);

    const itemsPerPage = 10;

    // Fetch data on component mount
    useEffect(() => {
        fetchInventory();
        fetchProducts();
        fetchVendors();
    }, []);

    // Filter inventory when search query changes
    useEffect(() => {
        handleSearch(searchQuery);
    }, [inventoryList, searchQuery, products, vendors]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:8000/inventory");
            const inventoryWithDuration = res.data.reverse().map((item: Inventory) => {
                const purchaseDate = new Date(item.purchaseDate);
                const today = new Date();
                const diffDays = Math.floor(
                    (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                return {
                    ...item,
                    duration: `${diffDays} day${diffDays !== 1 ? "s" : ""}`,
                };
            });
            setInventoryList(inventoryWithDuration);
            setFilteredInventory(inventoryWithDuration);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            alert("Failed to load inventory. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get("http://localhost:8000/products");
            setProducts(res.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await axios.get("http://localhost:8000/vendors");
            setVendors(res.data);
        } catch (error) {
            console.error("Error fetching vendors:", error);
        }
    };

    const openViewModal = async (inventoryId: number) => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:8000/inventory/${inventoryId}`);
            setSelectedInventory(res.data);
            setIsViewModalOpen(true);
        } catch (error) {
            console.error("Error fetching inventory details:", error);
            alert("Failed to load inventory details.");
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (dataToValidate: Inventory = formData): boolean => {
        const newErrors: Record<string, string> = {};
        const newProductErrors: Record<number, Record<string, string>> = {};

        // Validate inventory fields
        if (!dataToValidate.purchaseInvoice.trim()) {
            newErrors.purchaseInvoice = "Purchase invoice number is required";
        }

        if (!dataToValidate.purchaseDate) {
            newErrors.purchaseDate = "Purchase date is required";
        }

        if (!dataToValidate.vendorId) {
            newErrors.vendorId = "Vendor is required";
        }

        if (!dataToValidate.creditTerms?.trim()) {
            newErrors.creditTerms = "Credit terms are required";
        }

        if (!dataToValidate.invoiceNetAmount?.trim()) {
            newErrors.invoiceNetAmount = "Net amount is required";
        } else if (isNaN(parseFloat(dataToValidate.invoiceNetAmount))) {
            newErrors.invoiceNetAmount = "Please enter a valid number";
        }

        if (!dataToValidate.gstAmount?.trim()) {
            newErrors.gstAmount = "GST amount is required";
        } else if (isNaN(parseFloat(dataToValidate.gstAmount))) {
            newErrors.gstAmount = "Please enter a valid number";
        }

        // Validate products
        if (dataToValidate.products.length === 0) {
            newErrors.products = "At least one product is required";
        }

        dataToValidate.products.forEach((product, index) => {
            const productError: Record<string, string> = {};

            if (!product.productId) {
                productError.productId = "Product is required";
            }

            if (!product.make?.trim()) {
                productError.make = "Make is required";
            }

            if (!product.model?.trim()) {
                productError.model = "Model is required";
            }

            if (!product.noSerialMac) {
                if (!product.serialNumber?.trim() && !product.macAddress?.trim()) {
                    productError.serialNumber = "Either Serial Number or MAC Address is required (or check 'No Serial/MAC')";
                    productError.macAddress = "Either Serial Number or MAC Address is required (or check 'No Serial/MAC')";
                }
            }

            if (!product.warrantyPeriod?.trim()) {
                productError.warrantyPeriod = "Warranty period is required";
            }

            if (!product.purchaseRate?.trim()) {
                productError.purchaseRate = "Purchase rate is required";
            } else if (isNaN(parseFloat(product.purchaseRate))) {
                productError.purchaseRate = "Please enter a valid number";
            }

            if (Object.keys(productError).length > 0) {
                newProductErrors[index] = productError;
            }
        });

        setErrors(newErrors);
        setProductErrors(newProductErrors);

        return Object.keys(newErrors).length === 0 && Object.keys(newProductErrors).length === 0;
    };

    const handleDownloadCSV = () => {
        if (inventoryList.length === 0) {
            alert("No inventory data to download.");
            return;
        }

        try {
            const csvData = inventoryList.flatMap((inventory) => {
                const vendorName =
                    vendors.find((v) => v.id === inventory.vendorId)?.vendorName || "";
                return inventory.products.map((product) => {
                    const productData = products.find(p => p.id === product.productId);
                    return {
                        PurchaseDate: inventory.purchaseDate,
                        PurchaseInvoice: inventory.purchaseInvoice,
                        Vendor: vendorName,
                        Status: inventory.status || "",
                        CreditTerms: inventory.creditTerms || "",
                        DueDate: inventory.dueDate || "",
                        InvoiceNetAmount: inventory.invoiceNetAmount || "",
                        GSTAmount: inventory.gstAmount || "",
                        InvoiceGrossAmount: inventory.invoiceGrossAmount || "",
                        Duration: inventory.duration || "",
                        ProductID: product.productId,
                        ProductCode: productData?.productId || "",
                        ProductName: productData?.productName || "",
                        Category: productData?.category?.categoryName || "",
                        SubCategory: productData?.subCategory?.subCategoryName || "",
                        HSN: productData?.HSN || "",
                        Unit: productData?.unit || "",
                        GSTRate: productData?.gstRate || "",
                        Make: product.make,
                        Model: product.model,
                        SerialNumber: product.serialNumber,
                        MacAddress: product.macAddress,
                        WarrantyPeriod: product.warrantyPeriod,
                        PurchaseRate: product.purchaseRate,
                    };
                });
            });

            const csv = Papa.unparse(csvData);

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `inventory_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert("CSV downloaded successfully!");
        } catch (error) {
            console.error("Error downloading CSV:", error);
            alert("Failed to download CSV. Please try again.");
        }
    };

    const handleSearch = (query: string) => {
        const lowerQuery = query.toLowerCase();

        const filtered = inventoryList.filter((inv) => {
            const vendorName =
                vendors.find((v) => v.id === inv.vendorId)?.vendorName?.toLowerCase() ||
                "";

            const inventoryMatch =
                inv.purchaseInvoice?.toLowerCase().includes(lowerQuery) ||
                inv.purchaseDate?.toLowerCase().includes(lowerQuery) ||
                inv.creditTerms?.toLowerCase().includes(lowerQuery) ||
                inv.invoiceNetAmount?.toLowerCase().includes(lowerQuery) ||
                inv.gstAmount?.toLowerCase().includes(lowerQuery) ||
                inv.invoiceGrossAmount?.toLowerCase().includes(lowerQuery) ||
                inv.status?.toLowerCase().includes(lowerQuery) ||
                vendorName.includes(lowerQuery);

            const productMatch = inv.products.some((product) => {
                const productData = products.find((p) => p.id === product.productId);
                return (
                    productData?.productId?.toLowerCase().includes(lowerQuery) ||
                    productData?.productName?.toLowerCase().includes(lowerQuery) ||
                    productData?.category?.categoryName?.toLowerCase().includes(lowerQuery) ||
                    productData?.subCategory?.subCategoryName?.toLowerCase().includes(lowerQuery) ||
                    productData?.HSN?.toLowerCase().includes(lowerQuery) ||
                    productData?.unit?.toLowerCase().includes(lowerQuery) ||
                    productData?.gstRate?.toLowerCase().includes(lowerQuery) ||
                    product.make?.toLowerCase().includes(lowerQuery) ||
                    product.model?.toLowerCase().includes(lowerQuery) ||
                    product.serialNumber?.toLowerCase().includes(lowerQuery) ||
                    product.macAddress?.toLowerCase().includes(lowerQuery) ||
                    product.warrantyPeriod?.toLowerCase().includes(lowerQuery) ||
                    product.purchaseRate?.toLowerCase().includes(lowerQuery)
                );
            });

            return inventoryMatch || productMatch;
        });

        setFilteredInventory(filtered);
        setCurrentPage(1);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate due date if purchaseDate and creditTerms are present
            const { purchaseDate, creditTerms } = updated;
            if (purchaseDate && creditTerms && !isNaN(Number(creditTerms))) {
                const date = new Date(purchaseDate);
                date.setDate(date.getDate() + parseInt(creditTerms));
                updated.dueDate = date.toISOString().split("T")[0];
            }

            // Auto-calculate Gross Amount: Net Amount + GST Amount
            const netAmount = parseFloat(updated.invoiceNetAmount || "0") || 0;
            const gstAmount = parseFloat(updated.gstAmount || "0") || 0;
            updated.invoiceGrossAmount = (netAmount + gstAmount).toFixed(2);

            // Clear error for this field
            if (errors[name]) {
                setErrors(prevErrors => ({ ...prevErrors, [name]: "" }));
            }

            return updated;
        });
    };

    const handleSave = async () => {
        // ✅ 1) normalize data before validation
        const normalizedFormData = {
            ...formData,
            products: formData.products.map((product) => {
                const serialEmpty = !product.serialNumber?.trim();
                const macEmpty = !product.macAddress?.trim();

                // ✅ If both empty => treat as "No Serial/MAC"
                if (serialEmpty && macEmpty) {
                    return {
                        ...product,
                        noSerialMac: true,
                        serialNumber: "",
                        macAddress: "",
                    };
                }

                return product;
            }),
        };

        // ✅ ensure UI also gets normalized (optional but best)
        setFormData(normalizedFormData);

        // ✅ 2) validate after normalization
        if (!validateForm(normalizedFormData)) {
            alert("Please fix the errors in the form before submitting.");
            return;
        }

        try {
            setSaving(true);

            // ✅ 3) Build payload from normalized data
            const payload = {
                ...normalizedFormData,
                purchaseDate: normalizedFormData.purchaseDate, // already YYYY-MM-DD
               dueAmount: normalizedFormData.dueAmount 
    ? Number(normalizedFormData.dueAmount)
    : 0,

                products: normalizedFormData.products.map((product) => ({
                    productId: product.productId,
                    make: product.make,
                    model: product.model,

                    // ✅ send NULL not ""
                    serialNumber: product.noSerialMac ? null : product.serialNumber?.trim() || null,
                    macAddress: product.noSerialMac ? null : product.macAddress?.trim() || null,

                    warrantyPeriod: product.warrantyPeriod,
                    purchaseRate: product.purchaseRate,

                    autoGenerateSerial: !!product.noSerialMac,
                })),

            };

            if (normalizedFormData.id) {
                await axios.put(
                    `http://localhost:8000/inventory/${normalizedFormData.id}`,
                    payload
                );
                alert("Inventory updated successfully!");
            } else {
                await axios.post("http://localhost:8000/inventory", payload);
                alert("Inventory created successfully!");
            }

            setFormData(initialFormState);
            setErrors({});
            setProductErrors({});
            setIsModalOpen(false);
            fetchInventory();
        } catch (error: any) {
            console.error("Save error:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Something went wrong! Please try again.";
            alert(errorMessage);
        } finally {
            setSaving(false);
        }
    };


    const openModal = (data?: Inventory) => {
        if (data) {
            const clonedProducts = (data.products || []).map((p: any) => ({
                ...p,
                noSerialMac: !!p.autoGenerateSerial,   // ✅ map backend to frontend checkbox
            }));

            setFormData({
                ...data,
                purchaseDate: data.purchaseDate ? data.purchaseDate.slice(0, 10) : "",
                dueDate: data.dueDate ? data.dueDate.slice(0, 10) : "",
                products: clonedProducts,
            });
        } else {
            setFormData(initialFormState);
        }

        setErrors({});
        setProductErrors({});
        setIsModalOpen(true);
    };



    // Sorting logic
    const sortedInventory = [...filteredInventory].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;

        const getValue = (obj: any, key: string) => {
            switch (key) {
                case "vendor":
                    return vendors.find((v) => v.id === obj.vendorId)?.vendorName || "";
                case "purchaseDate":
                case "purchaseInvoice":
                case "status":
                case "duration":
                    return obj[key] || "";
                case "productName":
                    const productA = obj.products[0];
                    const productB = b.products[0];
                    return (
                        products.find((p) => p.id === productA?.productId)?.productName || ""
                    ).localeCompare(
                        products.find((p) => p.id === productB?.productId)?.productName || ""
                    );
                case "category":
                    const catA = products.find(p => p.id === obj.products[0]?.productId)?.category?.categoryName || "";
                    const catB = products.find(p => p.id === b.products[0]?.productId)?.category?.categoryName || "";
                    return catA.localeCompare(catB);
                case "subCategory":
                    const subA = products.find(p => p.id === obj.products[0]?.productId)?.subCategory?.subCategoryName || "";
                    const subB = products.find(p => p.id === b.products[0]?.productId)?.subCategory?.subCategoryName || "";
                    return subA.localeCompare(subB);
                default:
                    return "";
            }
        };

        const aValue = getValue(a, key).toLowerCase?.() || "";
        const bValue = getValue(b, key).toLowerCase?.() || "";

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
    });

    const paginatedInventory = sortedInventory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

    const handleSort = (key: string) => {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <FaSort className="ml-1 text-gray-400" />;
        return sortConfig.direction === "asc" ?
            <FaSortUp className="ml-1 text-blue-600" /> :
            <FaSortDown className="ml-1 text-blue-600" />;
    };

    const addProductRow = () => {
        setFormData(prev => ({
            ...prev,
            products: [
                ...prev.products,
                {
                    productId: 0,
                    make: "",
                    model: "",
                    serialNumber: "",
                    macAddress: "",
                    warrantyPeriod: "",
                    purchaseRate: "",
                    noSerialMac: false,
                },
            ],
        }));
    };

    const removeProductRow = (index: number) => {
        const updated = [...formData.products];
        updated.splice(index, 1);
        setFormData({ ...formData, products: updated });

        // Clear errors for this product
        setProductErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });
    };

    const updateProductField = (index: number, field: keyof ProductInventory, value: any) => {
        const updated = [...formData.products];
        (updated[index] as any)[field] = value;
        setFormData({ ...formData, products: updated });

        // Clear error for this field
        if (productErrors[index]?.[field]) {
            setProductErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors[index]) {
                    newErrors[index] = { ...newErrors[index] };
                    delete newErrors[index][field];
                    if (Object.keys(newErrors[index]).length === 0) {
                        delete newErrors[index];
                    }
                }
                return newErrors;
            });
        }
    };

    return (
        <div className="w-full min-w-0 px-4 py-4 sm:px-6 text-black">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Inventory</h1>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center px-4 sm:px-0">
                <button
                    onClick={() => openModal()}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform duration-300 w-full md:w-auto flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Add Inventory
                </button>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <FaSearch />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by invoice, serial, vendor, category, HSN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                        />
                    </div>
                    <button
                        onClick={handleDownloadCSV}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
                        title="Download CSV"
                        disabled={inventoryList.length === 0}
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
                    <div className="bg-white rounded-xl shadow-md w-full min-w-0">
                        <div className="w-full overflow-x-auto">
                            <table className="min-w-[1100px] w-max text-sm text-gray-700">
                                <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                                    <tr>
                                        {[
                                            { label: "Product Name", key: "productName" },
                                            { label: "Vendor", key: "vendor" },
                                            { label: "Status", key: "status" },
                                            { label: "Age", key: "duration" },
                                            { label: "Actions", key: "" },
                                        ].map((col) => (
                                            <th
                                                key={col.key || "actions"}
                                                className="p-4 border border-gray-300 text-left cursor-pointer select-none whitespace-nowrap"
                                                onClick={() => col.key && handleSort(col.key)}
                                            >
                                                <div className="flex items-center">
                                                    {col.label}
                                                    {col.key && getSortIcon(col.key)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedInventory.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                {searchQuery
                                                    ? "No inventory found matching your search."
                                                    : "No inventory items found. Add your first inventory item!"}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedInventory.flatMap((inv) => {
                                            // ✅ If no products exist, still show 1 row for inventory
                                            if (!inv.products || inv.products.length === 0) {
                                                return (
                                                    <tr key={`inv-${inv.id}`} className="border-b hover:bg-gray-50">
                                                        <td className="p-4 border border-gray-300 text-gray-400" colSpan={2}>
                                                            No products found
                                                        </td>
                                                        <td className="p-4 border border-gray-300">
                                                            {inv.status || "N/A"}
                                                        </td>
                                                        <td className="p-4 border border-gray-300">
                                                            {inv.duration || "N/A"}
                                                        </td>
                                                        <td className="p-4 border border-gray-300">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => openViewModal(inv.id!)}
                                                                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg shadow"
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => openModal(inv)}
                                                                    className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg shadow"
                                                                    title="Edit"
                                                                >
                                                                    <PencilLine size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            // ✅ If products exist, show them normally
                                            return inv.products.map((product, index) => {
                                                const productData = products.find((p) => p.id === product.productId);
                                                const vendorName = vendors.find((v) => v.id === inv.vendorId)?.vendorName || "N/A";

                                                return (
                                                    <tr key={`${inv.id}-${product.productId}-${index}`} className="border-b hover:bg-gray-50">
                                                        <td className="p-4 border border-gray-300 whitespace-nowrap">
                                                            {productData?.productName || "N/A"}
                                                        </td>
                                                        <td className="p-4 border border-gray-300 whitespace-nowrap">
                                                            {vendorName}
                                                        </td>
                                                        <td className="p-4 border border-gray-300">
                                                            {inv.status || "N/A"}
                                                        </td>
                                                        <td className="p-4 border border-gray-300">
                                                            {inv.duration || "N/A"}
                                                        </td>
                                                        <td className="p-4 border border-gray-300">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => openViewModal(inv.id!)}
                                                                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg shadow"
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => openModal(inv)}
                                                                    className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg shadow"
                                                                    title="Edit"
                                                                >
                                                                    <PencilLine size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {filteredInventory.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 px-4 sm:px-0">
                            <div className="text-sm text-gray-600 whitespace-nowrap">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

            {/* View Modal (Read Only) */}
            {isViewModalOpen && selectedInventory && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col mx-2 sm:mx-0">
                        <div className="p-4 sm:p-6 md:p-8">
                            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
                                <h3 className="text-xl sm:text-2xl font-bold text-blue-700">
                                    📋 Inventory Details
                                </h3>
                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="overflow-y-auto max-h-[60vh] pr-2">
                                {/* Inventory Details Section */}
                                <div className="mb-6 sm:mb-8">
                                    <h4 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 pb-2 border-b">
                                        Inventory Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="space-y-1">
                                            <span className="text-xs sm:text-sm font-medium text-gray-500">Purchase Invoice No</span>
                                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                                                {selectedInventory.purchaseInvoice || "N/A"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs sm:text-sm font-medium text-gray-500">Purchase Date</span>
                                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                                                {selectedInventory.purchaseDate ? new Date(selectedInventory.purchaseDate).toLocaleDateString() : "N/A"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs sm:text-sm font-medium text-gray-500">Vendor</span>
                                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                                                {vendors.find(v => v.id === selectedInventory.vendorId)?.vendorName || "N/A"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs sm:text-sm font-medium text-gray-500">Credit Terms (Days)</span>
                                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                                                {selectedInventory.creditTerms || "N/A"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs sm:text-sm font-medium text-gray-500">Due Date</span>
                                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                                                {selectedInventory.dueDate ? new Date(selectedInventory.dueDate).toLocaleDateString() : "N/A"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs sm:text-sm font-medium text-gray-500">Status</span>
                                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                                                {selectedInventory.status || "N/A"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs sm:text-sm font-medium text-gray-500">Net Amount</span>
                                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                                                ₹{selectedInventory.invoiceNetAmount || "0.00"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs sm:text-sm font-medium text-gray-500">GST Amount</span>
                                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                                                ₹{selectedInventory.gstAmount || "0.00"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs sm:text-sm font-medium text-gray-500">Gross Amount</span>
                                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                                                ₹{selectedInventory.invoiceGrossAmount || "0.00"}
                                            </p>
                                        </div>
                                       
                                    </div>
                                </div>

                                {/* Products Section */}
                                <div className="mb-6 sm:mb-8">
                                    <h4 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4">
                                        Products ({selectedInventory.products?.length || 0})
                                    </h4>

                                    {(!selectedInventory.products || selectedInventory.products.length === 0) ? (
                                        <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
                                            No products found
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedInventory.products.map((product, index) => {
                                                const productData = products.find(p => p.id === product.productId);
                                                const vendorName = vendors.find(v => v.id === selectedInventory.vendorId)?.vendorName || "N/A";

                                                return (
                                                    <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                                                        <div className="mb-3">
                                                            <h5 className="font-semibold text-gray-700 text-sm sm:text-base">
                                                                Product {index + 1}: {productData?.productName || "N/A"}
                                                            </h5>
                                                            <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm text-gray-500">
                                                                <span>Category: {productData?.category?.categoryName || "N/A"}</span>
                                                                <span>•</span>
                                                                <span>Sub-Category: {productData?.subCategory?.subCategoryName || "N/A"}</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-medium text-gray-500">Product Code</span>
                                                                <p className="font-medium text-gray-800">{productData?.productId || "N/A"}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-medium text-gray-500">Make</span>
                                                                <p className="font-medium text-gray-800">{product.make || "N/A"}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-medium text-gray-500">Model</span>
                                                                <p className="font-medium text-gray-800">{product.model || "N/A"}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-medium text-gray-500">Serial Number</span>
                                                                <p className="font-medium text-gray-800">
                                                                    {product.noSerialMac || product.autoGenerateSerial ? "Auto-generated" : (product.serialNumber || "N/A")}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-medium text-gray-500">MAC Address</span>
                                                                <p className="font-medium text-gray-800">
                                                                    {product.noSerialMac || product.autoGenerateSerial ? "Auto-generated" : (product.macAddress || "N/A")}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-medium text-gray-500">Warranty Period</span>
                                                                <p className="font-medium text-gray-800">{product.warrantyPeriod || "N/A"} days</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-medium text-gray-500">Purchase Rate</span>
                                                                <p className="font-medium text-gray-800">₹{product.purchaseRate || "0.00"}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-medium text-gray-500">HSN Code</span>
                                                                <p className="font-medium text-gray-800">{productData?.HSN || "N/A"}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-medium text-gray-500">GST Rate</span>
                                                                <p className="font-medium text-gray-800">{productData?.gstRate || "N/A"}%</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t flex justify-end">
                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md text-sm sm:text-base"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col mx-2 sm:mx-0">
                        <div className="p-4 sm:p-6 md:p-8">
                            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
                                <h3 className="text-xl sm:text-2xl font-bold text-indigo-700">
                                    {formData.id ? "✏️ Edit Inventory" : "➕ Add New Inventory"}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                    disabled={saving}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="overflow-y-auto max-h-[60vh] pr-2">
                                {errors.products && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-600 font-medium">{errors.products}</p>
                                    </div>
                                )}

                                {/* Inventory Details Section */}
                                <div className="mb-6 sm:mb-8">
                                    <h4 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 pb-2 border-b">
                                        Inventory Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Purchase Invoice No <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="purchaseInvoice"
                                                placeholder="Enter invoice number"
                                                value={formData.purchaseInvoice}
                                                onChange={handleChange}
                                                className={`w-full p-2 sm:p-3 border ${errors.purchaseInvoice ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                            />
                                            {errors.purchaseInvoice && (
                                                <p className="mt-1 text-sm text-red-600">{errors.purchaseInvoice}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Purchase Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="purchaseDate"
                                                value={formData.purchaseDate}
                                                onChange={handleChange}
                                                className={`w-full p-2 sm:p-3 border ${errors.purchaseDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                            />
                                            {errors.purchaseDate && (
                                                <p className="mt-1 text-sm text-red-600">{errors.purchaseDate}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Vendor <span className="text-red-500">*</span>
                                            </label>
                                            <VendorCombobox
                                                selectedValue={formData.vendorId}
                                                onSelect={(val) => {
                                                    setFormData(prev => ({ ...prev, vendorId: val }));
                                                    if (errors.vendorId) {
                                                        setErrors(prev => ({ ...prev, vendorId: "" }));
                                                    }
                                                }}
                                                placeholder="Select Vendor"
                                            />
                                            {errors.vendorId && (
                                                <p className="mt-1 text-sm text-red-600">{errors.vendorId}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Credit Terms (Days) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="creditTerms"
                                                placeholder="Enter credit terms in days"
                                                value={formData.creditTerms}
                                                onChange={handleChange}
                                                className={`w-full p-2 sm:p-3 border ${errors.creditTerms ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                            />
                                            {errors.creditTerms && (
                                                <p className="mt-1 text-sm text-red-600">{errors.creditTerms}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Due Date
                                            </label>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={formData.dueDate}
                                                onChange={handleChange}
                                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                readOnly
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Net Amount <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="invoiceNetAmount"
                                                placeholder="Enter net amount"
                                                value={formData.invoiceNetAmount}
                                                onChange={handleChange}
                                                className={`w-full p-2 sm:p-3 border ${errors.invoiceNetAmount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                            />
                                            {errors.invoiceNetAmount && (
                                                <p className="mt-1 text-sm text-red-600">{errors.invoiceNetAmount}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                GST Amount <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="gstAmount"
                                                placeholder="Enter GST amount"
                                                value={formData.gstAmount}
                                                onChange={handleChange}
                                                className={`w-full p-2 sm:p-3 border ${errors.gstAmount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                            />
                                            {errors.gstAmount && (
                                                <p className="mt-1 text-sm text-red-600">{errors.gstAmount}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Gross Amount
                                            </label>
                                            <input
                                                type="text"
                                                name="invoiceGrossAmount"
                                                placeholder="Auto-calculated"
                                                value={formData.invoiceGrossAmount}
                                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-50"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Products Section */}
                                <div className="mb-6 sm:mb-8">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                                        <h4 className="text-base sm:text-lg font-semibold text-blue-900">
                                            Products
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={addProductRow}
                                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
                                        >
                                            <Plus size={14} />
                                            Add Product
                                        </button>
                                    </div>

                                    {formData.products.map((product, index) => {
                                        const selectedProduct = products.find(p => p.id === product.productId);
                                        return (
                                            <div key={index} className="mb-4 p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                                                    <div>
                                                        <h5 className="font-medium text-gray-700 text-sm sm:text-base">Product {index + 1}</h5>
                                                        {selectedProduct && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <span className="mr-2">
                                                                    Category: {selectedProduct.category?.categoryName || "N/A"}
                                                                </span>
                                                                <span>
                                                                    Sub-Category: {selectedProduct.subCategory?.subCategoryName || "N/A"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {formData.products.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProductRow(index)}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Remove product"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-start mb-3 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={product.noSerialMac || false}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            updateProductField(index, "noSerialMac", checked);

                                                            if (checked) {
                                                                updateProductField(index, "serialNumber", "");
                                                                updateProductField(index, "macAddress", "");
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                                        id={`noSerialMac-${index}`}
                                                    />
                                                    <label htmlFor={`noSerialMac-${index}`} className="ml-2 text-xs sm:text-sm font-medium text-gray-700">
                                                        Product does not have Serial Number or MAC Address
                                                    </label>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Product <span className="text-red-500">*</span>
                                                        </label>
                                                        <ProductCombobox
                                                            selectedValue={product.productId}
                                                            onSelect={(value) => updateProductField(index, 'productId', value)}
                                                            placeholder="Select Product"
                                                        />
                                                        {productErrors[index]?.productId && (
                                                            <p className="mt-1 text-sm text-red-600">{productErrors[index]?.productId}</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Make <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter make"
                                                            value={product.make}
                                                            onChange={(e) => updateProductField(index, 'make', e.target.value)}
                                                            className={`w-full p-2 border ${productErrors[index]?.make ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                                        />
                                                        {productErrors[index]?.make && (
                                                            <p className="mt-1 text-sm text-red-600">{productErrors[index]?.make}</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Model <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter model"
                                                            value={product.model}
                                                            onChange={(e) => updateProductField(index, 'model', e.target.value)}
                                                            className={`w-full p-2 border ${productErrors[index]?.model ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                                        />
                                                        {productErrors[index]?.model && (
                                                            <p className="mt-1 text-sm text-red-600">{productErrors[index]?.model}</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Serial Number
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter serial number"
                                                            value={product.serialNumber || ""}
                                                            onChange={(e) => updateProductField(index, 'serialNumber', e.target.value)}
                                                            disabled={product.noSerialMac}
                                                            className={`w-full p-2 border ${productErrors[index]?.serialNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${product.noSerialMac ? 'bg-gray-100' : ''}`}
                                                        />
                                                        {productErrors[index]?.serialNumber && (
                                                            <p className="mt-1 text-sm text-red-600">{productErrors[index]?.serialNumber}</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            MAC Address
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter MAC address"
                                                            value={product.macAddress || ""}
                                                            onChange={(e) => updateProductField(index, 'macAddress', e.target.value)}
                                                            disabled={product.noSerialMac}
                                                            className={`w-full p-2 border ${productErrors[index]?.macAddress ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${product.noSerialMac ? 'bg-gray-100' : ''}`}
                                                        />
                                                        {productErrors[index]?.macAddress && (
                                                            <p className="mt-1 text-sm text-red-600">{productErrors[index]?.macAddress}</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Warranty Period (Days) <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter warranty in days"
                                                            value={product.warrantyPeriod}
                                                            onChange={(e) => updateProductField(index, 'warrantyPeriod', e.target.value)}
                                                            className={`w-full p-2 border ${productErrors[index]?.warrantyPeriod ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                                        />
                                                        {productErrors[index]?.warrantyPeriod && (
                                                            <p className="mt-1 text-sm text-red-600">{productErrors[index]?.warrantyPeriod}</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Purchase Rate <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter purchase rate"
                                                            value={product.purchaseRate}
                                                            onChange={(e) => updateProductField(index, "purchaseRate", e.target.value)}
                                                            className={`w-full p-2 border ${productErrors[index]?.purchaseRate ? "border-red-500" : "border-gray-300"
                                                                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                                        />

                                                        {productErrors[index]?.purchaseRate && (
                                                            <p className="mt-1 text-sm text-red-600">{productErrors[index]?.purchaseRate}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2 text-sm sm:text-base"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            {formData.id ? "Updating..." : "Creating..."}
                                        </>
                                    ) : (
                                        formData.id ? "Update Inventory" : "Create Inventory"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryTable;