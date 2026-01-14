"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { CustomerCombobox } from "@/components/ui/CustomerCombobox";
import { VendorCombobox } from "@/components/ui/VendorCombobox";
import SerialCombobox from "@/components/ui/SerialCombobox";
import MacAddressCombobox from "@/components/ui/MacAddressCombobox";
import Papa from "papaparse";
import { FaDownload, FaEdit, FaSearch, FaTrashAlt, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { Plus, X } from "lucide-react";

interface Vendor {
  id: number;
  vendorName: string;
}

interface Site {
  id: number;
  siteName: string;
  addressBookId: number;
}

interface Customer {
  id: number;
  customerName: string;
  sites: Site[];
}

interface Product {
  id: number;
  productName: string;
}

interface InventoryItem {
  id: number;
  serialNumber: string;
  macAddress: string;
  productId: number;
  product: Product;
  vendorId: number;
  vendor: Vendor;
}

interface FormData {
  id?: number;
  deliveryType: string;
  refNumber?: string;
  salesOrderNo?: string;
  quotationNo?: string;
  purchaseInvoiceNo?: string;
  customerId?: number;
  siteId?: number | undefined;
  productId?: number;
  inventoryId?: number;
  vendorId?: number;
}

interface DeliveryItem {
  serialNumber: string;
  macAddress: string;
  productId: number;
  inventoryId?: number;
  productName?: string;
  vendorId?: number;
  customerId?: number;
  siteId?: number;
}

const initialFormData: FormData = {
  deliveryType: "",
  refNumber: "",
  salesOrderNo: "",
  quotationNo: "",
  purchaseInvoiceNo: "",
  customerId: 0,
  siteId: 0,
  vendorId: 0,
  productId: 0,
};

const MaterialDeliveryForm: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [items, setItems] = useState<DeliveryItem[]>([
    { serialNumber: "", macAddress: "", productId: 0 },
  ]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryList, setDeliveryList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<number, Record<string, string>>>({});

  const isSaleOrDemo =
    formData.deliveryType === "Sale" || formData.deliveryType === "Demo";
  const isPurchaseReturn = formData.deliveryType === "Purchase Return";

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    handleSearch(search);
  }, [deliveryList, search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCustomers(),
        fetchVendors(),
        fetchProducts(),
        fetchInventory(),
        fetchDeliveries(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    const res = await axios.get("http://localhost:8000/address-book");
    setCustomers(res.data);
  };

  const fetchVendors = async () => {
    const res = await axios.get("http://localhost:8000/vendors");
    setVendors(res.data);
  };

  const fetchProducts = async () => {
    const res = await axios.get("http://localhost:8000/products");
    setProducts(res.data);
  };

  const fetchInventory = async () => {
    const res = await axios.get("http://localhost:8000/inventory");
    const flattened = res.data.flatMap((inv: any) =>
      (inv.products || []).map((prod: any) => ({
        id: prod.id,
        serialNumber: prod.serialNumber,
        macAddress: prod.macAddress,
        productId: prod.productId,
        product: prod.product,
        vendorId: inv.vendorId,
      }))
    );
    setInventory(flattened);
    setInventoryList(flattened);
  };

  const fetchDeliveries = async () => {
    const res = await axios.get("http://localhost:8000/material-delivery");
    setDeliveryList(res.data.reverse());
  };

  useEffect(() => {
    const selectedCustomer = customers.find(
      (c) => c.id === formData.customerId
    );

    if (selectedCustomer) {
      setSites(selectedCustomer.sites || []);
    } else {
      setSites([]);
    }

    setFormData((prev) => ({ ...prev, siteId: undefined }));
  }, [formData.customerId, customers]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newItemErrors: Record<number, Record<string, string>> = {};

    // Validate form fields
    if (!formData.deliveryType) {
      newErrors.deliveryType = "Delivery type is required";
    }

    if (isSaleOrDemo && !formData.customerId) {
      newErrors.customerId = "Customer is required for Sale or Demo";
    }

    if (isSaleOrDemo && formData.customerId && !formData.siteId) {
      newErrors.siteId = "Site is required when customer is selected";
    }

    if (isPurchaseReturn && !formData.vendorId) {
      newErrors.vendorId = "Vendor is required for Purchase Return";
    }

    // Validate items
    if (items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    items.forEach((item, index) => {
      const itemError: Record<string, string> = {};
      
      if (!item.serialNumber?.trim() && !item.macAddress?.trim()) {
        itemError.serialNumber = "Either Serial Number or MAC Address is required";
        itemError.macAddress = "Either Serial Number or MAC Address is required";
      }

      if (!item.productId) {
        itemError.productId = "Product is required";
      }

      if (Object.keys(itemError).length > 0) {
        newItemErrors[index] = itemError;
      }
    });

    setErrors(newErrors);
    setItemErrors(newItemErrors);
    
    return Object.keys(newErrors).length === 0 && Object.keys(newItemErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "customerId" || name === "vendorId"
          ? parseInt(value)
          : name === "siteId" && value === ""
          ? undefined
          : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleDownloadCSV = () => {
    if (deliveryList.length === 0) {
      alert("No delivery data to download.");
      return;
    }

    try {
      const allSites: Site[] = customers.flatMap((c) => c.sites || []);

      const csvData = deliveryList.map((delivery) => {
        const customerName =
          customers.find((c) => c.id === delivery.customerId)?.customerName ||
          "N/A";

        const siteName =
          allSites.find((s) => s.id === delivery.siteId)?.siteName || "N/A";

        const vendorName =
          vendors.find((v) => v.id === delivery.vendorId)?.vendorName || "N/A";

        const productDetails = (delivery.materialDeliveryItems || [])
          .map((item: any) => {
            const inventoryItem = inventory.find(
              (inv) => inv.id === item.inventoryId
            );

            const productName =
              products.find((p) => p.id === item.productId)?.productName ||
              inventoryItem?.product?.productName ||
              "N/A";

            const serial =
              inventoryItem?.serialNumber || item.serialNumber || "N/A";
            const mac = inventoryItem?.macAddress || item.macAddress || "N/A";

            return `${productName} (SN: ${serial}, MAC: ${mac})`;
          })
          .join("; ");

        return {
          DeliveryType: delivery.deliveryType || "N/A",
          RefNumber: delivery.refNumber ? `="${delivery.refNumber}"` : "N/A",
          SalesOrderNo: delivery.salesOrderNo
            ? `="${delivery.salesOrderNo}"`
            : "N/A",
          QuotationNo: delivery.quotationNo
            ? `="${delivery.quotationNo}"`
            : "N/A",
          PurchaseInvoiceNo: delivery.purchaseInvoiceNo
            ? `="${delivery.purchaseInvoiceNo}"`
            : "N/A",
          DeliveryChallan: delivery.deliveryChallan || "N/A",
          Customer: customerName,
          Site: siteName,
          Vendor: vendorName,
          Products: productDetails || "N/A",
        };
      });

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `material_deliveries_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("CSV downloaded successfully!");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV. Please try again.");
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof DeliveryItem,
    value: string
  ) => {
    const updatedItems = [...items];
    (updatedItems[index][field] as string) = value;

    // Auto-fill productId and inventoryId if serialNumber or macAddress is selected
    if (field === "serialNumber" || field === "macAddress") {
      const found = inventory.find(
        (inv) =>
          inv.serialNumber === updatedItems[index].serialNumber ||
          inv.macAddress === updatedItems[index].macAddress
      );

      if (found) {
        updatedItems[index].productId = found.productId;
        updatedItems[index].inventoryId = found.id;
        updatedItems[index].serialNumber = found.serialNumber;
        updatedItems[index].macAddress = found.macAddress;
        updatedItems[index].productName = found.product?.productName || "Unknown";
        updatedItems[index].vendorId = found.vendorId;
        updatedItems[index].customerId = formData.customerId || 0;
        updatedItems[index].siteId = formData.siteId || 0;
      }
    }

    setItems(updatedItems);

    // Clear error for this field
    if (itemErrors[index]?.[field]) {
      setItemErrors(prev => {
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

  const addItem = () => {
    setItems([...items, { serialNumber: "", macAddress: "", productId: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      alert("At least one item is required");
      return;
    }
    
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    
    // Clear errors for removed item
    setItemErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      
      // Re-index remaining errors
      const reindexed: Record<number, Record<string, string>> = {};
      Object.keys(newErrors).forEach(key => {
        const numKey = parseInt(key);
        if (numKey > index) {
          reindexed[numKey - 1] = newErrors[numKey];
        } else {
          reindexed[numKey] = newErrors[numKey];
        }
      });
      
      return reindexed;
    });
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert("Please fix the errors in the form before submitting.");
      return;
    }

    try {
      setSaving(true);
      
      // Map items array to include required fields
      const payload = {
        ...formData,
        customerId: isSaleOrDemo ? formData.customerId : undefined,
        siteId: formData.siteId ? formData.siteId : undefined,
        vendorId: isPurchaseReturn ? formData.vendorId : undefined,
        materialDeliveryItems: items
          .filter((item) => item.inventoryId)
          .map((item) => ({
            inventoryId: item.inventoryId,
            serialNumber: item.serialNumber,
            macAddress: item.macAddress,
            productId: item.productId,
            productName: item.productName || "Unknown",
          })),
      };

      if (formData.id) {
        await axios.put(
          `http://localhost:8000/material-delivery/${formData.id}`,
          payload
        );
        alert("Delivery updated successfully!");
      } else {
        await axios.post("http://localhost:8000/material-delivery", payload);
        alert("Delivery created successfully!");
      }

      // Reset form and table after successful submission
      setFormData(initialFormData);
      setItems([{ serialNumber: "", macAddress: "", productId: 0 }]);
      setErrors({});
      setItemErrors({});
      fetchDeliveries();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving delivery:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Error saving delivery. Please try again.";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const openModal = (delivery?: any) => {
    if (delivery) {
      const enrichedItems = (delivery.materialDeliveryItems || []).map(
        (item: any) => {
          const inv = inventory.find((i) => i.id === item.inventoryId);

          return {
            inventoryId: item.inventoryId || 0,
            serialNumber: item.serialNumber || inv?.serialNumber || "",
            macAddress: item.macAddress || inv?.macAddress || "",
            productId: item.productId || inv?.productId || 0,
            productName: inv?.product?.productName || "Unknown",
            vendorId: delivery.vendorId || inv?.vendorId || undefined,
            customerId: delivery.customerId || undefined,
            siteId: delivery.siteId || undefined,
          };
        }
      );

      setFormData({
        id: delivery.id,
        deliveryType: delivery.deliveryType || "",
        refNumber: delivery.refNumber || "",
        salesOrderNo: delivery.salesOrderNo || "",
        quotationNo: delivery.quotationNo || "",
        purchaseInvoiceNo: delivery.purchaseInvoiceNo || "",
        customerId: delivery.customerId || 0,
        siteId: delivery.siteId || 0,
        vendorId: delivery.vendorId || 0,
      });

      setItems(
        enrichedItems.length
          ? enrichedItems
          : [{ serialNumber: "", macAddress: "", productId: 0 }]
      );
    } else {
      // Reset for new entry
      setFormData(initialFormData);
      setItems([{ serialNumber: "", macAddress: "", productId: 0 }]);
    }

    setErrors({});
    setItemErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (id: any): void => {
    if (!confirm("Are you sure you want to delete this delivery?")) return;

    axios
      .delete(`http://localhost:8000/material-delivery/${id}`)
      .then(() => {
        alert("Delivery deleted successfully!");
        fetchDeliveries();
      })
      .catch((error: any) => {
        console.error(error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            "Error deleting delivery";
        alert(errorMessage);
      });
  };

  const handleSearch = (query: string) => {
    const lowerSearch = query.toLowerCase();
    return deliveryList.filter((delivery) => {
      return (
        delivery.refNumber?.toLowerCase().includes(lowerSearch) ||
        delivery.salesOrderNo?.toLowerCase().includes(lowerSearch) ||
        delivery.quotationNo?.toLowerCase().includes(lowerSearch) ||
        delivery.purchaseInvoiceNo?.toLowerCase().includes(lowerSearch) ||
        delivery.deliveryChallan?.toLowerCase().includes(lowerSearch) ||
        delivery.deliveryType?.toLowerCase().includes(lowerSearch) ||
        delivery.addressBook?.customerName?.toLowerCase().includes(lowerSearch) ||
        delivery.site?.siteName?.toLowerCase().includes(lowerSearch) ||
        delivery.vendor?.vendorName?.toLowerCase().includes(lowerSearch) ||
        delivery.materialDeliveryItems?.some((item: any) =>
          item.serialNumber?.toLowerCase().includes(lowerSearch) ||
          item.product?.productName?.toLowerCase().includes(lowerSearch)
        )
      );
    });
  };

  const sortedDeliveries = React.useMemo(() => {
    const filtered = handleSearch(search);
    
    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let aField = a[sortField as keyof typeof a];
      let bField = b[sortField as keyof typeof b];

      // Handle undefined or null
      if (aField === undefined || aField === null) aField = "";
      if (bField === undefined || bField === null) bField = "";

      // Check if fields are dates
      if (
        sortField.toLowerCase().includes("date") ||
        sortField.toLowerCase().includes("challan")
      ) {
        const dateA = new Date(aField).getTime();
        const dateB = new Date(bField).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Numeric compare if numbers
      if (typeof aField === "number" && typeof bField === "number") {
        return sortOrder === "asc" ? aField - bField : bField - aField;
      }

      // String compare fallback
      return sortOrder === "asc"
        ? String(aField).localeCompare(String(bField))
        : String(bField).localeCompare(String(aField));
    });
  }, [deliveryList, search, sortField, sortOrder]);

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(key);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (key: string) => {
    if (sortField !== key) return <FaSort className="ml-1 text-gray-400" />;
    return sortOrder === "asc" ? 
      <FaSortUp className="ml-1 text-blue-600" /> : 
      <FaSortDown className="ml-1 text-blue-600" />;
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeliveries = sortedDeliveries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedDeliveries.length / itemsPerPage);

  return (
    <div className="p-8 bg-gray-50 min-h-screen -mt-10 text-black">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Material Outward</h1>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform duration-300 w-full md:w-auto flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Delivery
        </button>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search by reference, customer, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
            />
          </div>
          <button
            onClick={handleDownloadCSV}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
            title="Download CSV"
            disabled={deliveryList.length === 0}
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
                  {[
                    { label: "Delivery Type", key: "deliveryType" },
                    { label: "Delivery Challan", key: "deliveryChallan" },
                    { label: "Sales Order", key: "salesOrderNo" },
                    { label: "Quotation", key: "quotationNo" },
                    { label: "Purchase Invoice", key: "purchaseInvoiceNo" },
                    { label: "Ref Number", key: "refNumber" },
                    { label: "Customer", key: "customer" },
                    { label: "Site", key: "site" },
                    { label: "Vendor", key: "vendor" },
                    { label: "Products", key: "product" },
                    { label: "Actions", key: "" },
                  ].map(({ label, key }) => (
                    <th
                      key={key || "actions"}
                      className={`p-4 border border-gray-300 text-left ${key !== "" ? "cursor-pointer select-none" : ""}`}
                      onClick={() => key && handleSort(key)}
                    >
                      <div className="flex items-center">
                        {label}
                        {key && getSortIcon(key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {currentDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-500">
                      {search ? "No deliveries found matching your search." : "No deliveries found. Add your first delivery!"}
                    </td>
                  </tr>
                ) : (
                  currentDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 border border-gray-300">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          delivery.deliveryType === "Sale" 
                            ? "bg-green-100 text-green-800"
                            : delivery.deliveryType === "Demo"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {delivery.deliveryType}
                        </span>
                      </td>
                      <td className="p-4 border border-gray-300 font-medium">
                        {delivery.deliveryChallan || (
                          <span className="text-gray-400">No Challan</span>
                        )}
                      </td>
                      <td className="p-4 border border-gray-300">
                        {delivery.salesOrderNo || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4 border border-gray-300">
                        {delivery.quotationNo || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4 border border-gray-300">
                        {delivery.purchaseInvoiceNo || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4 border border-gray-300 font-mono">
                        {delivery.refNumber || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4 border border-gray-300">
                        {delivery.addressBook?.customerName || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4 border border-gray-300">
                        {delivery.site?.siteName || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4 border border-gray-300">
                        {delivery.vendor?.vendorName || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4 border border-gray-300">
                        <div className="flex flex-col gap-1">
                          {delivery.materialDeliveryItems?.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col text-xs">
                              <span className="font-medium">{item.product?.productName || "N/A"}</span>
                              <div className="flex gap-2 text-gray-600">
                                {item.serialNumber && (
                                  <span className="font-mono">SN: {item.serialNumber}</span>
                                )}
                                {item.macAddress && (
                                  <span className="font-mono">MAC: {item.macAddress}</span>
                                )}
                              </div>
                            </div>
                          )) || (
                            <span className="text-gray-400">No items</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border border-gray-300">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openModal(delivery)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg shadow transition-all hover:shadow-lg hover:scale-105"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(delivery.id)}
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

          {sortedDeliveries.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedDeliveries.length)} of {sortedDeliveries.length} deliveries
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h3 className="text-2xl font-bold text-indigo-700">
                  {formData.id ? "✏️ Edit Delivery" : "➕ Add New Delivery"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="deliveryType"
                      value={formData.deliveryType}
                      onChange={handleChange}
                      className={`w-full p-3 border ${errors.deliveryType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">Select Delivery Type</option>
                      <option value="Sale">Sale</option>
                      <option value="Demo">Demo</option>
                      <option value="Purchase Return">Purchase Return</option>
                    </select>
                    {errors.deliveryType && (
                      <p className="mt-1 text-sm text-red-600">{errors.deliveryType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      name="refNumber"
                      placeholder="Enter reference number"
                      value={formData.refNumber || ""}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {isSaleOrDemo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer <span className="text-red-500">*</span>
                      </label>
                      <CustomerCombobox
                        selectedValue={formData.customerId ?? 0}
                        onSelect={(value) => {
                          setFormData({ ...formData, customerId: value });
                          if (errors.customerId) {
                            setErrors(prev => ({ ...prev, customerId: "" }));
                          }
                        }}
                        placeholder="Select Customer"
                      />
                      {errors.customerId && (
                        <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
                      )}
                    </div>
                  )}

                  {isSaleOrDemo && formData.customerId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="siteId"
                        value={formData.siteId ?? ""}
                        onChange={handleChange}
                        className={`w-full p-3 border ${errors.siteId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="">Select Site</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.siteName}
                          </option>
                        ))}
                      </select>
                      {errors.siteId && (
                        <p className="mt-1 text-sm text-red-600">{errors.siteId}</p>
                      )}
                    </div>
                  )}

                  {isPurchaseReturn && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor <span className="text-red-500">*</span>
                      </label>
                      <VendorCombobox
                        selectedValue={formData.vendorId ?? 0}
                        onSelect={(value) => {
                          setFormData({ ...formData, vendorId: value });
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
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sales Order No
                    </label>
                    <input
                      type="text"
                      name="salesOrderNo"
                      placeholder="Sales Order No"
                      value={formData.salesOrderNo || ""}
                      onChange={handleChange}
                      disabled={formData.deliveryType !== "Sale"}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formData.deliveryType !== "Sale" ? "bg-gray-100 text-gray-500" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quotation No
                    </label>
                    <input
                      type="text"
                      name="quotationNo"
                      placeholder="Quotation No"
                      value={formData.quotationNo || ""}
                      onChange={handleChange}
                      disabled={formData.deliveryType !== "Demo"}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formData.deliveryType !== "Demo" ? "bg-gray-100 text-gray-500" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Invoice No
                    </label>
                    <input
                      type="text"
                      name="purchaseInvoiceNo"
                      placeholder="Purchase Invoice No"
                      value={formData.purchaseInvoiceNo || ""}
                      onChange={handleChange}
                      disabled={formData.deliveryType !== "Purchase Return"}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formData.deliveryType !== "Purchase Return" ? "bg-gray-100 text-gray-500" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-blue-900">
                      Items
                    </h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  </div>

                  {items.map((item, index) => (
                    <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium text-gray-700">Item {index + 1}</h5>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove item"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Serial Number
                          </label>
                          <SerialCombobox
                            selectedValue={item.inventoryId || 0}
                            onSelect={(value) => {
                              const selectedInventory = inventoryList.find(
                                (inv) => inv.id === value
                              );
                              if (selectedInventory) {
                                const updatedItems = [...items];
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  serialNumber: selectedInventory.serialNumber,
                                  macAddress: selectedInventory.macAddress,
                                  productId: selectedInventory.productId,
                                  inventoryId: selectedInventory.id,
                                };
                                setItems(updatedItems);
                                
                                // Clear errors
                                setItemErrors(prev => {
                                  const newErrors = { ...prev };
                                  if (newErrors[index]) {
                                    newErrors[index] = { ...newErrors[index] };
                                    delete newErrors[index].serialNumber;
                                    delete newErrors[index].macAddress;
                                    delete newErrors[index].productId;
                                    if (Object.keys(newErrors[index]).length === 0) {
                                      delete newErrors[index];
                                    }
                                  }
                                  return newErrors;
                                });
                              }
                            }}
                            onInputChange={(value) =>
                              handleItemChange(index, "serialNumber", value)
                            }
                            placeholder="Select Serial Number"
                          />
                          {itemErrors[index]?.serialNumber && (
                            <p className="mt-1 text-sm text-red-600">{itemErrors[index]?.serialNumber}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            MAC Address
                          </label>
                          <MacAddressCombobox
                            selectedValue={
                              inventoryList.find(
                                (inv) => inv.macAddress === item.macAddress
                              )?.id || 0
                            }
                            onSelect={(value) => {
                              const selectedInventory = inventoryList.find(
                                (inv) => inv.id === value
                              );
                              if (selectedInventory) {
                                const updated = [...items];
                                updated[index] = {
                                  ...updated[index],
                                  macAddress: selectedInventory.macAddress,
                                  serialNumber: selectedInventory.serialNumber,
                                  productId: selectedInventory.productId,
                                  inventoryId: selectedInventory.id,
                                };
                                setItems(updated);
                                
                                // Clear errors
                                setItemErrors(prev => {
                                  const newErrors = { ...prev };
                                  if (newErrors[index]) {
                                    newErrors[index] = { ...newErrors[index] };
                                    delete newErrors[index].serialNumber;
                                    delete newErrors[index].macAddress;
                                    delete newErrors[index].productId;
                                    if (Object.keys(newErrors[index]).length === 0) {
                                      delete newErrors[index];
                                    }
                                  }
                                  return newErrors;
                                });
                              }
                            }}
                            onInputChange={(value) =>
                              handleItemChange(index, "macAddress", value)
                            }
                            placeholder="Select MAC Address"
                          />
                          {itemErrors[index]?.macAddress && (
                            <p className="mt-1 text-sm text-red-600">{itemErrors[index]?.macAddress}</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={
                              products.find((p) => p.id === item.productId)
                                ?.productName || ""
                            }
                            placeholder="Product Name (Auto-filled)"
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-800"
                          />
                          {itemErrors[index]?.productId && (
                            <p className="mt-1 text-sm text-red-600">{itemErrors[index]?.productId}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {formData.id ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    formData.id ? "Update Delivery" : "Create Delivery"
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

export default MaterialDeliveryForm;