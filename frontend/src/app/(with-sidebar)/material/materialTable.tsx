"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { CustomerCombobox } from "@/components/ui/CustomerCombobox";
import { VendorCombobox } from "@/components/ui/VendorCombobox";
import SerialCombobox from "@/components/ui/SerialCombobox";
import MacAddressCombobox from "@/components/ui/MacAddressCombobox";
import Papa from "papaparse";
import { FaDownload, FaEdit, FaSearch, FaTrashAlt } from "react-icons/fa";

interface Vendor {
  id: number;
  vendorName: string;
}

interface Site {
  id: number;
  siteName: string;
  customerId: number;
}

interface Customer {
  id: number;
  customerName: string;
  Sites: Site[];
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
  const [itemsPerPage] = useState(10); // Change as needed
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const headers = [
    { label: "Delivery Type", key: "deliveryType" },
    { label: "Delivery Challan", key: "deliveryChallan" },
    { label: "Sales Order No", key: "salesOrderNo" },
    { label: "Quotation No", key: "quotationNo" },
    { label: "Purchase Invoice No", key: "purchaseInvoiceNo" },
    { label: "Ref Number", key: "refNumber" },
    { label: "Customer Name", key: "customerName" },
    { label: "Site Name", key: "siteName" },
    { label: "Vendor Name", key: "vendorName" },
    { label: "Serial Number", key: "serialNumber" },
    { label: "Product", key: "product" },
    { label: "MAC Address", key: "macAddress" },
    { label: "Actions", key: "actions" },
  ];

