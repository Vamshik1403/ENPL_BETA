"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { PencilLine } from "lucide-react";
import { VendorCombobox } from "@/components/ui/VendorCombobox";
import { ProductCombobox } from "@/components/ui/ProductCombobox";
import Papa from "papaparse";
import { FaDownload, FaSearch } from "react-icons/fa";

interface ProductInventory {
    productId: number;
    make: string;
    model: string;
    serialNumber: string;
    macAddress: string;
    warrantyPeriod: string;
    purchaseRate: string;
    noSerialMac?: boolean; // New field to indicate if serial/mac is not requiredx
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
    productName: string;
}

const initialFormState: Inventory = {
    vendorId: 0,
    purchaseDate: "",
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
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    } | null>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [formData, setFormData] = useState<Inventory>(initialFormState);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

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

    useEffect(() => {
        fetchInventory();
        fetchProducts();
        fetchVendors();
    }, []);

    useEffect(() => {
        handleSearch(searchQuery);
    }, [inventoryList, searchQuery]);

    const fetchInventory = async () => {
        const res = await axios.get("http://localhost:8000/inventory");
        setInventoryList(res.data.reverse());
        const inventoryWithDuration = res.data.map((item: Inventory) => {
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
    };

    const fetchProducts = async () => {
        const res = await axios.get("http://localhost:8000/products");
        setProducts(res.data);
    };

    const fetchVendors = async () => {
        const res = await axios.get("http://localhost:8000/vendors");
        setVendors(res.data);
    };

    const handleDownloadCSV = () => {
        if (inventoryList.length === 0) return;

        const csvData = inventoryList.flatMap((inventory) => {
            const vendorName =
                vendors.find((v) => v.id === inventory.vendorId)?.vendorName || "";
            return inventory.products.map((product) => ({
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
                Make: product.make,
                Model: product.model,
                SerialNumber: product.serialNumber,
                MacAddress: product.macAddress,
                WarrantyPeriod: product.warrantyPeriod,
                PurchaseRate: product.purchaseRate,
            }));
        });

        const csv = Papa.unparse(csvData);

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "inventory.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSearch = (query: string) => {
        const lowerQuery = query.toLowerCase();

        const filtered = inventoryList.filter((inv) => {
            const vendorName =
                vendors.find((v) => v.id === inv.vendorId)?.vendorName?.toLowerCase() ||
                "";

            const inventoryMatch =
                inv.purchaseInvoice?.toLowerCase().includes(lowerQuery) ||
                inv.products.some((product) =>
                    product.serialNumber?.toLowerCase().includes(lowerQuery)
                ) ||
                inv.purchaseDate?.toLowerCase().includes(lowerQuery) ||
                inv.creditTerms?.toLowerCase().includes(lowerQuery) ||
                inv.invoiceNetAmount?.toLowerCase().includes(lowerQuery) ||
                inv.gstAmount?.toLowerCase().includes(lowerQuery) ||
                inv.invoiceGrossAmount?.toLowerCase().includes(lowerQuery) ||
                inv.status?.toLowerCase().includes(lowerQuery) ||
                vendorName.includes(lowerQuery);

            const productMatch = inv.products.some((product) => {
                return (
                    products
                        .find((p) => p.id === product.productId)
                        ?.productName?.toLowerCase()
                        .includes(lowerQuery) ||
                    product.model?.toLowerCase().includes(lowerQuery) ||
                    product.make?.toLowerCase().includes(lowerQuery) ||
                    product.serialNumber?.toLowerCase().includes(lowerQuery) ||
                    product.macAddress?.toLowerCase().includes(lowerQuery) ||
                    product.warrantyPeriod?.toLowerCase().includes(lowerQuery) ||
                    product.purchaseRate?.toLowerCase().includes(lowerQuery)
                );
            });

            return inventoryMatch || productMatch;
        });

        setFilteredInventory(filtered);
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
                updated.dueDate = date.toISOString().split("T")[0]; // format as YYYY-MM-DD
            }

            // Auto-calculate Gross Amount Net Amount + GST Amount
            const netAmount = parseFloat(updated.invoiceNetAmount || "0") || 0;
            const gstAmount = parseFloat(updated.gstAmount || "0") || 0;
            updated.invoiceGrossAmount = (netAmount + gstAmount).toFixed(2);

            return updated;
        });
    };

    const handleSave = async () => {
        // Validation loop
        for (let i = 0; i < formData.products.length; i++) {
            const p = formData.products[i];
            const hasSerial = p.serialNumber && p.serialNumber.trim() !== "";
            const hasMac = p.macAddress && p.macAddress.trim() !== "";
            const isChecked = p.noSerialMac === true;

            if (!hasSerial && !hasMac && !isChecked) {
                alert(
                    `You must have Serial Number, MAC Address, or check the box for auto-generate.`
                );
                return;
            }
        }

        try {
            const payload = {
                ...formData,
                products: formData.products.map((product) => ({
                    productId: product.productId,
                    make: product.make,
                    model: product.model,
                    serialNumber: product.serialNumber,
                    macAddress: product.macAddress,
                    warrantyPeriod: product.warrantyPeriod,
                    purchaseRate: product.purchaseRate,
                    autoGenerateSerial: product.noSerialMac, // send to backend
                })),
            };

            if (formData.id) {
                await axios.put(`http://localhost:8000/inventory/${formData.id}`, payload);
                alert("Inventory updated successfully!");
            } else {
                await axios.post("http://localhost:8000/inventory", payload);
                alert("Inventory created successfully!");
            }

            setFormData(initialFormState);
            setIsModalOpen(false);
            fetchInventory();
        } catch (err) {
            console.error("Save error:", err);
            alert("Something went wrong!");
        }
    };

    const openModal = (data?: Inventory) => {
        if (data) {
            const clonedProducts = (data.products || []).map((p) => ({ ...p }));
            setFormData({ ...data, products: clonedProducts });
        } else {
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen -mt-10 text-black">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Inventory</h1>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

                <button
                    onClick={() => openModal()}
                    className="px-6 py-3 rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Add Inventory
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <FaSearch />
                        </span>
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                        />
                    </div>

                    <button
                        onClick={handleDownloadCSV}
                        title="Download CSV"
                        className="p-2 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                        <FaDownload />
                    </button>
                </div>

            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-700 bg-white rounded-xl shadow-md overflow-hidden">
                    <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                        <tr>
                            {[
                                { label: "Product Name", key: "productName" },
                                { label: "Make", key: "make" },
                                { label: "Model", key: "model" },
                                { label: "Serial No", key: "serialNumber" },
                                { label: "MAC Address", key: "macAddress" },
                                { label: "Warranty Period(Days)", key: "warrantyPeriod" },
                                { label: "Purchase Rate", key: "purchaseRate" },
                                { label: "Purchased From", key: "vendor" },
                                { label: "Purchased Date", key: "purchaseDate" },
                                { label: "P.Invoice No", key: "purchaseInvoice" },
                                { label: "Status", key: "status" },
                                { label: "Age", key: "duration" },
                                { label: "Actions", key: "" },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    className="p-2 border text-center cursor-pointer select-none"
                                    onClick={() => col.key && handleSort(col.key)}
                                >
                                    {col.label}
                                    {sortConfig?.key === col.key && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedInventory.map((inv) =>
                            inv.products.map((product, index) => (
                                <tr key={`${inv.id}-${product.serialNumber}-${index}`}>
                                    <td className="p-2 border">
                                        {products.find((p) => p.id === product.productId)
                                            ?.productName || "N/A"}
                                    </td>
                                    <td className="p-2 border text-center">{product.make}</td>
                                    <td className="p-2 border text-center">{product.model}</td>
                                    <td className="p-2 border text-center">
                                        {product.serialNumber || "N/A"}
                                    </td>
                                    <td className="p-2 border text-center">
                                        {product.macAddress || "N/A"}
                                    </td>
                                    <td className="p-2 border text-center">
                                        {product.warrantyPeriod}
                                    </td>
                                    <td className="p-2 border text-center">
                                        {product.purchaseRate}
                                    </td>
                                    <td className="p-2 border text-center">
                                        {vendors.find((v) => v.id === inv.vendorId)?.vendorName}
                                    </td>
                                    <td className="p-2 border">
                                        {inv.purchaseDate?.slice(0, 10)}
                                    </td>
                                    <td className="p-2 border">{inv.purchaseInvoice}</td>
                                    <td className="p-2 border">{inv.status}</td>
                                    <td className="p-2 border">{inv.duration}</td>
                                    <td className="p-2 border text-center space-x-2">
                                        <button
                                            onClick={() => openModal(inv)}
                                            className="text-blue-600"
                                        >
                                            <PencilLine size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center mt-4 gap-2">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-600 text-white" : ""
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
                <button
                    onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0  bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 mt-6 rounded-lg shadow-lg max-w-4xl w-full overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">
                            {formData.id ? "Edit Inventory" : "Add Inventory"}
                        </h2>

                        {/* Inventory Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex flex-col">
                                <label className="block font-semibold mb-2">
                                    Purchase Invoice No
                                </label>
                                <input
                                    type="text"
                                    name="purchaseInvoice"
                                    placeholder=" Purchase Invoice No"
                                    value={formData.purchaseInvoice}
                                    onChange={handleChange}
                                    className="border p-2 rounded"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block font-semibold mb-2">
                                    Purchase Invoice Date
                                </label>
                                <input
                                    type="date"
                                    name="purchaseDate"
                                    value={formData.purchaseDate}
                                    onChange={handleChange}
                                    className="border p-2 rounded"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="block font-semibold mb-2">Vendor Name</label>
                                <VendorCombobox
                                    selectedValue={formData.vendorId}
                                    onSelect={(val) =>
                                        setFormData((prev) => ({ ...prev, vendorId: val }))
                                    }
                                    placeholder="Select Vendor"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block font-semibold mb-2">Credit Terms</label>
                                <input
                                    type="text"
                                    name="creditTerms"
                                    placeholder="Credit Terms"
                                    value={formData.creditTerms}
                                    onChange={handleChange}
                                    className="border p-2 rounded"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block font-semibold mb-2">Due Date</label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    className="border p-2 rounded"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="block font-semibold mb-2">Net Amount</label>
                                <input
                                    type="text"
                                    name="invoiceNetAmount"
                                    placeholder="Net Amount"
                                    value={formData.invoiceNetAmount}
                                    onChange={handleChange}
                                    className="border p-2 rounded"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="block font-semibold mb-2">GST Amount</label>
                                <input
                                    type="text"
                                    name="gstAmount"
                                    placeholder="GST Amount"
                                    value={formData.gstAmount}
                                    onChange={handleChange}
                                    className="border p-2 rounded"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block font-semibold mb-2">Gross Amount</label>
                                <input
                                    type="text"
                                    name="invoiceGrossAmount"
                                    placeholder="Gross Amount"
                                    value={formData.invoiceGrossAmount}
                                    onChange={handleChange}
                                    className="border p-2 rounded"
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Products Section */}
                        <div className="mb-4">
                            {/* Product Inputs (Dynamic Rows) */}
                            <div className="col-span-2">
                                <label className="block font-semibold mb-2">Products</label>
                                {formData.products.map((product, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 border p-2 rounded relative"
                                    >
                                        <div className="flex items-center col-span-2 md:col-span-3 mt-1">
                                            <input
                                                type="checkbox"
                                                checked={product.noSerialMac || false}
                                                onChange={(e) => {
                                                    const updated = [...formData.products];
                                                    updated[index].noSerialMac = e.target.checked;
                                                    setFormData({ ...formData, products: updated });
                                                }}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label className="ml-2 text-sm font-medium text-gray-700">
                                                Check if product does not have Serial or MAC
                                            </label>
                                        </div>
                                        <div className="w-full min-w-0">
                                            <ProductCombobox
                                                selectedValue={product.productId}
                                                onSelect={(value) =>
                                                    setFormData((prev) => {
                                                        const updated = [...prev.products];
                                                        updated[index].productId = value;
                                                        return { ...prev, products: updated };
                                                    })
                                                }
                                                placeholder="Select Product"
                                            />
                                        </div>

                                        <input
                                            type="text"
                                            name="make"
                                            placeholder="Make"
                                            value={product.make}
                                            onChange={(e) => {
                                                const updated = [...formData.products];
                                                updated[index].make = e.target.value;
                                                setFormData({ ...formData, products: updated });
                                            }}
                                            className="border p-2 rounded w-full min-w-0"
                                        />

                                        <input
                                            type="text"
                                            name="model"
                                            placeholder="Model"
                                            value={product.model}
                                            onChange={(e) => {
                                                const updated = [...formData.products];
                                                updated[index].model = e.target.value;
                                                setFormData({ ...formData, products: updated });
                                            }}
                                            className="border p-2 rounded"
                                        />
                                        <input
                                            type="text"
                                            name="serialNumber"
                                            placeholder="Serial Number"
                                            value={product.serialNumber}
                                            onChange={(e) => {
                                                const updated = [...formData.products];
                                                updated[index].serialNumber = e.target.value;
                                                setFormData({ ...formData, products: updated });
                                            }}
                                            className="border p-2 rounded"
                                        />

                                        <input
                                            type="text"
                                            name="macAddress"
                                            placeholder="MAC Address"
                                            value={product.macAddress}
                                            onChange={(e) => {
                                                const updated = [...formData.products];
                                                updated[index].macAddress = e.target.value;
                                                setFormData({ ...formData, products: updated });
                                            }}
                                            className="border p-2 rounded"
                                        />

                                        <input
                                            type="text"
                                            name="warrantyPeriod"
                                            placeholder="Warranty Period (Days)"
                                            value={product.warrantyPeriod}
                                            onChange={(e) => {
                                                const updated = [...formData.products];
                                                updated[index].warrantyPeriod = e.target.value;
                                                setFormData({ ...formData, products: updated });
                                            }}
                                            className="border p-2 rounded"
                                        />

                                        <input
                                            type="text"
                                            name="purchaseRate"
                                            placeholder="Purchase Rate"
                                            value={product.purchaseRate}
                                            onChange={(e) => {
                                                const updated = [...formData.products];
                                                updated[index].purchaseRate = e.target.value;
                                                setFormData({ ...formData, products: updated });
                                            }}
                                            className="border p-2 rounded"
                                        />
                                        {/* Remove Product Row Button */}
                                        <button
                                            onClick={() => {
                                                const updated = [...formData.products];
                                                updated.splice(index, 1);
                                                setFormData({ ...formData, products: updated });
                                            }}
                                            className="absolute top-0 right-0 text-red-600 font-bold px-2"
                                            type="button"
                                            title="Remove product"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}

                                {/* Add New Product Button */}
                                <button
                                    type="button"
                                    className="text-sm px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    onClick={() =>
                                        setFormData((prev) => ({
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
                                                },
                                            ],
                                        }))
                                    }
                                >
                                    + Add Product
                                </button>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryTable;
