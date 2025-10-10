'use client';

import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface Site {
  id: number;
  siteID: string;
  siteName: string;
  addressBookId: number;
  siteAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
}

interface AddressBook {
  id: number;
  addressBookID: string;
  customerName: string;
  addressType: string;
  regdAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
}

interface SupportTicketMapping {
  id?: number;
  customerId: number;
  siteId: number;
}

interface SupportTicketUser {
  id?: number;
  name: string;
  email: string;
  designation?: string;
  contactNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  supportTicketMappings: SupportTicketMapping[];
}

interface SupportTicketUserFormData {
  name: string;
  email: string;
  designation: string;
  contactNumber: string;
  mappings: SupportTicketMapping[];
}

/* ------------------- MODAL COMPONENT ------------------- */
function SupportTicketUserModal({
  formData,
  loading,
  editingId,
  addressBooks,
  sites,
  onClose,
  onSubmit,
  onInputChange,
  addMapping,
  updateMapping,
  removeMapping,
}: {
  formData: SupportTicketUserFormData;
  loading: boolean;
  editingId: number | null;
  addressBooks: AddressBook[];
  sites: Site[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: keyof Omit<SupportTicketUserFormData, 'mappings'>, value: string) => void;
  addMapping: () => void;
  updateMapping: (index: number, field: keyof SupportTicketMapping, value: number) => void;
  removeMapping: (index: number) => void;
}) {
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent background clicks from stealing focus
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Support Ticket User' : 'Add New Support Ticket User'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => onInputChange('name', e.target.value)}
                  className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => onInputChange('email', e.target.value)}
                  className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => onInputChange('designation', e.target.value)}
                  className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Contact Number</label>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => onInputChange('contactNumber', e.target.value)}
                  className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mappings */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Customer-Site Mappings</h3>
                <button
                  type="button"
                  onClick={addMapping}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
                  disabled={loading}
                >
                  Add Mapping
                </button>
              </div>

              {formData.mappings.length === 0 ? (
                <div className="text-center text-black py-4 border-2 border-dashed border-gray-300 text-black rounded-lg">
                  No mappings added. Click "Add Mapping" to assign customers and sites.
                </div>
              ) : (
                formData.mappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Customer *</label>
                      <select
                        value={mapping.customerId}
                        onChange={(e) => updateMapping(index, 'customerId', parseInt(e.target.value))}
                        className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={loading}
                      >
                        <option value={0}>Select Customer</option>
                        {addressBooks.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.addressBookID} - {customer.customerName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Site *</label>
                      <select
                        value={mapping.siteId}
                        onChange={(e) => updateMapping(index, 'siteId', parseInt(e.target.value))}
                        className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={loading || mapping.customerId === 0}
                      >
                        <option value={0}>Select Site</option>
                        {sites
                          .filter(site => site.addressBookId === mapping.customerId)
                          .map(site => (
                            <option key={site.id} value={site.id}>
                              {site.siteID} - {site.siteName}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeMapping(index)}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Support Ticket User
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Render modal using React Portal (keeps focus intact)
  if (typeof window !== 'undefined') {
    const modalRoot = document.getElementById('modal-root') || document.body;
    return ReactDOM.createPortal(modalContent, modalRoot);
  }
  return null;
}

/* ------------------- MAIN PAGE ------------------- */

export default function SupportTicketUsersPage() {
  const [supportTicketUsers, setSupportTicketUsers] = useState<SupportTicketUser[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<SupportTicketUserFormData>({
    name: '',
    email: '',
    designation: '',
    contactNumber: '',
    mappings: [],
  });

  const API_URL = 'http://localhost:8000/support-ticket-users';

  useEffect(() => {
    fetchSupportTicketUsers();
    fetchSites();
    fetchAddressBooks();
  }, []);

  const fetchSupportTicketUsers = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setSupportTicketUsers(Array.isArray(data) ? data : []);
    } catch {
      setSupportTicketUsers([]);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetch('http://localhost:8000/sites');
      const data = await res.json();
      setSites(Array.isArray(data) ? data : []);
    } catch {
      setSites([]);
    }
  };

  const fetchAddressBooks = async () => {
    try {
      const res = await fetch('http://localhost:8000/address-book');
      const data = await res.json();
      setAddressBooks(Array.isArray(data) ? data.filter((ab: AddressBook) => ab.addressType === 'Customer') : []);
    } catch {
      setAddressBooks([]);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', designation: '', contactNumber: '', mappings: [] });
    setEditingId(null);
    setShowModal(false);
  };

  const handleInputChange = (field: keyof Omit<SupportTicketUserFormData, 'mappings'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validMappings = formData.mappings.filter(m => m.customerId > 0 && m.siteId > 0);
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mappings: validMappings }),
      });
      await fetchSupportTicketUsers();
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    const user = supportTicketUsers.find(u => u.id === id);
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        designation: user.designation || '',
        contactNumber: user.contactNumber || '',
        mappings: user.supportTicketMappings.map(m => ({ customerId: m.customerId, siteId: m.siteId })),
      });
      setEditingId(id);
      setShowModal(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    await fetchSupportTicketUsers();
  };

  const addMapping = () => {
    setFormData(prev => ({ ...prev, mappings: [...prev.mappings, { customerId: 0, siteId: 0 }] }));
  };

  const removeMapping = (index: number) => {
    setFormData(prev => ({ ...prev, mappings: prev.mappings.filter((_, i) => i !== index) }));
  };

  const updateMapping = (index: number, field: keyof SupportTicketMapping, value: number) => {
    setFormData(prev => {
      const updated = [...prev.mappings];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'customerId') updated[index].siteId = 0;
      return { ...prev, mappings: updated };
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Support Ticket Users</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New
        </button>
      </div>

      {showModal && (
        <SupportTicketUserModal
          formData={formData}
          loading={loading}
          editingId={editingId}
          addressBooks={addressBooks}
          sites={sites}
          onClose={resetForm}
          onSubmit={onSubmit}
          onInputChange={handleInputChange}
          addMapping={addMapping}
          updateMapping={updateMapping}
          removeMapping={removeMapping}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {supportTicketUsers.map((user) => (
              <tr key={user.id}>                
                <td className="px-6 py-4 text-black whitespace-nowrap">{user.id}</td>
                <td className="px-6 py-4 text-black whitespace-nowrap">{user.name}</td>
                <td className="px-6 py-4 text-black whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 text-black whitespace-nowrap space-x-2"> 
                  <button
                    onClick={() => handleEdit(user.id!)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id!)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {supportTicketUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-black">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



