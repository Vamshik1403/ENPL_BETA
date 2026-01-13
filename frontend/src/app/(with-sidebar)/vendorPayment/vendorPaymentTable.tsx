"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { PencilLine, Trash } from "lucide-react";
import { VendorCombobox } from "@/components/ui/VendorCombobox";
import Papa from "papaparse";
import { FaDownload, FaSearch } from "react-icons/fa";

interface Vendor {
  id: number;
  vendorName: string;
}

interface VendorPayment {
  id?: number;
  vendorId: number;
  purchaseInvoiceNo: string;
  invoiceGrossAmount: string;
  dueAmount: string;
  paidAmount: string;
  balanceDue?: string;
  paymentDate: string;
  referenceNo: string;
  paymentType: string;
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}

const initialFormState: VendorPayment = {
  vendorId: 0,
  purchaseInvoiceNo: "",
  invoiceGrossAmount: "",
  dueAmount: "",
  paidAmount: "",
  balanceDue: "",
  paymentType: "",
  referenceNo: "",
  remark: "",
  paymentDate: "",
  createdAt: "",
  updatedAt: "",
};

const VendorPaymentTable: React.FC = () => {
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorInvoices, setVendorInvoices] = useState<any[]>([]);
  const [formData, setFormData] = useState<VendorPayment>(initialFormState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 10;

  const headers = [
    { label: "Entry Date", key: "entryDate" },
    { label: "Vendor", key: "vendorName" }, // special handling below
    { label: "Payment Date", key: "paymentDate" },
    { label: "Reference", key: "referenceNo" },
    { label: "Gross Amount", key: "invoiceGrossAmount" },
    { label: "Due Amount", key: "dueAmount" },
    { label: "Paid Amount", key: "paidAmount" },
    { label: "Balance Due", key: "balanceDue" },
    { label: "Payment Mode", key: "paymentType" },
    { label: "Remarks", key: "remark" },
    { label: "Purchase Invoice", key: "purchaseInvoiceNo" },
    { label: "Actions", key: "actions" },
  ];

  const filtered = payments.filter((p) => {
    const vendorName =
      vendors.find((v) => v.id === p.vendorId)?.vendorName.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return (
      vendorName.includes(q) ||
      p.paymentDate.toLowerCase().includes(q) ||
      p.referenceNo.toLowerCase().includes(q) ||
      p.paymentType.toLowerCase().includes(q) ||
      p.remark.toLowerCase().includes(q) ||
      p.purchaseInvoiceNo.toLowerCase().includes(q) ||
      p.invoiceGrossAmount.toLowerCase().includes(q) ||
      p.dueAmount.toLowerCase().includes(q)
    );
  });

  const sortedPayments = React.useMemo(() => {
    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === "vendorName") {
        aValue = vendors.find((v) => v.id === a.vendorId)?.vendorName || "";
        bValue = vendors.find((v) => v.id === b.vendorId)?.vendorName || "";
      } else {
        aValue = a[sortField as keyof VendorPayment] ?? "";
        bValue = b[sortField as keyof VendorPayment] ?? "";
      }

      // Date fields handling (simple ISO or Date strings)
      if (sortField.toLowerCase().includes("date")) {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Numeric fields: convert to number if possible
      if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
        return sortOrder === "asc"
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      // String comparison fallback
      return sortOrder === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filtered, sortField, sortOrder, vendors]);

  const paginated = sortedPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage);

  useEffect(() => {
    fetchPayments();
    fetchVendors();
  }, []);

  const fetchPayments = async () => {
    const res = await axios.get("http://localhost:8000/vendor-payment");
    setPayments(res.data.reverse());
  };

  const fetchVendors = async () => {
    const res = await axios.get("http://localhost:8000/vendors");
    setVendors(res.data);
  };

  const handleDownloadCSV = () => {
    if (!payments.length) return;

    const csvData = payments.map((payment) => {
      const vendorName =
        vendors.find((v) => v.id === payment.vendorId)?.vendorName || "N/A";

      return {
        Vendor: vendorName,
        PurchaseInvoiceNo: payment.purchaseInvoiceNo
          ? `="${payment.purchaseInvoiceNo}"`
          : "N/A",
        InvoiceGrossAmount: payment.invoiceGrossAmount || "N/A",
        DueAmount: payment.dueAmount || "N/A",
        PaidAmount: payment.paidAmount || "N/A",
        BalanceDue: payment.balanceDue || "N/A",
        PaymentDate: payment.paymentDate || "N/A",
        ReferenceNo: payment.referenceNo ? `="${payment.referenceNo}"` : "N/A",
        PaymentType: payment.paymentType || "N/A",
        Remark: payment.remark || "N/A",
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "vendor-payments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // If the field being updated is 'paidAmount', calculate balanceDue
    if (name === "paidAmount") {
      const paid = parseFloat(value || "0");
      const due = parseFloat(formData.dueAmount || "0");
      const balance = due - paid;

      setFormData((prev) => ({
        ...prev,
        paidAmount: value,
        balanceDue: balance.toFixed(2),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      if (formData.id) {
        await axios.put(
          `http://localhost:8000/vendor-payment/${formData.id}`,
          formData
        );
        alert("Payment updated sucessfully!");
      } else {
        await axios.post("http://localhost:8000/vendor-payment", formData);
        alert("Payment added successfully!");
      }
      setFormData(initialFormState);
      setIsModalOpen(false);
      fetchPayments();
    } catch (err) {
      console.error(err);
      alert("fill all mandatory data");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?"
    );
    if (confirmed) {
      try {
        await axios.delete(`http://localhost:8000/vendor-payment/${id}`);
        alert("Payment deleted!");
        fetchPayments();
      } catch (err) {
        console.error(err);
        alert("Error deleting payment");
      }
    }
  };

  const openModal = (data?: VendorPayment) => {
    if (data) setFormData(data);
    else setFormData(initialFormState);
    setIsModalOpen(true);
  };

return (
  <div className="p-8 bg-gray-50 min-h-screen -mt-10 text-black">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Vendors Payment</h1>
    </div>

    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
        >
          Add Payment
        </button>

        {/* Group search input + download icon side by side */}
        <div className="flex items-center gap-2 w-full md:w-auto">
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
                  className={`p-2 border ${
                    key !== "actions" ? "cursor-pointer select-none" : ""
                  }`}
                  onClick={() => {
                    if (key === "actions") return; // no sorting on actions column
                    if (sortField === key) {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortField(key);
                      setSortOrder("asc");
                    }
                    setCurrentPage(1); // reset page when sorting changes
                  }}
                >
                  <div className="flex items-center justify-center space-x-1 select-none">
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
            {paginated.map((p) => (
              <tr key={p.id}>
                <td className="p-2 border text-center">
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="p-2 border text-center">
                  {vendors.find((v) => v.id === p.vendorId)?.vendorName ||
                    "N/A"}
                </td>
                <td className="p-2 border text-center">
                  {new Date(p.paymentDate).toLocaleDateString("en-GB")}
                </td>
                <td className="p-2 border text-center">
                  {p.referenceNo || "N/A"}
                </td>
                <td className="p-2 border text-center">
                  {p.invoiceGrossAmount}
                </td>
                <td className="p-2 border text-center">{p.dueAmount}</td>
                <td className="p-2 border text-center">{p.paidAmount}</td>
                <td className="p-2 border text-center">
                  {p.balanceDue || "N/A"}
                </td>
                <td className="p-2 border text-center">{p.paymentType}</td>
                <td className="p-2 border text-center">{p.remark || "N/A"}</td>
                <td className="p-2 border text-center">
                  {p.purchaseInvoiceNo}
                </td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => openModal(p)}
                    className="text-blue-600 mr-2"
                  >
                    <PencilLine size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id!)}
                    className="text-red-600"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
            <h2 className="text-xl font-bold mb-4">
              {formData.id ? "Edit Payment" : "Add Payment"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="font-semibold mb-1 block">Vendor</label>
                <VendorCombobox
                  selectedValue={formData.vendorId}
                  onSelect={async (val) => {
                    setFormData((prev) => ({ ...prev, vendorId: val }));
                    try {
                      const res = await axios.get(
                        `http://localhost:8000/inventory?vendorId=${val}`
                      );
                      if (res.data && res.data.length > 0) {
                        setVendorInvoices(res.data);

                        const firstInvoice = res.data[0];
                        const invoiceNo = firstInvoice.purchaseInvoice;
                        const invoiceGrossAmount = parseFloat(
                          firstInvoice.invoiceGrossAmount || "0"
                        );

                        // Find previous payments for this invoice
                        const previousPayments = payments.filter(
                          (p) => p.purchaseInvoiceNo === invoiceNo
                        );

                        const totalPaid = previousPayments.reduce(
                          (sum, p) => sum + parseFloat(p.paidAmount || "0"),
                          0
                        );

                        const dueAmount = invoiceGrossAmount - totalPaid;

                        setFormData((prev) => ({
                          ...prev,
                          purchaseInvoiceNo: invoiceNo,
                          invoiceGrossAmount: firstInvoice.invoiceGrossAmount,
                          dueAmount: dueAmount.toFixed(2),
                        }));
                      } else {
                        setVendorInvoices([]);
                        setFormData((prev) => ({
                          ...prev,
                          purchaseInvoiceNo: "",
                          invoiceGrossAmount: "",
                          dueAmount: "",
                        }));
                      }
                    } catch (err) {
                      console.error("Failed to fetch inventory", err);
                      setVendorInvoices([]);
                      setFormData((prev) => ({
                        ...prev,
                        purchaseInvoiceNo: "",
                        invoiceGrossAmount: "",
                        dueAmount: "",
                      }));
                    }
                  }}
                  placeholder="Select Vendor"
                />
              </div>

              {vendorInvoices.length > 0 && (
                <div>
                  <label className="font-semibold mb-1 block">
                    Select Invoice
                  </label>
                  <select
                    value={formData.purchaseInvoiceNo}
                    onChange={(e) => {
                      const selectedInvoiceNo = e.target.value;
                      const selectedInvoice = vendorInvoices.find(
                        (inv) => inv.purchaseInvoice === selectedInvoiceNo
                      );
                      if (selectedInvoice) {
                        const invoiceGrossAmount = parseFloat(
                          selectedInvoice.invoiceGrossAmount || "0"
                        );
                        const previousPayments = payments.filter(
                          (p) => p.purchaseInvoiceNo === selectedInvoiceNo
                        );
                        const totalPaid = previousPayments.reduce(
                          (sum, p) => sum + parseFloat(p.paidAmount || "0"),
                          0
                        );
                        const dueAmount = invoiceGrossAmount - totalPaid;

                        setFormData((prev) => ({
                          ...prev,
                          purchaseInvoiceNo: selectedInvoiceNo,
                          invoiceGrossAmount:
                            selectedInvoice.invoiceGrossAmount,
                          dueAmount: dueAmount.toFixed(2),
                        }));
                      }
                    }}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">-- Select Invoice --</option>
                    {vendorInvoices.map((inv, idx) => (
                      <option key={idx} value={inv.purchaseInvoice}>
                        {inv.purchaseInvoice}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold mb-1 block">
                  Invoice Gross Amount
                </label>
                <input
                  type="text"
                  name="invoiceGrossAmount"
                  value={formData.invoiceGrossAmount}
                  onChange={handleChange}
                  readOnly
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="font-semibold mb-1 block">Due Amount</label>
                <input
                  type="text"
                  name="dueAmount"
                  value={formData.dueAmount}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="font-semibold mb-1 block">Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="font-semibold mb-1 block">Payment Type</label>
                <select
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">-- Select Type --</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="Write Off">Write Off</option>
                </select>
              </div>

              <div>
                <label className="font-semibold mb-1 block">Paid Amount</label>
                <input
                  type="text"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="font-semibold mb-1 block">Reference</label>
                <input
                  type="text"
                  name="referenceNo"
                  value={formData.referenceNo}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="font-semibold mb-1 block">Balance Due</label>
                <input
                  type="text"
                  name="balanceDue"
                  value={formData.balanceDue}
                  readOnly
                  className="border p-2 rounded w-full bg-gray-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold mb-1 block">Remark</label>
                <input
                  type="text"
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>

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

export default VendorPaymentTable;