  const sortedDeliveries = React.useMemo(() => {
    if (!sortField) return deliveryList;

    return [...deliveryList].sort((a, b) => {
      let aField = a[sortField as keyof typeof a];
      let bField = b[sortField as keyof typeof b];

      // Handle undefined or null
      if (aField === undefined || aField === null) aField = "";
      if (bField === undefined || bField === null) bField = "";

      // Check if fields are dates — adjust if you have date columns
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
  }, [deliveryList, sortField, sortOrder]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeliveries = sortedDeliveries.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(sortedDeliveries.length / itemsPerPage);

  const isSaleOrDemo =
    formData.deliveryType === "Sale" || formData.deliveryType === "Demo";
  const isPurchaseReturn = formData.deliveryType === "Purchase Return";

  useEffect(() => {
    axios
      .get("http://localhost:8000/address-book")
      .then((res) => setCustomers(res.data));
    axios
      .get("http://localhost:8000/vendors")
      .then((res) => setVendors(res.data));
    axios
      .get("http://localhost:8000/products")
      .then((res) => setProducts(res.data));
    axios
      .get("http://localhost:8000/inventory")
      .then((res) => setInventory(res.data));
    fetchDeliveries(); // Fetch deliveries on component mount
  }, []);

  useEffect(() => {
    axios.get("http://localhost:8000/inventory").then((res) => {
      console.log("Raw inventory response:", res.data); // ✅ log raw response

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
    });
  }, []);

  const fetchDeliveries = async () => {
    const res = await axios.get("http://localhost:8000/material-delivery");
    setDeliveryList(res.data.reverse());
  };

  useEffect(() => {
    const selectedCustomer = customers.find(
      (c) => c.id === formData.customerId
    );
    if (selectedCustomer) {
      setSites(selectedCustomer.Sites || []);
    } else {
      setSites([]);
    }
  }, [formData.customerId, customers]);

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
          : value, // Allow undefined siteId
    }));
  };

  const handleDownloadCSV = () => {
    if (!deliveryList.length) return;

    // Flatten all sites from all customers
    const allSites: Site[] = customers.flatMap((c) => c.Sites || []);

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
    link.setAttribute("download", "material-deliveries.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        updatedItems[index].productName =
          found.product?.productName || "Unknown";
        updatedItems[index].vendorId = found.vendorId;
        updatedItems[index].customerId = formData.customerId || 0; // Set customerId from formData
        updatedItems[index].siteId = formData.siteId || 0; // Set siteId from formData
      }
    }

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { serialNumber: "", macAddress: "", productId: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const isEdit = !!formData.id;

    if (!formData.deliveryType) {
      alert("Please select a delivery type");
      return;
    }

    if (isSaleOrDemo && !formData.customerId) {
      alert("Customer is required for Sale or Demo");
      return;
    }
    if (isPurchaseReturn && !formData.vendorId) {
      alert("Vendor is required for Purchase Return");
      return;
    }

    // Map items array to include required fields
    const payload = {
      ...formData,
      customerId: isSaleOrDemo ? formData.customerId : undefined,
      siteId: formData.siteId ? formData.siteId : undefined, // Optional siteId
      vendorId: isPurchaseReturn ? formData.vendorId : undefined,
      materialDeliveryItems: items // Ensure this field includes all required item data
        .filter((item) => item.inventoryId) // Ensure items with inventoryId are included
        .map((item) => ({
          inventoryId: item.inventoryId,
          serialNumber: item.serialNumber, // Map serialNumber to serialNumber
          macAddress: item.macAddress, // Map macAddress properly
          productId: item.productId, // Ensure productId is mapped correctly
          productName: item.productName || "Unknown", // Default value for missing productName
        })),
    };

    try {
      if (isEdit) {
        await axios.put(
          `http://localhost:8000/material-delivery/${formData.id}`,
          payload
        );
        alert("Delivery updated sucessfully!");
      } else {
        await axios.post("http://localhost:8000/material-delivery", payload);
        alert("Delivery created successfully!");
      }

      // Reset form and table after successful submission
      setFormData(initialFormData);
      setItems([{ serialNumber: "", macAddress: "", productId: 0 }]);
      fetchDeliveries();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error saving delivery");
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

    setIsModalOpen(true);
  };

  const handleDelete = (id: any): void => {
    if (confirm("Are you sure you want to delete this delivery?")) {
      axios
        .delete(`http://localhost:8000/material-delivery/${id}`)
        .then(() => {
          alert("Delivery deleted!");
          fetchDeliveries();
        })
        .catch((error) => {
          console.error(error);
          alert("Error deleting delivery");
        });
    }
  };

  return (
    <>

  <div className="p-8 bg-gray-50 min-h-screen -mt-10 text-black">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Material Outward</h1>
    </div>

    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

          {/* Add Delivery button */}
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
          >
            Add Delivery
          </button>

          {/* Search + Download grouped */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
              />
            </div>
            <button
              onClick={handleDownloadCSV}
              title="Download CSV"
              className="text-blue-600 hover:text-blue-800 text-xl"
            >
              <FaDownload />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-700 bg-white rounded-xl shadow-md overflow-hidden">
            <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
              <tr>
                {headers.map(({ label, key }) => (
                  <th
                    key={key}
                    className={`border p-2 ${
                      key !== "actions" ? "cursor-pointer select-none" : ""
                    }`}
                    onClick={() => {
                      if (key === "actions") return; // no sorting on actions
                      if (sortField === key) {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortField(key);
                        setSortOrder("asc");
                      }
                      setCurrentPage(1);
                    }}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{label}</span>
                      {key !== "actions" && (
                        <span className="flex flex-col text-xs leading-[10px]">
                          <span
                            style={{
                              color:
                                sortField === key && sortOrder === "asc"
                                  ? "black"
                                  : "lightgray",
                              lineHeight: 0,
                            }}
                          >
                            ▲
                          </span>
                          <span
                            style={{
                              color:
                                sortField === key && sortOrder === "desc"
                                  ? "black"
                                  : "lightgray",
                              lineHeight: 0,
                            }}
                          >
                            ▼
                          </span>
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {currentDeliveries
                .filter((delivery) => {
                  const lowerSearch = search.toLowerCase();
                  return (
                    delivery.refNumber?.toLowerCase().includes(lowerSearch) ||
                    delivery.salesOrderNo
                      ?.toLowerCase()
                      .includes(lowerSearch) ||
                    delivery.quotationNo?.toLowerCase().includes(lowerSearch) ||
                    delivery.purchaseInvoiceNo
                      ?.toLowerCase()
                      .includes(lowerSearch) ||
                    delivery.deliveryChallan
                      ?.toLowerCase()
                      .includes(lowerSearch) ||
                    delivery.materialDeliveryItems
                      ?.map((item: any) => item.serialNumber)
                      .join(", ")
                      .toLowerCase()
                      .includes(lowerSearch) ||
                    delivery.deliveryType
                      ?.toLowerCase()
                      .includes(lowerSearch) ||
                    delivery.customer?.customerName
                      ?.toLowerCase()
                      .includes(lowerSearch) ||
                    delivery.vendor?.vendorName
                      ?.toLowerCase()
                      .includes(lowerSearch)
                  );
                })
                .map((delivery) => (
                  <tr key={delivery.id}>
                    <td className="border p-2">{delivery.deliveryType}</td>
                    <td className="border p-2">
                      {delivery.deliveryChallan || "No Delivery Challan"}
                    </td>
                    <td className="border p-2">
                      {delivery.salesOrderNo || "No Sales Order No"}
                    </td>
                    <td className="border p-2">
                      {delivery.quotationNo || "No Quotation"}
                    </td>
                    <td className="border p-2">
                      {delivery.purchaseInvoiceNo || "No Invoice"}
                    </td>
                    <td className="border p-2">
                      {delivery.refNumber || "No Ref No"}
                    </td>

                    <td className="border p-2">
                      {delivery.customer?.customerName || "No Customer"}
                    </td>
                    <td className="border p-2">
                      {delivery.site?.siteName || "No Sites"}
                    </td>
                    <td className="border p-2">
                      {delivery.vendor?.vendorName || "No Vendor"}
                    </td>

                    <td className="border p-2">
                      {delivery.materialDeliveryItems
                        ?.map((item: any, idx: number) => item.serialNumber)
                        .join(", ") || "No Serial Number"}
                    </td>

                    <td className="border p-2">
                      {delivery.materialDeliveryItems
                        ?.map(
                          (item: any, idx: number) => item.product?.productName
                        )
                        .join(", ") || "N/A"}
                    </td>

                    <td className="border p-2">
                      {delivery.materialDeliveryItems
                        ?.map((item: any, idx: number) => item.macAddress)
                        .join(", ") || "N/A"}
                    </td>

                    <td className="border p-2 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => openModal(delivery)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full shadow transition-transform transform hover:scale-110"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(delivery.id)}
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
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1 ? "bg-blue-600 text-white" : ""
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
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
              {/* Modal Title */}
              <h3 className="text-lg font-bold mb-4">
                {formData.id ? "Edit Delivery" : "Add Delivery"}
              </h3>

              {/* Form Inputs for Create and Edit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  name="deliveryType"
                  value={formData.deliveryType}
                  onChange={handleChange}
                  className="border p-2 rounded"
                >
                  <option value="">Select Delivery Type</option>
                  <option value="Sale">Sale</option>
                  <option value="Demo">Demo</option>
                  <option value="Purchase Return">Purchase Return</option>
                </select>

                <input
                  type="text"
                  name="refNumber"
                  placeholder="Reference Number"
                  value={formData.refNumber || ""}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />

                {isSaleOrDemo && (
                  <CustomerCombobox
                    selectedValue={formData.customerId ?? 0}
                    onSelect={(value) =>
                      setFormData({ ...formData, customerId: value })
                    }
                    placeholder="Select Customer"
                  />
                )}

                {isSaleOrDemo && (
                  <div className="mb-4">
                    <select
                      name="siteId"
                      value={formData.siteId ?? ""}
                      onChange={handleChange}
                      className="border p-1.5 w-72 rounded"
                    >
                      <option value="">Select Customer's Site</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.siteName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isPurchaseReturn && (
                  <VendorCombobox
                    selectedValue={formData.vendorId ?? 0}
                    onSelect={(value) =>
                      setFormData({ ...formData, vendorId: value })
                    }
                    placeholder="Select Vendor"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <input
                  type="text"
                  name="salesOrderNo"
                  placeholder="Sales Order No"
                  value={formData.salesOrderNo || ""}
                  onChange={handleChange}
                  readOnly={formData.deliveryType !== "Sale"}
                  className={`border p-2 rounded ${
                    formData.deliveryType !== "Sale"
                      ? "bg-gray-100 text-gray-500"
                      : ""
                  }`}
                />

                <input
                  type="text"
                  name="quotationNo"
                  placeholder="Quotation No"
                  value={formData.quotationNo || ""}
                  onChange={handleChange}
                  readOnly={formData.deliveryType !== "Demo"}
                  className={`border p-2 rounded ${
                    formData.deliveryType !== "Demo"
                      ? "bg-gray-100 text-gray-500"
                      : ""
                  }`}
                />

                <input
                  type="text"
                  name="purchaseInvoiceNo"
                  placeholder="Purchase Invoice No"
                  value={formData.purchaseInvoiceNo || ""}
                  onChange={handleChange}
                  readOnly={formData.deliveryType !== "Purchase Return"}
                  className={`border p-2 rounded ${
                    formData.deliveryType !== "Purchase Return"
                      ? "bg-gray-100 text-gray-500"
                      : ""
                  }`}
                />
              </div>

              {/* Items Section */}
              <div className="mt-6 space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap gap-4 items-center"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <SerialCombobox
                        selectedValue={item.inventoryId || 0}
                        onSelect={(value) => {
                          const selectedInventory = inventoryList.find(
                            (inv) => inv.id === value
                          );
                          if (selectedInventory) {
                            const updatedItems = [...items];
                            updatedItems[index] = {
                              serialNumber: selectedInventory.serialNumber,
                              macAddress: selectedInventory.macAddress,
                              productId: selectedInventory.productId,
                              inventoryId: selectedInventory.id,
                            };
                            setItems(updatedItems);
                          }
                        }}
                        onInputChange={(value) =>
                          handleItemChange(index, "serialNumber", value)
                        }
                        placeholder="Select Serial Number"
                      />
                    </div>

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
                        }
                      }}
                      onInputChange={(value) =>
                        handleItemChange(index, "macAddress", value)
                      }
                      placeholder="Select MAC Address"
                    />

                    <input
                      type="text"
                      readOnly
                      value={
                        products.find((p) => p.id === item.productId)
                          ?.productName || ""
                      }
                      placeholder="Product Name"
                      className="border p-2 rounded bg-gray-100 text-gray-800 flex-1 min-w-[250px]"
                    />

                    <button
                      onClick={addItem}
                      className="text-green-600 font-bold text-2xl px-2"
                    >
                      +
                    </button>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 font-bold text-2xl px-2"
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                  {formData.id ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MaterialDeliveryForm;
