'use client';

import { useState, useEffect, useRef } from 'react';

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
  useCustomerData?: boolean;
}

interface SiteContact {
  id?: number;
  siteId: number;
  contactPerson: string;
  designation: string;
  contactNumber: string;
  emailAddress: string;
}

// Permission types
type CrudPerm = { read: boolean; create: boolean; edit: boolean; delete: boolean };
type PermissionsJson = Record<string, CrudPerm>;

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressBookSearch, setAddressBookSearch] = useState('');
  const [showAddressBookDropdown, setShowAddressBookDropdown] = useState(false);
  const [isLoadingAddressBooks, setIsLoadingAddressBooks] = useState(true);
  const [formContacts, setFormContacts] = useState<SiteContact[]>([]);
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

  // Load address books, sites and permissions on component mount
  useEffect(() => {
    console.log('Component mounted, fetching address books and sites...');
    fetchAddressBooks();
    fetchSites();
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
        // Your API returns: { id: 1, userId: 1, permissions: { permissions: { SITES: {...} } } }
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
          console.log('SITES permissions set to:', permissionsData.SITES);
          
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

  const [formData, setFormData] = useState<Site>({
    addressBookId: 0,
    siteName: '',
    siteAddress: '',
    city: '',
    state: '',
    pinCode: '',
    gstNo: '',
    useCustomerData: false
  });

  const fetchSites = async () => {
    try {
      setLoading(true);
      console.log('Fetching sites from backend...');

      const response = await fetch('http://localhost:8000/sites');
      if (response.ok) {
        const data = await response.json();
        setSites(data);
        console.log('Branches loaded successfully:', data.length, 'entries');
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

  // Get SITES permissions with safe defaults
  const sitesPerm = {
    read: permissions?.SITES?.read ?? false,
    create: permissions?.SITES?.create ?? false,
    edit: permissions?.SITES?.edit ?? false,
    delete: permissions?.SITES?.delete ?? false,
  };

// add these at top of your component
const [activeIndex, setActiveIndex] = useState(-1);
const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

useEffect(() => {
  // When dropdown opens, highlight first option
  if (showAddressBookDropdown) {
    setActiveIndex(filteredAddressBooks.length > 0 ? 0 : -1);
  } else {
    setActiveIndex(-1);
  }
}, [showAddressBookDropdown, filteredAddressBooks.length]);

useEffect(() => {
  // reset active index when search changes
  setActiveIndex(filteredAddressBooks.length > 0 ? 0 : -1);
}, [addressBookSearch]);

useEffect(() => {
  // auto scroll active item into view
  if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
    itemRefs.current[activeIndex].scrollIntoView({
      block: "nearest",
    });
  }
}, [activeIndex]);


  const handleAddressBookSelect = (addressBook: AddressBook) => {
    setFormData(prev => ({
      ...prev,
      addressBookId: addressBook.id
    }));

    setAddressBookSearch(`${addressBook.addressBookID} - ${addressBook.customerName}`);
    setShowAddressBookDropdown(false);

    if (formData.useCustomerData) {
      fetchCustomerFullData(addressBook.id);
    }
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
    
    // Check if user has create/edit permission - USING SITES PERMISSIONS
    if ((!editingId && !sitesPerm.create) || (editingId && !sitesPerm.edit)) {
      alert('You do not have permission to perform this action');
      return;
    }
    
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
    // Check edit permission - USING SITES PERMISSION
    if (!sitesPerm.edit) {
      alert('You do not have permission to edit sites');
      return;
    }
    
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
    // Check delete permission - USING SITES PERMISSION
    if (!sitesPerm.delete) {
      alert('You do not have permission to delete sites');
      return;
    }
    
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

  const fetchCustomerFullData = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/address-book/${id}`);
      const data = await res.json();

      if (!data) return;

      const bestSite = data.sites?.length ? data.sites[0] : null;

      setFormData(prev => ({
        ...prev,
        siteAddress: bestSite?.siteAddress || data.regdAddress || '',
        city: bestSite?.city || data.city || '',
        state: bestSite?.state || data.state || '',
        pinCode: bestSite?.pinCode || data.pinCode || '',
        gstNo: bestSite?.gstNo || data.gstNo || '',
      }));

      if (data.contacts?.length > 0) {
        const converted = data.contacts.map((c: any) => ({
          siteId: 0,
          contactPerson: c.contactPerson,
          designation: c.designation,
          contactNumber: c.contactNumber,
          emailAddress: c.emailAddress,
        }));
        setFormContacts(converted);
      }

    } catch (err) {
      console.error("Auto-fill error:", err);
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
<div className="w-full -ml-13 sm:ml-0 px-4 py-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Branches</h1>
      
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <button
          onClick={() => setShowForm(true)}
          disabled={!sitesPerm.create}
          className={`px-6 py-3 rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 ${
            sitesPerm.create
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={sitesPerm.create ? 'Add new site' : 'No permission to create'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Branch
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
                  {editingId ? 'Edit Site' : 'Add Site'}
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

                    {/* NEW CHECKBOX */}
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="sameCustomer"
                        checked={formData.useCustomerData || false}
                        onChange={(e) => {
                          const checked = e.target.checked;

                          setFormData(prev => ({
                            ...prev,
                            useCustomerData: checked,

                            // When unchecked → clear the fetched values
                            ...(checked === false
                              ? {
                                siteAddress: '',
                                city: '',
                                state: '',
                                pinCode: '',
                                gstNo: '',
                              }
                              : {})
                          }));

                          // Clear contacts when unticked
                          if (!checked) {
                            setFormContacts([]);
                          }

                          // If checked → autofill now
                          if (checked && formData.addressBookId) {
                            fetchCustomerFullData(formData.addressBookId);
                          }
                        }}

                        className="h-4 w-4"
                      />
                      <label htmlFor="sameCustomer" className="text-sm text-gray-700">
                        Same as selected customer
                      </label>
                    </div>

                    <div className="relative address-book-dropdown">
                      <input
                        type="text"
                        value={addressBookSearch}
                        onChange={(e) => {
                          setAddressBookSearch(e.target.value);

                          if (e.target.value.trim().length > 0) {
                            setShowAddressBookDropdown(true);
                          } else {
                            setShowAddressBookDropdown(false);
                            setFormData({ ...formData, addressBookId: 0 });
                          }
                        }}
                        onFocus={() => {
                          if (addressBookSearch.trim().length > 0) {
                            setShowAddressBookDropdown(true);
                          }
                          
                        }}
                         onKeyDown={(e) => {
      // Open dropdown when user starts typing
      if (!showAddressBookDropdown && addressBookSearch.trim().length > 0) {
        setShowAddressBookDropdown(true);
      }

      if (!showAddressBookDropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => {
          if (filteredAddressBooks.length === 0) return -1;
          const next = prev < filteredAddressBooks.length - 1 ? prev + 1 : 0;
          return next;
        });
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => {
          if (filteredAddressBooks.length === 0) return -1;
          const next = prev > 0 ? prev - 1 : filteredAddressBooks.length - 1;
          return next;
        });
      }

      if (e.key === "Enter") {
        e.preventDefault();

        if (activeIndex >= 0 && filteredAddressBooks[activeIndex]) {
          handleAddressBookSelect(filteredAddressBooks[activeIndex]);
          setShowAddressBookDropdown(false);
        }
      }

      if (e.key === "Escape") {
        setShowAddressBookDropdown(false);
      }
    }}
                        placeholder="Search customer..."
                        className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />

                      {showAddressBookDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {isLoadingAddressBooks ? (
                            <div className="px-3 py-2 text-gray-500 flex items-center justify-between">
                              <span>Loading customers/vendors...</span>
                              <button
                                onClick={() => fetchAddressBooks()}
                                className="text-black hover:text-blue-800 text-sm"
                              >
                                Retry
                              </button>
                            </div>
                          ) : filteredAddressBooks.length > 0 ? (
                            filteredAddressBooks.map((addressBook, index) => (
  <div
    key={addressBook.id}
    ref={(el) => {
      if (el) {
        itemRefs.current[index] = el;
      }
    }}
    onMouseEnter={() => setActiveIndex(index)}
    onClick={() => {
      handleAddressBookSelect(addressBook);
      setShowAddressBookDropdown(false);
    }}
    className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0
      ${activeIndex === index ? "bg-blue-100" : "hover:bg-gray-100"}
    `}
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
                              No customers/vendors found in database.
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
                      <p className="text-red-500 text-sm mt-1">
                        Please select a customer/vendor from the dropdown
                      </p>
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
                        const value = e.target.value.replace(/\D/g, ''); // digits only
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
                    disabled={loading || (editingId ? !sitesPerm.edit : !sitesPerm.create)}
                    className={`px-8 py-3 rounded-lg font-medium shadow-md flex items-center gap-2 ${
                      loading || (editingId ? !sitesPerm.edit : !sitesPerm.create)
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
<div className="bg-white rounded-none sm:rounded-xl shadow-md overflow-hidden -mx-4 sm:mx-0">
       <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Branches</h2>
            <div className="text-white text-sm">
              Showing {currentItems.length} of {filteredSites.length} entries
              {searchTerm && (
                <span className="ml-2">(filtered from {sites.length} total)</span>
              )}
            </div>
          </div>
        </div>
<div className="w-full overflow-x-auto">
<table className="min-w-[720px] w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Branch ID</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Branch Name</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Branch Address</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-700">{item.siteID}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{item.siteName}</td>
                  <td className="px-6 py-4 text-gray-700">{item.siteAddress}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(item.id!)}
                        disabled={!sitesPerm.edit}
                        className={`transition-colors p-2 rounded
                          ${
                            sitesPerm.edit
                              ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer'
                              : 'text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        aria-label="Edit"
                        title={sitesPerm.edit ? 'Edit' : 'No permission to edit'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        disabled={!sitesPerm.delete}
                        className={`transition-colors p-2 rounded
                          ${
                            sitesPerm.delete
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer'
                              : 'text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        aria-label="Delete"
                        title={sitesPerm.delete ? 'Delete' : 'No permission to delete'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                      className={`px-3 py-1 border text-sm rounded transition-colors ${currentPage === page
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