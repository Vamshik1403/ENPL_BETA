'use client';

import { useEffect, useState, useMemo } from 'react';

/* ---------------- Types ---------------- */

interface Customer {
  id: number;
  customerName: string;
}

interface Site {
  id: number;
  siteName: string;
  addressBookId: number;
}

interface ContactSiteRow {
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
}

interface CustomerContact {
  id: number;
  custFirstName: string;
  custLastName: string;
  phoneNumber: string;
  emailAddress: string;
  sites: {
    id: number; // mappingId
    customerId: number;
    siteId: number;
    addressBook: Customer;
    site: Site;
  }[];
}

interface PermissionSet {
  edit: boolean;
  read: boolean;
  create: boolean;
  delete: boolean;
}

interface AllPermissions {
  [key: string]: PermissionSet;
}

interface UserPermissionResponse {
  id: number;
  userId: number;
  permissions: {
    permissions: AllPermissions;
  };
  createdAt: string;
  updatedAt: string;
}

/* ---------------- Icons ---------------- */

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RemoveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ========================================================= */

export default function CustomerContactPage() {
  const API = 'https://ristarerp.openwan.in/backend/customer-contact';
  const PERMISSIONS_API = 'https://ristarerp.openwan.in/backend/user-permissions';

  const [records, setRecords] = useState<CustomerContact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // New states for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Permissions state
  const [allPermissions, setAllPermissions] = useState<AllPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  
  const [userId, setUserId] = useState<number | null>(null);

  const [customerRegPermissions, setCustomerRegPermissions] = useState<PermissionSet>({
    edit: false,
    read: false,
    create: false,
    delete: false
  });

  /* -------- Person Form -------- */

  const [form, setForm] = useState({
    custFirstName: '',
    custLastName: '',
    phoneNumber: '',
    emailAddress: '',
  });

  /* -------- Mapping Draft -------- */

  const [draftCustomerId, setDraftCustomerId] = useState<number>(0);
  const [draftSiteId, setDraftSiteId] = useState<number>(0);
  const [rows, setRows] = useState<ContactSiteRow[]>([]);

  /* ---------------- Fetch ---------------- */

  const fetchAll = async () => {
    const res = await fetch(API);
    setRecords(await res.json());
  };

  const fetchCustomers = async () => {
    const res = await fetch('https://ristarerp.openwan.in/backend/address-book');
    setCustomers(await res.json());
  };

  const fetchSites = async (customerId: number) => {
    if (!customerId) {
      setSites([]);
      return;
    }
    const res = await fetch(
      `https://ristarerp.openwan.in/backend/sites/based-on-cust?addressBookId=${customerId}`,
    );
    setSites(await res.json());
  };

const fetchPermissions = async (uid: number) => {
    try {

const res = await fetch(`${PERMISSIONS_API}/${uid}`);
      if (!res.ok) throw new Error('Failed to fetch permissions');

      const data: UserPermissionResponse = await res.json();

      // 🔥 THIS is the real permissions object
      const perms = data?.permissions?.permissions ?? {};

      setAllPermissions(perms);
localStorage.setItem('userPermissions', JSON.stringify(perms));

      setCustomerRegPermissions(
        perms.CUSTOMER_REGISTRATION ?? {
          read: false,
          create: false,
          edit: false,
          delete: false,
        }
      );
      
      console.log('✅ Permissions loaded successfully:', {
        allPermissions: perms,
        customerRegPermissions: perms.CUSTOMER_REGISTRATION,
        hasCreate: perms.CUSTOMER_REGISTRATION?.create,
        hasRead: perms.CUSTOMER_REGISTRATION?.read,
        hasEdit: perms.CUSTOMER_REGISTRATION?.edit,
        hasDelete: perms.CUSTOMER_REGISTRATION?.delete
      });
    } catch (err) {
      console.error('❌ Error fetching permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  };

useEffect(() => {
  fetchAll();
  fetchCustomers();
}, []);

useEffect(() => {
  if (userId) {
    fetchPermissions(userId);
  }
}, [userId]);


  useEffect(() => {
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) {
    setUserId(Number(storedUserId));
  }
}, []);

  /* ---------------- Search & Pagination ---------------- */

  const filteredRecords = useMemo(() => {
    console.log('Checking read permission for filtering:', customerRegPermissions.read);
    
    if (!customerRegPermissions.read && !loadingPermissions) {
      return [];
    }
    
    return records.filter(record => {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.custFirstName.toLowerCase().includes(searchLower) ||
        record.custLastName.toLowerCase().includes(searchLower) ||
        record.phoneNumber.includes(searchTerm) ||
        record.emailAddress.toLowerCase().includes(searchLower) ||
        record.sites.some(site => 
          site.site.siteName.toLowerCase().includes(searchLower)
        )
      );
    });
  }, [records, searchTerm, customerRegPermissions.read, loadingPermissions]);

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredRecords, currentPage]);

  /* ---------------- Helpers ---------------- */

  const resetModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({
      custFirstName: '',
      custLastName: '',
      phoneNumber: '',
      emailAddress: '',
    });
    setRows([]);
    setDraftCustomerId(0);
    setDraftSiteId(0);
    setSites([]);
  };

  const addRow = () => {
    if (!draftCustomerId || !draftSiteId) {
      alert('Select customer and site');
      return;
    }

    const cust = customers.find(c => c.id === draftCustomerId);
    const site = sites.find(s => s.id === draftSiteId);
    if (!cust || !site) return;

    const exists = rows.some(
      r => r.customerId === cust.id && r.siteId === site.id,
    );
    if (exists) {
      alert('This customer-site is already added');
      return;
    }

    setRows(prev => [
      ...prev,
      {
        customerId: cust.id,
        customerName: cust.customerName,
        siteId: site.id,
        siteName: site.siteName,
      },
    ]);

    setDraftSiteId(0);
  };

  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  /* ---------------- Submit ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rows.length) {
      alert('Add at least one Customer + Site');
      return;
    }

    const payload = {
      ...form,
      sites: rows.map(r => ({
        customerId: r.customerId,
        siteId: r.siteId,
      })),
    };

    const url = editingId ? `${API}/${editingId}` : API;
    const method = editingId ? 'PATCH' : 'POST';

    // Check permissions before submitting
    if (editingId && !customerRegPermissions.edit) {
      alert('You do not have permission to edit contacts');
      return;
    }
    
    if (!editingId && !customerRegPermissions.create) {
      alert('You do not have permission to create contacts');
      return;
    }

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    await fetchAll();
    resetModal();
  };

  /* ---------------- Edit ---------------- */

  const handleEdit = (item: CustomerContact) => {
    if (!customerRegPermissions.edit) {
      alert('You do not have permission to edit contacts');
      return;
    }
    
    setEditingId(item.id);
    setShowModal(true);

    setForm({
      custFirstName: item.custFirstName,
      custLastName: item.custLastName,
      phoneNumber: item.phoneNumber,
      emailAddress: item.emailAddress,
    });

    setRows(
      item.sites.map(s => ({
        customerId: s.customerId,
        customerName: s.addressBook.customerName,
        siteId: s.siteId,
        siteName: s.site.siteName,
      })),
    );
  };

  /* ---------------- Delete Contact ---------------- */

  const deleteContact = async (contactId: number) => {
    if (!customerRegPermissions.delete) {
      alert('You do not have permission to delete contacts');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    await fetch(`${API}/${contactId}`, { method: 'DELETE' });
    fetchAll();
  };

  /* ---------------- Delete Mapping ---------------- */

  const deleteMappedSite = async (mappingId: number) => {
    if (!customerRegPermissions.delete) {
      alert('You do not have permission to delete site mappings');
      return;
    }
    
    if (!confirm('Remove this site from contact?')) return;
    await fetch(
      `https://ristarerp.openwan.in/backend/customer-contact/site/${mappingId}`,
      { method: 'DELETE' },
    );
    fetchAll();
  };

  /* ========================================================= */

  // Show loading state while permissions are being fetched
  if (loadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have read permission, show access denied
  if (!customerRegPermissions.read) {
    console.log('Access Denied - Current state:', {
      allPermissions,
      customerRegPermissions,
      keys: Object.keys(allPermissions),
      hasPermission: 'CUSTOMER_REGISTRATION' in allPermissions,
      loading: loadingPermissions
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view customer contacts.</p>
          <div className="mt-4 p-3 bg-gray-100 rounded text-left">
            <p className="text-sm text-gray-600">Debug info:</p>
            <p className="text-xs text-gray-500">All permission keys: {Object.keys(allPermissions).join(', ') || 'None'}</p>
            <p className="text-xs text-gray-500">CUSTOMER_REGISTRATION exists: {'CUSTOMER_REGISTRATION' in allPermissions ? 'Yes' : 'No'}</p>
            <p className="text-xs text-gray-500">CUSTOMER_REGISTRATION permissions: {JSON.stringify(customerRegPermissions)}</p>
            <p className="text-xs text-gray-500">All permissions: {JSON.stringify(allPermissions)}</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('Permissions loaded successfully:', {
    allPermissions,
    customerRegPermissions,
    hasCreate: customerRegPermissions.create,
    hasRead: customerRegPermissions.read,
    hasEdit: customerRegPermissions.edit,
    hasDelete: customerRegPermissions.delete
  });

  return (
    <div className="min-h-screen -mt-10 text-black bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Customer Contact Management
          </h1>
         
        </div>

        {/* Action Bar */}
        <div className="bg-white text-black rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-auto md:flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search contacts by name, phone, email, or site..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            {/* ADD BUTTON - controlled by create permission */}
            <button
              onClick={() => {
                if (customerRegPermissions.create) {
                  setShowModal(true);
                } else {
                  alert('You do not have permission to create contacts');
                }
              }}
              disabled={!customerRegPermissions.create}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 transition duration-200 font-medium shadow-sm hover:shadow-md ${
                customerRegPermissions.create
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
              }`}
              title={customerRegPermissions.create ? "Add new contact" : "No create permission"}
            >
              <PlusIcon />
              Add New Contact
            </button>
          </div>
        </div>

        {/* ================= MODAL ================= */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl animate-fadeIn">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Contact' : 'Create New Contact'}
                  </h2>
                 
                </div>
                <button
                  onClick={resetModal}
                  className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Person Details */}
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        placeholder="Enter first name"
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        value={form.custFirstName}
                        onChange={e => setForm({ ...form, custFirstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        placeholder="Enter last name"
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        value={form.custLastName}
                        onChange={e => setForm({ ...form, custLastName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        placeholder="Enter phone number"
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        value={form.phoneNumber}
                        onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        value={form.emailAddress}
                        onChange={e => setForm({ ...form, emailAddress: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Customer + Site Assignment */}
                <div className="bg-blue-50 p-5 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Sites</h3>
                  
                  {/* Customer and Site Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-6">
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer *
                      </label>
                      <select
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        value={draftCustomerId || ''}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          setDraftCustomerId(id);
                          setDraftSiteId(0);
                          fetchSites(id);
                        }}
                      >
                        <option value="">Select a customer</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.customerName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site *
                      </label>
                      <select
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        value={draftSiteId || ''}
                        disabled={!draftCustomerId}
                        onChange={e => setDraftSiteId(Number(e.target.value))}
                      >
                        <option value="">Select a site</option>
                        {sites.map(s => (
                          <option key={s.id} value={s.id}>{s.siteName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={addRow}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition duration-200 shadow-sm hover:shadow-md"
                      >
                        Add Site
                      </button>
                    </div>
                  </div>

                  {/* Added Sites Table */}
                  {rows.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900">Assigned Sites ({rows.length})</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Site</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {rows.map((r, i) => (
                              <tr key={i} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3 text-sm text-gray-900">{r.customerName}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{r.siteName}</td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeRow(i)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-md transition text-sm font-medium"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition duration-200 shadow-sm hover:shadow-md ${
                      editingId 
                        ? (customerRegPermissions.edit 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70')
                        : (customerRegPermissions.create 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70')
                    }`}
                    disabled={editingId ? !customerRegPermissions.edit : !customerRegPermissions.create}
                    title={editingId 
                      ? (customerRegPermissions.edit ? "Update contact" : "No edit permission") 
                      : (customerRegPermissions.create ? "Create contact" : "No create permission")
                    }
                  >
                    {editingId ? 'Update Contact' : 'Create Contact'}
                  </button>
                  <button
                    type="button"
                    onClick={resetModal}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= LIST TABLE ================= */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Table Header with Stats */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Contacts</h3>
                <p className="text-sm text-gray-600">
                  Showing {paginatedRecords.length} of {filteredRecords.length} contacts
                </p>
              </div>
              {filteredRecords.length > recordsPerPage && (
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Assigned Sites
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRecords.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-semibold">
                            {r.custFirstName[0]}{r.custLastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {r.custFirstName} {r.custLastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{r.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{r.emailAddress}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {r.sites.map(s => (
                          <span
                            key={s.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {s.site.siteName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* EDIT ICON - controlled by edit permission */}
                        <button
                          onClick={() => handleEdit(r)}
                          disabled={!customerRegPermissions.edit}
                          className={`p-2 rounded-lg transition ${
                            customerRegPermissions.edit
                              ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer'
                              : 'text-gray-400 cursor-not-allowed opacity-70'
                          }`}
                          title={customerRegPermissions.edit ? "Edit contact" : "No edit permission"}
                        >
                          <EditIcon />
                        </button>
                        
                        {/* DELETE ICON - controlled by delete permission */}
                        <button
                          onClick={async () => {
                            if (customerRegPermissions.delete) {
                              deleteContact(r.id);
                            } else {
                              alert('You do not have permission to delete contacts');
                            }
                          }}
                          disabled={!customerRegPermissions.delete}
                          className={`p-2 rounded-lg transition ${
                            customerRegPermissions.delete
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer'
                              : 'text-gray-400 cursor-not-allowed opacity-70'
                          }`}
                          title={customerRegPermissions.delete ? "Delete contact" : "No delete permission"}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-600 mb-2">No contacts found</h4>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first contact'}
                      </p>
                      {!searchTerm && customerRegPermissions.create && (
                        <button
                          onClick={() => setShowModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                        >
                          <PlusIcon />
                          Add First Contact
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * recordsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * recordsPerPage, filteredRecords.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredRecords.length}</span> contacts
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}