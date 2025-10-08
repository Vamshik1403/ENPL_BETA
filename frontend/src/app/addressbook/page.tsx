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

export default function AddressBookPage() {
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddressBook>({
    addressType: '',
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

  // Load data from backend on component mount
  useEffect(() => {
    fetchAddressBooks();
  }, []);

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

  const handleAddressTypeChange = async (addressType: string) => {
    const generatedId = await generateAddressBookId(addressType);
    setGeneratedId(generatedId);
    setFormData({ ...formData, addressType, addressBookID: generatedId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        // Update existing record
        const response = await fetch(`http://localhost:8000/address-book/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          await fetchAddressBooks(); // Refresh the list
          setShowForm(false);
          setEditingId(null);
          resetForm();
        }
      } else {
        // Create new record
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
      addressType: '',
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
    if (confirm('Are you sure you want to delete this address book entry?')) {
      try {
        const response = await fetch(`http://localhost:8000/address-book/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await fetchAddressBooks(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting address book:', error);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Address Book</h1>
        <p className="text-gray-600">Manage customer and vendor information</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Address Book Entry
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Address Book Entry' : 'Add New Address Book Entry'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Type
              </label>
              <select
                value={formData.addressType}
                onChange={(e) => handleAddressTypeChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Address Type</option>
                <option value="Customer">Customer</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Book ID
              </label>
              <input
                type="text"
                value={generatedId || ''}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                placeholder="Auto-generated"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered Address
              </label>
              <textarea
                value={formData.regdAddress}
                onChange={(e) => setFormData({ ...formData, regdAddress: e.target.value })}
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
                required
              />
            </div>
            
            {/* Contacts Section */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
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
                  <div className="flex items-center justify-between mb-3">
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
                  <p>No contacts added yet. Click "Add Contact" to add contact information.</p>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Entry
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
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
          <h2 className="text-xl font-semibold">Address Book Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address Book ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
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
              {addressBooks.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.addressBookID}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.addressType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.customerName}
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
