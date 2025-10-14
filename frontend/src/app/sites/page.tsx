'use client';

import { useState, useEffect } from 'react';

interface AddressBook {
  id: number;
  addressType: string;
  addressBookID: string;
  customerName: string;
  regdAddress: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
}

interface Site {
  id?: number;
  addressBookId: number;
  siteID?: string;
  siteName: string;
  siteAddress: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
}

interface SiteContact {
  id?: number;
  siteId: number;
  contactPerson: string;
  designation: string;
  contactNumber: string;
  emailAddress: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [contacts, setContacts] = useState<SiteContact[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressBookSearch, setAddressBookSearch] = useState('');
  const [showAddressBookDropdown, setShowAddressBookDropdown] = useState(false);
  const [isLoadingAddressBooks, setIsLoadingAddressBooks] = useState(true);
  const [formContacts, setFormContacts] = useState<SiteContact[]>([]);
  const [formData, setFormData] = useState<Site>({
    addressBookId: 0,
    siteName: '',
    siteAddress: '',
    city: '',
    state: '',
    pinCode: '',
    gstNo: '',
  });

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load address books and sites on component mount
  useEffect(() => {
    console.log('Component mounted, fetching address books and sites...');
    fetchAddressBooks();
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      console.log('Fetching sites from backend...');

      const response = await fetch('http://localhost:8000/sites');
      if (response.ok) {
        const data = await response.json();
        setSites(data);
        console.log('Sites loaded successfully:', data.length, 'entries');
      } else {
        console.error('Failed to fetch sites:', response.status, response.statusText);
        setSites([]);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.address-book-dropdown')) {
        setShowAddressBookDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAddressBooks = async () => {
    try {
      setIsLoadingAddressBooks(true);
      console.log('Starting to fetch address books...'); // Debug log

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('http://localhost:8000/address-book', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setAddressBooks(data);
        console.log('Address books loaded successfully:', data.length, 'entries'); // Debug log
      } else {
        console.error('Failed to fetch address books:', response.status, response.statusText);
        setAddressBooks([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching address books:', error);
      setAddressBooks([]); // Set empty array on error
    } finally {
      setIsLoadingAddressBooks(false);
      console.log('Finished loading address books'); // Debug log
    }
  };

  // Filter address books based on search
  const filteredAddressBooks = addressBooks.filter(ab => {
    // Only show results if there's actual search input (minimum 1 character)
    if (!addressBookSearch.trim() || addressBookSearch.trim().length < 1) {
      return false; // Don't show any results for empty or single character searches
    }

    const searchTerm = addressBookSearch.toLowerCase().trim();
    const customerName = (ab.customerName || '').toLowerCase();
    const addressBookID = (ab.addressBookID || '').toLowerCase();
    const addressType = (ab.addressType || '').toLowerCase();

    return customerName.includes(searchTerm) ||
      addressBookID.includes(searchTerm) ||
      addressType.includes(searchTerm);
  });

  // Filter sites based on search term
  const filteredSites = sites.filter(item =>
    item.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.siteID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.siteAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSites.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Debug logging
  console.log('Search term:', addressBookSearch);
  console.log('Total address books:', addressBooks.length);
  console.log('Filtered results:', filteredAddressBooks.length);

  const handleAddressBookSelect = (addressBook: AddressBook) => {
    setFormData({ ...formData, addressBookId: addressBook.id });
    setAddressBookSearch(`${addressBook.addressBookID} - ${addressBook.customerName}`);
    setShowAddressBookDropdown(false);
  };

  // Site Contact management functions
  const addContact = () => {
    const newContact: SiteContact = {
      siteId: 0, // Will be set when site is created
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

  const updateContact = (index: number, field: keyof SiteContact, value: string) => {
    const updatedContacts = [...formContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormContacts(updatedContacts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare site data without contacts
      const siteData = {
        addressBookId: formData.addressBookId,
        siteName: formData.siteName,
        siteAddress: formData.siteAddress,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
        gstNo: formData.gstNo,
      };

      if (editingId) {
        // Update existing site
        const response = await fetch(`http://localhost:8000/sites/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(siteData),
        });

        if (response.ok) {
          // Handle contacts separately
          for (const contact of formContacts) {
            if (contact.contactPerson.trim() && contact.designation.trim() && contact.contactNumber.trim() && contact.emailAddress.trim()) {
              if (contact.id) {
                // Update existing contact
                await fetch(`http://localhost:8000/sites/contacts/${contact.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contactPerson: contact.contactPerson,
                    designation: contact.designation,
                    contactNumber: contact.contactNumber,
                    emailAddress: contact.emailAddress,
                  }),
                });
              } else {
                // Create new contact
                await fetch(`http://localhost:8000/sites/${editingId}/contacts`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contactPerson: contact.contactPerson,
                    designation: contact.designation,
                    contactNumber: contact.contactNumber,
                    emailAddress: contact.emailAddress,
                  }),
                });
              }
            }
          }

          await fetchSites();
          closeModal();
        }
      } else {
        // Create new site
        const response = await fetch('http://localhost:8000/sites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(siteData),
        });

        if (response.ok) {
          const newSite = await response.json();

          // Create site contacts
          for (const contact of formContacts) {
            if (contact.contactPerson.trim() && contact.designation.trim() && contact.contactNumber.trim() && contact.emailAddress.trim()) {
              await fetch(`http://localhost:8000/sites/${newSite.id}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contactPerson: contact.contactPerson,
                  designation: contact.designation,
                  contactNumber: contact.contactNumber,
                  emailAddress: contact.emailAddress,
                }),
              });
            }
          }

          await fetchSites();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error submitting site:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = async (id: number) => {
    const item = sites.find(s => s.id === id);
    if (item) {
      setFormData(item);
      setEditingId(id);
      setShowForm(true);

      // Find the address book for this site and set the search field
      const addressBook = addressBooks.find(ab => ab.id === item.addressBookId);
      if (addressBook) {
        setAddressBookSearch(`${addressBook.addressBookID} - ${addressBook.customerName}`);
      }

      // Fetch existing site contacts
      try {
        const response = await fetch(`http://localhost:8000/sites/${id}/contacts`);
        if (response.ok) {
          const contactsData = await response.json();
          setFormContacts(contactsData);
        } else {
          setFormContacts([]);
        }
      } catch (error) {
        console.error('Error fetching site contacts:', error);
        setFormContacts([]);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this site?')) {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/sites/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSites(sites.filter(s => s.id !== id));
          console.log('Site deleted successfully');
        } else {
          console.error('Failed to delete site:', response.statusText);
        }
      } catch (error) {
        console.error('Error deleting site:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      addressBookId: 0,
      siteName: '',
      siteAddress: '',
      city: '',
      state: '',
      pinCode: '',
      gstNo: '',
    });
    setAddressBookSearch('');
    setShowAddressBookDropdown(false);
    setFormContacts([]);
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sites</h1>
        <p className="text-black">Manage customer sites and locations</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Site
        </button>

        {/* Search Bar */}
        <div className="w-full sm:w-64">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sites..."
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
                  {editingId ? 'Edit Site' : 'Add New Site'}
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
                  <div className="relative md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <div className="relative address-book-dropdown">
                      <input
                        type="text"
                        value={addressBookSearch}
                        onChange={(e) => {
                          setAddressBookSearch(e.target.value);
                          // Only show dropdown if there's meaningful input (at least 1 character)
                          if (e.target.value.trim().length > 0) {
                            setShowAddressBookDropdown(true);
                          } else {
                            setShowAddressBookDropdown(false);
                            setFormData({ ...formData, addressBookId: 0 });
                          }
                        }}
                        onFocus={() => {
                          console.log('Input focused, showing dropdown');
                          // Only show dropdown if there's some search text
                          if (addressBookSearch.trim().length > 0) {
                            setShowAddressBookDropdown(true);
                          }
                        }}
                        placeholder="Search customer..."
                        className="w-full border text-black border-gray-300 rounded-lg px-4 py-3  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      {showAddressBookDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {isLoadingAddressBooks ? (
                            <div className="px-3 py-2 text-gray-500 flex items-center justify-between">
                              <span>Loading customers/vendors...</span>
                              <button
                                onClick={() => {
                                  console.log('Manual retry clicked');
                                  fetchAddressBooks();
                                }}
                                className="text-black hover:text-blue-800 text-sm"
                              >
                                Retry
                              </button>
                            </div>
                          ) : filteredAddressBooks.length > 0 ? (
                            filteredAddressBooks.map((addressBook) => (
                              <div
                                key={addressBook.id}
                                onClick={() => handleAddressBookSelect(addressBook)}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">
                                  {addressBook.addressBookID} - {addressBook.customerName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {addressBook.regdAddress}
                                </div>
                              </div>
                            ))
                          ) : addressBooks.length === 0 ? (
                            <div className="px-3 py-2 text-gray-500">
                              No customers/vendors found in database. Please add some in the Address Book section first.
                            </div>
                          ) : addressBookSearch.trim().length === 0 ? (
                            <div className="px-3 py-2 text-gray-500">
                              Start typing to search for customers/vendors...
                            </div>
                          ) : (
                            <div className="px-3 py-2 text-gray-500">
                              No customers/vendors found matching "{addressBookSearch}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.addressBookId === 0 && addressBookSearch && (
                      <p className="text-red-500 text-sm mt-1">Please select a customer/vendor from the dropdown</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site/Branch Name *
                    </label>
                    <input
                      type="text"
                      value={formData.siteName}
                      onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Address *
                    </label>
                    <textarea
                      value={formData.siteAddress}
                      onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[100px]"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pin Code
                    </label>
                    <input
                      type="text"
                      value={formData.pinCode}
                      onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
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
                </div>

                {/* Site Contacts Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Site Contacts</h3>
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
                            required
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
                            required
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
                            required
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
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formContacts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium mb-1">No site contacts added yet</p>
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
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-md flex items-center gap-2"
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
                        {editingId ? 'Update Site' : 'Add Site'}
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
            <h2 className="text-xl font-semibold text-white">Sites</h2>
            <div className="text-white text-sm">
              Showing {currentItems.length} of {filteredSites.length} entries
              {searchTerm && (
                <span className="ml-2">(filtered from {sites.length} total)</span>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">ID</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Site ID</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Site Name</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Site Address</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-700 font-medium">{item.id}</td>
                  <td className="px-6 py-4 text-gray-700">{item.siteID}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{item.siteName}</td>
                  <td className="px-6 py-4 text-gray-700">{item.siteAddress}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(item.id!)}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
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
              <p className="text-lg font-medium">No sites found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first site to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages} • {filteredSites.length} entries
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
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
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