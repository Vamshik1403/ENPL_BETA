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

  // Debug logging
  console.log('Search term:', addressBookSearch);
  console.log('Total address books:', addressBooks.length);
  console.log('Filtered results:', filteredAddressBooks.length);

  const handleAddressBookSelect = (addressBook: AddressBook) => {
    setFormData({ ...formData, addressBookId: addressBook.id });
    setAddressBookSearch(`${addressBook.addressBookID} - ${addressBook.customerName} (${addressBook.addressType})`);
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
      if (editingId) {
        // Update existing site
        const response = await fetch(`http://localhost:8000/sites/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
         if (response.ok) {
           const updatedSite = await response.json();
           setSites(sites.map(item => 
             item.id === editingId ? updatedSite : item
           ));
           
           // Update site contacts
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
         } else {
           console.error('Failed to update site:', response.statusText);
         }
      } else {
        // Create new site
        const response = await fetch('http://localhost:8000/sites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          const newSite = await response.json();
          setSites([...sites, newSite]);
          
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
        } else {
          console.error('Failed to create site:', response.statusText);
        }
      }
      
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
        setAddressBookSearch(`${addressBook.addressBookID} - ${addressBook.customerName} (${addressBook.addressType})`);
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sites</h1>
        <p className="text-gray-600">Manage customer sites and locations</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Site
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Site' : 'Add New Site'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer/Vendor *
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
                  placeholder="Search customer or vendor..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="text-blue-600 hover:text-blue-800 text-sm"
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
                            {addressBook.addressType} | {addressBook.regdAddress}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Address
              </label>
              <textarea
                value={formData.siteAddress}
                onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pin Code
              </label>
              <input
                type="text"
                value={formData.pinCode}
                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                value={formData.gstNo}
                onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Site Contacts Section */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Site Contacts</h3>
                <button 
                  type="button" 
                  onClick={addContact} 
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  + Add Contact
                </button>
              </div>
              
              {formContacts.map((contact, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3 border">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Contact {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        value={contact.contactPerson}
                        onChange={(e) => updateContact(index, 'contactPerson', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Designation *
                      </label>
                      <input
                        type="text"
                        value={contact.designation}
                        onChange={(e) => updateContact(index, 'designation', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number *
                      </label>
                      <input
                        type="text"
                        value={contact.contactNumber}
                        onChange={(e) => updateContact(index, 'contactNumber', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={contact.emailAddress}
                        onChange={(e) => updateContact(index, 'emailAddress', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {formContacts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No site contacts added yet. Click "Add Contact" to add contact information.</p>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update' : 'Add'} Site
              </button>
              <button
                type="button"
                onClick={() => {
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
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Sites</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GST No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sites.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.siteID}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.siteName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.siteAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.gstNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item.id!)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
