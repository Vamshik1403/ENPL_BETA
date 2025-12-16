'use client';

import { useState, useEffect } from 'react';

interface AddressBook {
  id?: number;
  addressType: string;
  addressBookID: string;
  customerName: string;
  regdAddress: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo: string;
}

interface AddressBookContact {
  id?: number;
  addressBookId: number;
  contactPerson: string;
  designation: string;
  contactNumber: string;
  emailAddress: string;
}

// Permission types
type CrudPerm = { read: boolean; create: boolean; edit: boolean; delete: boolean };
type PermissionsJson = Record<string, CrudPerm>;

export default function AddressBookPage() {
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddressBook>({
    addressType: 'Customer',
    addressBookID: '',
    customerName: '',
    regdAddress: '',
    city: '',
    state: '',
    pinCode: '',
    gstNo: '',
  });
  const [generatedId, setGeneratedId] = useState<string>('');
  const [formContacts, setFormContacts] = useState<AddressBookContact[]>([]);
  const [permissions, setPermissions] = useState<PermissionsJson | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Get userId from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  // Load data from backend on component mount
  useEffect(() => {
    fetchAddressBooks();
    if (userId) {
      fetchUserPermissions(userId);
    }
  }, [userId]);

  // Fetch user permissions with dynamic userId
  const fetchUserPermissions = async (userId: number) => {
    try {
      console.log('Fetching permissions for userId:', userId);
      
      // Try to get token from localStorage
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/user-permissions/${userId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Full permissions API response:', data);
        
        // EXTRACTION LOGIC FOR YOUR API STRUCTURE:
        // Your API returns: { id: 1, userId: 1, permissions: { permissions: { CUSTOMERS: {...} } } }
        let permissionsData = null;
        
        if (data && data.permissions) {
          // First level: data.permissions
          console.log('data.permissions:', data.permissions);
          
          if (data.permissions.permissions) {
            // Second level: data.permissions.permissions
            permissionsData = data.permissions.permissions;
            console.log('Extracted permissions from data.permissions.permissions:', permissionsData);
          } else {
            // If permissions is directly the object
            permissionsData = data.permissions;
            console.log('Extracted permissions from data.permissions:', permissionsData);
          }
        } else {
          // If data is directly the permissions object
          permissionsData = data;
          console.log('Using data directly as permissions:', permissionsData);
        }
        
        if (permissionsData) {
          setPermissions(permissionsData);
          console.log('CUSTOMERS permissions set to:', permissionsData.CUSTOMERS);
          
          // Store in localStorage for persistence
          localStorage.setItem('userPermissions', JSON.stringify(permissionsData));
        } else {
          console.error('No permissions data found in response');
          // Set default permissions
          setPermissions({});
        }
      } else {
        console.error('Failed to fetch permissions:', response.status, response.statusText);
        // Fallback to localStorage if API fails
        const stored = localStorage.getItem('userPermissions');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log('Using stored permissions from localStorage:', parsed);
            setPermissions(parsed);
          } catch (e) {
            console.error('Error parsing stored permissions:', e);
            setPermissions({});
          }
        } else {
          setPermissions({});
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Fallback to localStorage if API fails
      const stored = localStorage.getItem('userPermissions');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('Error fallback - Using stored permissions:', parsed);
          setPermissions(parsed);
        } catch (e) {
          console.error('Error parsing stored permissions:', e);
          setPermissions({});
        }
      } else {
        setPermissions({});
      }
    }
  };

  useEffect(() => {
    const pin = formData.pinCode;

    if (!pin || pin.length !== 6) return; // Only lookup when 6 digits

    const fetchCityState = async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();

        if (data[0].Status === "Success") {
          const office = data[0].PostOffice[0];

          setFormData(prev => ({
            ...prev,
            city: office.District,
            state: office.State
          }));
        }
      } catch (err) {
        console.error("PIN lookup error:", err);
      }
    };

    fetchCityState();
  }, [formData.pinCode]);

  const fetchAddressBooks = async () => {
    try {
      const response = await fetch('http://localhost:8000/address-book');
      if (response.ok) {
        const data = await response.json();
        setAddressBooks(data);
      }
    } catch (error) {
      console.error('Error fetching address books:', error);
    }
  };

  // Filter address books based on search term
  const filteredAddressBooks = addressBooks.filter(item =>
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.addressBookID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.gstNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.regdAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAddressBooks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAddressBooks.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Get CUSTOMERS permissions with safe defaults
  const customersPerm = {
    read: permissions?.CUSTOMERS?.read ?? false,
    create: permissions?.CUSTOMERS?.create ?? false,
    edit: permissions?.CUSTOMERS?.edit ?? false,
    delete: permissions?.CUSTOMERS?.delete ?? false,
  };

  console.log('Current customersPerm:', customersPerm);

  const generateAddressBookId = async (addressType: string) => {
    try {
      const response = await fetch(`http://localhost:8000/address-book/next-id/${addressType}`);
      const data = await response.json();
      return data.nextId;
    } catch (error) {
      console.error('Error generating ID:', error);
      // Fallback to local generation
      const customerCount = addressBooks.filter(ab => ab.addressType === 'Customer').length;
      const vendorCount = addressBooks.filter(ab => ab.addressType === 'Vendor').length;

      if (addressType === 'Customer') {
        const nextNumber = String(customerCount + 1).padStart(3, '0');
        return `CUS/${nextNumber}`;
      } else if (addressType === 'Vendor') {
        const nextNumber = String(vendorCount + 1).padStart(3, '0');
        return `VEN/${nextNumber}`;
      }
      return '';
    }
  };

  const addContact = () => {
    const newContact: AddressBookContact = {
      addressBookId: 0, // Will be set when address book is created
      contactPerson: '',
      designation: '',
      contactNumber: '',
      emailAddress: '',
    };
    setFormContacts([...formContacts, newContact]);
  };

  const removeContact = (index: number) => {
    setFormContacts(formContacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof AddressBookContact, value: string) => {
    const updatedContacts = [...formContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormContacts(updatedContacts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has create/edit permission - USING CUSTOMERS PERMISSIONS
    if ((!editingId && !customersPerm.create) || (editingId && !customersPerm.edit)) {
      alert('You do not have permission to perform this action');
      return;
    }
    
    setLoading(true);

    console.log('Form submission started:', { editingId, formData, formContacts });

    try {
      if (editingId) {
        // Update existing record
        console.log('Updating existing record with ID:', editingId);
        // Only send the fields that should be updated, excluding nested objects and addressBookID
        const updateData = {
          addressType: formData.addressType,
          customerName: formData.customerName,
          regdAddress: formData.regdAddress,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
          gstNo: formData.gstNo,
        };

        console.log('Update data being sent:', updateData);

        const response = await fetch(`http://localhost:8000/address-book/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        console.log('Update response status:', response.status);

        if (response.ok) {
          console.log('Record updated successfully');

          // Handle contacts separately with better error handling
          try {
            for (const contact of formContacts) {
              if (contact.contactPerson.trim() && contact.designation.trim() && contact.contactNumber.trim() && contact.emailAddress.trim()) {
                if (contact.id) {
                  // Update existing contact
                  console.log('Updating existing contact:', contact.id);
                  const contactResponse = await fetch(`http://localhost:8000/address-book/contacts/${contact.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contactPerson: contact.contactPerson,
                      designation: contact.designation,
                      contactNumber: contact.contactNumber,
                      emailAddress: contact.emailAddress,
                    }),
                  });

                  if (!contactResponse.ok) {
                    console.error('Failed to update contact:', contact.id, contactResponse.status);
                  }
                } else {
                  // Create new contact
                  console.log('Creating new contact for address book:', editingId);
                  const contactResponse = await fetch('http://localhost:8000/addressbookcontact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...contact,
                      addressBookId: editingId,
                    }),
                  });

                  if (!contactResponse.ok) {
                    console.error('Failed to create contact:', contactResponse.status);
                  }
                }
              }
            }
          } catch (contactError) {
            console.error('Error handling contacts:', contactError);
            // Don't fail the entire update if contacts fail
          }

          await fetchAddressBooks(); // Refresh the list
          setShowForm(false);
          setEditingId(null);
          resetForm();
          console.log('Form reset and closed');
        } else {
          console.error('Failed to update record:', response.status, response.statusText);
        }
      } else {
        // Create new record
        console.log('Creating new record');
        const response = await fetch('http://localhost:8000/address-book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newAddressBook = await response.json();

          // Create contacts for this address book
          for (const contact of formContacts) {
            if (contact.contactPerson.trim() && contact.designation.trim() && contact.contactNumber.trim() && contact.emailAddress.trim()) {
              await fetch('http://localhost:8000/addressbookcontact', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...contact,
                  addressBookId: newAddressBook.id,
                }),
              });
            }
          }

          await fetchAddressBooks(); // Refresh the list
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving address book:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      addressType: 'Customer',
      addressBookID: '',
      customerName: '',
      regdAddress: '',
      city: '',
      state: '',
      pinCode: '',
      gstNo: '',
    });
    setGeneratedId('');
    setFormContacts([]);
  };

  const handleEdit = async (id: number) => {
    // Check edit permission - USING CUSTOMERS PERMISSION
    if (!customersPerm.edit) {
      alert('You do not have permission to edit customers');
      return;
    }
    
    const item = addressBooks.find(a => a.id === id);
    if (item) {
      setFormData(item);
      setGeneratedId(item.addressBookID);
      setEditingId(id);
      setShowForm(true);

      // Fetch existing contacts for this address book
      try {
        const response = await fetch(`http://localhost:8000/address-book/${id}/contacts`);
        if (response.ok) {
          const contactsData = await response.json();
          setFormContacts(contactsData);
        } else {
          setFormContacts([]);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setFormContacts([]);
      }
    }
  };

  const handleDelete = async (id: number) => {
    // Check delete permission - USING CUSTOMERS PERMISSION
    if (!customersPerm.delete) {
      alert('You do not have permission to delete customers');
      return;
    }
    
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await fetch(`http://localhost:8000/address-book/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchAddressBooks(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-8 -mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Address Book</h1>
        {permissions && (
          <div className="text-sm text-gray-600 mb-2">
            <div className="mb-2">
              User ID: <span className="font-semibold">{userId || 'Not logged in'}</span>
            </div>
            <div className="mb-1">
              <span className="font-medium">CUSTOMERS Permissions:</span>
              <span className={`ml-2 px-2 py-1 rounded ${customersPerm.read ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                Read: {customersPerm.read ? 'Yes' : 'No'}
              </span>
              <span className={`ml-2 px-2 py-1 rounded ${customersPerm.create ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                Create: {customersPerm.create ? 'Yes' : 'No'}
              </span>
              <span className={`ml-2 px-2 py-1 rounded ${customersPerm.edit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                Edit: {customersPerm.edit ? 'Yes' : 'No'}
              </span>
              <span className={`ml-2 px-2 py-1 rounded ${customersPerm.delete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                Delete: {customersPerm.delete ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        )}
        <div className="text-xs text-gray-500">
          API Endpoint: http://localhost:8000/user-permissions/{userId}
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <button
          onClick={async () => {
            // Check create permission - USING CUSTOMERS PERMISSION
            if (!customersPerm.create) {
              alert('You do not have permission to add new customers');
              return;
            }
            
            setEditingId(null);
            const generatedId = await generateAddressBookId('Customer');
            setGeneratedId(generatedId);
            setFormData({
              addressType: 'Customer',
              addressBookID: generatedId,
              customerName: '',
              regdAddress: '',
              city: '',
              state: '',
              pinCode: '',
              gstNo: '',
            });
            setShowForm(true);
          }}
          disabled={!customersPerm.create}
          className={`px-6 py-3 rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${
            customersPerm.create
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={customersPerm.create ? 'Add new customer' : 'No permission to create'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>

        {/* Search Bar */}
        <div className="w-full sm:w-64">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-black px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingId ? 'Edit' : 'Add'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-lg p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Type
                    </label>
                    <input
                      type="text"
                      value="Customer"
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Book ID
                    </label>
                    <input
                      type="text"
                      value={editingId ? formData.addressBookID : (generatedId || '')}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 text-gray-600"
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registered Address *
                    </label>
                    <textarea
                      value={formData.regdAddress}
                      onChange={(e) => setFormData({ ...formData, regdAddress: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[100px]"
                      required
                    ></textarea>
                  </div>
                 
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Pin Code
  </label>
  <input
    type="text"
    value={formData.pinCode}
    maxLength={6}
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, '');
      setFormData({ ...formData, pinCode: value });
    }}
    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
  />
</div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={formData.gstNo}
                      onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City(filled automatically by pincode)
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State(filled automatically by pincode)
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      readOnly
                    />
                  </div>
                </div>

                {/* Contacts Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
                    <button
                      type="button"
                      onClick={addContact}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Contact
                    </button>
                  </div>

                  {formContacts.map((contact, index) => (
                    <div key={index} className="bg-gray-50 p-6 rounded-lg mb-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-700 text-lg">Contact {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Person *
                          </label>
                          <input
                            type="text"
                            value={contact.contactPerson}
                            onChange={(e) => updateContact(index, 'contactPerson', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Designation *
                          </label>
                          <input
                            type="text"
                            value={contact.designation}
                            onChange={(e) => updateContact(index, 'designation', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Number *
                          </label>
                          <input
                            type="text"
                            value={contact.contactNumber}
                            onChange={(e) => updateContact(index, 'contactNumber', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={contact.emailAddress}
                            onChange={(e) => updateContact(index, 'emailAddress', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formContacts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium mb-1">No contacts added yet</p>
                      <p className="text-sm">Click "Add Contact" to add contact information</p>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (editingId ? !customersPerm.edit : !customersPerm.create)}
                    className={`px-8 py-3 rounded-lg font-medium shadow-md flex items-center gap-2 ${
                      loading || (editingId ? !customersPerm.edit : !customersPerm.create)
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editingId ? 'Update ' : 'Add'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Address Book Entries</h2>
            <div className="text-white text-sm">
              Showing {currentItems.length} of {filteredAddressBooks.length} entries
              {searchTerm && (
                <span className="ml-2">(filtered from {addressBooks.length} total)</span>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Customer ID</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Customer Name</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">GST No</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-700">{item.addressBookID}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{item.customerName}</td>
                  <td className="px-6 py-4 text-gray-700 font-mono">{item.gstNo || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      {/* EDIT */}
                      <button
                        onClick={() => handleEdit(item.id!)}
                        disabled={!customersPerm.edit}
                        className={`transition-colors p-2 rounded
                          ${
                            customersPerm.edit
                              ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer'
                              : 'text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        aria-label="Edit"
                        title={customersPerm.edit ? 'Edit' : 'No permission to edit'}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => handleDelete(item.id!)}
                        disabled={!customersPerm.delete}
                        className={`transition-colors p-2 rounded
                          ${
                            customersPerm.delete
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer'
                              : 'text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        aria-label="Delete"
                        title={customersPerm.delete ? 'Delete' : 'No permission to delete'}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Show message when no results found */}
          {currentItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages} • {filteredAddressBooks.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border text-black border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`px-3 py-1 border text-sm rounded transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-black hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border text-black border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}