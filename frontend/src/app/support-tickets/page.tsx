'use client';

import { useState, useEffect } from 'react';

interface Site {
  id: number;
  siteID: string;
  siteName: string;
  addressBookId: number;
}

interface AddressBook {
  id: number;
  addressBookID: string;
  customerName: string;
  addressType: string;
}

interface SupportTicketUser {
  id: number;
  name: string;
  email: string;
  supportTicketMappings: {
    customerId: number;
    siteId: number;
    addressBook: AddressBook;
    site: Site;
  }[];
}

interface SupportTicket {
  id?: number;
  ticketID: string;
  name: string;
  email: string;
  designation?: string;
  customerId: number;
  siteId: number;
  description?: string;
  supportType: string;
  priority?: string;
  contactPerson?: string;
  contactNumber?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportTicketFormData {
  name: string;
  email: string;
  designation: string;
  customerId: number;
  siteId: number;
  description: string;
  supportType: string;
  priority: string;
  contactPerson: string;
  contactNumber: string;
  status: string;
}

/* ✅ Moved modal outside for stable rendering */
function SupportTicketModal({
  show,
  editingId,
  loading,
  nextTicketId,
  formData,
  setFormData,
  filteredCustomers,
  filteredSites,
  emailSearched,
  handleSearchEmail,
  handleSubmit,
  resetForm,
}: any) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Support Ticket' : 'Add New Support Ticket'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl" disabled={loading}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!editingId && nextTicketId && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-blue-900 mb-1">Ticket ID</label>
                <div className="text-lg font-semibold text-blue-800">{nextTicketId}</div>
              </div>
            )}

            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p: any) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Email + Search */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Email *</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((p: any) => ({ ...p, email: e.target.value }))}
                      className="flex-1 border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSearchEmail}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData((p: any) => ({ ...p, designation: e.target.value }))}
                    className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Customer & Site */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer & Site</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Customer *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData((p: any) => ({
                        ...p,
                        customerId: parseInt(e.target.value),
                        siteId: 0,
                      }))
                    }
                    className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                    disabled={!emailSearched || filteredCustomers.length === 0}
                  >
                    <option value={0}>Select Customer</option>
                    {filteredCustomers.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.addressBookID} - {c.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Site *</label>
                  <select
                    value={formData.siteId}
                    onChange={(e) => setFormData((p: any) => ({ ...p, siteId: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                    disabled={!emailSearched || filteredSites.length === 0}
                  >
                    <option value={0}>Select Site</option>
                    {filteredSites
                      .filter((s: any) => s.addressBookId === formData.customerId)
                      .map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.siteID} - {s.siteName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Describe Problem + Support Type */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Details</h3>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Describe the Problem *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Required Support Type *</label>
                  <select
                    value={formData.supportType}
                    onChange={(e) => setFormData((p: any) => ({ ...p, supportType: e.target.value }))}
                    className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select</option>
                    <option value="On-Site">On-Site</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData((p: any) => ({ ...p, priority: e.target.value }))}
                    className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData((p: any) => ({ ...p, contactPerson: e.target.value }))}
                    className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Contact Person Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData((p: any) => ({ ...p, contactNumber: e.target.value }))}
                    className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex-1">
                {editingId ? 'Update' : 'Add'} Ticket
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------- MAIN PAGE ---------------- */
export default function SupportTicketsPage() {
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextTicketId, setNextTicketId] = useState<string>('');
  const [filteredCustomers, setFilteredCustomers] = useState<AddressBook[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [emailSearched, setEmailSearched] = useState(false);

  const [formData, setFormData] = useState<SupportTicketFormData>({
    name: '',
    email: '',
    designation: '',
    customerId: 0,
    siteId: 0,
    description: '',
    supportType: '',
    priority: 'Medium',
    contactPerson: '',
    contactNumber: '',
    status: 'Open',
  });

  const API_URL = 'http://localhost:8000/support-tickets';

  const fetchSupportTickets = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setSupportTickets(Array.isArray(data) ? data : []);
    } catch {
      setSupportTickets([]);
    }
  };

  const handleSearchEmail = async () => {
    if (!formData.email.trim()) {
      alert('Please enter an email first.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/support-ticket-users');
      const data: SupportTicketUser[] = await res.json();
      const user = data.find((u) => u.email.toLowerCase() === formData.email.toLowerCase());

      if (user) {
        const customers = user.supportTicketMappings.map((m) => m.addressBook);
        const sitesData = user.supportTicketMappings.map((m) => m.site);
        setFilteredCustomers(customers);
        setFilteredSites(sitesData);
        setFormData((p) => ({ ...p, name: user.name || p.name }));
        setEmailSearched(true);
        alert(`Found user: ${user.name}`);
      } else {
        setFilteredCustomers([]);
        setFilteredSites([]);
        setEmailSearched(true);
        alert('Email not found — no customers.');
      }
    } catch (err) {
      console.error(err);
      alert('Error searching email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed');
      await fetchSupportTickets();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Error saving');
    }
  };

  const handleAddNew = () => setShowModal(true);

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Ticket
        </button>
      </div>

      <SupportTicketModal
        show={showModal}
        editingId={editingId}
        loading={loading}
        nextTicketId={nextTicketId}
        formData={formData}
        setFormData={setFormData}
        filteredCustomers={filteredCustomers}
        filteredSites={filteredSites}
        emailSearched={emailSearched}
        handleSearchEmail={handleSearchEmail}
        handleSubmit={handleSubmit}
        resetForm={() => setShowModal(false)}
      />

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Ticket ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Site</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Problem</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Support Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Contact Person</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Contact No.</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {supportTickets.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-6 py-3">{t.ticketID}</td>
                <td className="px-6 py-3">{t.name}</td>
                <td className="px-6 py-3">{t.email}</td>
                <td className="px-6 py-3">{t.customerId}</td>
                <td className="px-6 py-3">{t.siteId}</td>
                <td className="px-6 py-3">{t.description || '-'}</td>
                <td className="px-6 py-3">{t.supportType || '-'}</td>
                <td className="px-6 py-3">{t.priority || '-'}</td>
                <td className="px-6 py-3">{t.contactPerson || '-'}</td>
                <td className="px-6 py-3">{t.contactNumber || '-'}</td>
                <td className="px-6 py-3">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
