'use client';

import { useState, useEffect } from 'react';

interface Department {
  id: number;
  departmentName: string;
}

interface ServiceWorkscopeCategory {
  id: number;
  workscopeCategoryName: string;
}

interface AddressBook {
  id: number;
  addressBookID: string;
  customerName: string;
  addressType: string;
}

interface Site {
  id: number;
  siteID: string;
  siteName: string;
  addressBookId: number;
}

interface Task {
  id?: number;
  taskID: string;
  departmentId: number;
  addressBookId: number;
  siteId: number;
  status: string;
  createdBy: string;
  createdAt: string;
  contacts?: TasksContacts[];
  workscopeDetails?: TasksWorkscopeDetails[];
  schedule?: TasksSchedule[];
  remarks?: TasksRemarks[];
}

interface TasksContacts {
  id?: number;
  taskId: number;
  contactName: string;
  contactNumber: string;
  contactEmail: string;
}

interface TasksWorkscopeDetails {
  id?: number;
  taskId: number;
  workscopeCategoryId: number;
  workscopeDetails: string;
  extraNote?: string;
}

interface TasksSchedule {
  id?: number;
  taskId: number;
  proposedDateTime: string;
  priority: string;
}

interface TasksRemarks {
  id?: number;
  taskId: number;
  remark: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

interface TaskFormData extends Task {
  contacts: TasksContacts[];
  workscopeDetails: TasksWorkscopeDetails[];
  schedule: TasksSchedule[];
  remarks: TasksRemarks[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [serviceWorkscopeCategories, setServiceWorkscopeCategories] = useState<ServiceWorkscopeCategory[]>([]);
  
  // State for saved entries in each section
  const [savedContacts, setSavedContacts] = useState<TasksContacts[]>([]);
  const [savedWorkscopeDetails, setSavedWorkscopeDetails] = useState<TasksWorkscopeDetails[]>([]);
  const [savedSchedule, setSavedSchedule] = useState<TasksSchedule[]>([]);
  const [savedRemarks, setSavedRemarks] = useState<TasksRemarks[]>([]);
  
  // State for editing saved entries (only for contacts, workscope, schedule - not remarks)
  const [editingSavedContact, setEditingSavedContact] = useState<number | null>(null);
  const [editingSavedWorkscope, setEditingSavedWorkscope] = useState<number | null>(null);
  const [editingSavedSchedule, setEditingSavedSchedule] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    taskID: '',
    departmentId: 0,
    addressBookId: 0,
    siteId: 0,
    status: 'Open',
    createdBy: '',
    createdAt: new Date().toISOString(),
    contacts: [{ taskId: 0, contactName: '', contactNumber: '', contactEmail: '' }],
    workscopeDetails: [{ taskId: 0, workscopeCategoryId: 0, workscopeDetails: '', extraNote: '' }],
    schedule: [{ taskId: 0, proposedDateTime: '', priority: 'Medium' }],
    remarks: [], // Only remarks section has no default entries
  });

  const API_URL = 'http://localhost:8000/task';

  // Fetch all tasks from backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch('http://localhost:8000/department');
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Fetch address books
  const fetchAddressBooks = async () => {
    try {
      const res = await fetch('http://localhost:8000/address-book');
      const data = await res.json();
      setAddressBooks(data);
    } catch (err) {
      console.error('Error fetching address books:', err);
    }
  };

  // Fetch sites
  const fetchSites = async () => {
    try {
      const res = await fetch('http://localhost:8000/sites');
      const data = await res.json();
      setSites(data);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  // Fetch service workscope categories
  const fetchServiceWorkscopeCategories = async () => {
    try {
      const res = await fetch('http://localhost:8000/workscope-category');
      if (!res.ok) {
        throw new Error('Failed to fetch service workscope categories');
      }
      const data = await res.json();
      setServiceWorkscopeCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching service workscope categories:', err);
      setServiceWorkscopeCategories([]); // Ensure it's always an array
    }
  };

  // Fetch next Task ID
  const fetchNextTaskId = async () => {
    try {
      const res = await fetch(`${API_URL}/next-id`);
      const data = await res.json();
      return data.taskId;
    } catch (err) {
      console.error('Error fetching next task ID:', err);
      return 'TASK/001';
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchDepartments();
    fetchAddressBooks();
    fetchSites();
    fetchServiceWorkscopeCategories();
  }, []);

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { taskId: 0, contactName: '', contactNumber: '', contactEmail: '' }]
    });
  };

  const removeContact = (index: number) => {
    setFormData({
      ...formData,
      contacts: formData.contacts.filter((_, i) => i !== index)
    });
  };

  const updateContact = (index: number, field: keyof TasksContacts, value: string) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData({ ...formData, contacts: updatedContacts });
  };

  const addWorkscopeDetail = () => {
    setFormData({
      ...formData,
      workscopeDetails: [...formData.workscopeDetails, { taskId: 0, workscopeCategoryId: 0, workscopeDetails: '', extraNote: '' }]
    });
  };

  const removeWorkscopeDetail = (index: number) => {
    setFormData({
      ...formData,
      workscopeDetails: formData.workscopeDetails.filter((_, i) => i !== index)
    });
  };

  const updateWorkscopeDetail = (index: number, field: keyof TasksWorkscopeDetails, value: string | number) => {
    const updatedDetails = [...formData.workscopeDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setFormData({ ...formData, workscopeDetails: updatedDetails });
  };

  const addSchedule = () => {
    setFormData({
      ...formData,
      schedule: [...formData.schedule, { taskId: 0, proposedDateTime: '', priority: 'Medium' }]
    });
  };

  const removeSchedule = (index: number) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter((_, i) => i !== index)
    });
  };

  const updateSchedule = (index: number, field: keyof TasksSchedule, value: string) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setFormData({ ...formData, schedule: updatedSchedule });
  };

  // Helper function to check if status can be changed
  const canChangeStatus = (currentStatus: string, newStatus: string): boolean => {
    // Once status is "Closed", it cannot be changed to anything else
    if (currentStatus === 'Closed') {
      return false;
    }
    
    // Define status progression: Open -> Assigned -> Work in Progress -> Closed
    const statusOrder = ['Open', 'Assigned', 'Work in Progress', 'Closed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);
    
    // Allow progression forward or staying at same level, but not going backward
    return newIndex >= currentIndex;
  };

  // Helper function to get the highest status from saved remarks
  const getHighestStatus = (): string => {
    if (savedRemarks.length === 0) return 'Open';
    
    const statusOrder = ['Open', 'Assigned', 'Work in Progress', 'Closed'];
    let highestIndex = 0;
    
    savedRemarks.forEach(remark => {
      const index = statusOrder.indexOf(remark.status);
      if (index > highestIndex) {
        highestIndex = index;
      }
    });
    
    return statusOrder[highestIndex];
  };

  // Check if task is closed (no new remarks allowed)
  const isTaskClosed = (): boolean => {
    return getHighestStatus() === 'Closed';
  };

  const addRemark = () => {
    // Prevent adding new remarks if task is closed
    if (isTaskClosed()) {
      alert('Cannot add new remarks to a closed task.');
      return;
    }
    
    setFormData({
      ...formData,
      remarks: [...formData.remarks, { taskId: 0, remark: '', status: getHighestStatus(), createdBy: '', createdAt: new Date().toISOString() }]
    });
  };

  const removeRemark = (index: number) => {
    setFormData({
      ...formData,
      remarks: formData.remarks.filter((_, i) => i !== index)
    });
  };

  const updateRemark = (index: number, field: keyof TasksRemarks, value: string) => {
    const updatedRemarks = [...formData.remarks];
    const currentRemark = updatedRemarks[index];
    
    // If status is being updated, check if the change is allowed
    if (field === 'status') {
      const currentStatus = currentRemark.status;
      if (!canChangeStatus(currentStatus, value)) {
        alert(`Cannot change status from "${currentStatus}" to "${value}". Status can only progress forward or stay the same.`);
        return;
      }
    }
    
    updatedRemarks[index] = { ...currentRemark, [field]: value };
    setFormData({ ...formData, remarks: updatedRemarks });
    
    // If status is being updated, also update the main task status
    if (field === 'status') {
      setFormData(prev => ({ ...prev, status: value, remarks: updatedRemarks }));
    }
  };

  // Individual section save functions
  const saveContact = (index: number) => {
    const contact = formData.contacts[index];
    if (contact.contactName && contact.contactNumber) {
      setSavedContacts([...savedContacts, { ...contact, id: Date.now() }]);
      // Remove from form data
      const updatedContacts = formData.contacts.filter((_, i) => i !== index);
      setFormData({ ...formData, contacts: updatedContacts });
    }
  };

  const saveWorkscopeDetail = (index: number) => {
    const detail = formData.workscopeDetails[index];
    if (detail.workscopeDetails && detail.workscopeCategoryId > 0) {
      setSavedWorkscopeDetails([...savedWorkscopeDetails, { ...detail, id: Date.now() }]);
      // Remove from form data
      const updatedDetails = formData.workscopeDetails.filter((_, i) => i !== index);
      setFormData({ ...formData, workscopeDetails: updatedDetails });
    }
  };

  const saveSchedule = (index: number) => {
    const schedule = formData.schedule[index];
    if (schedule.proposedDateTime && schedule.priority) {
      setSavedSchedule([...savedSchedule, { ...schedule, id: Date.now() }]);
      // Remove from form data
      const updatedSchedule = formData.schedule.filter((_, i) => i !== index);
      setFormData({ ...formData, schedule: updatedSchedule });
    }
  };

  const saveRemark = (index: number) => {
    const remark = formData.remarks[index];
    if (remark.remark) {
      // Check if the status change is allowed based on existing saved remarks
      const currentHighestStatus = getHighestStatus();
      if (!canChangeStatus(currentHighestStatus, remark.status)) {
        alert(`Cannot save remark with status "${remark.status}". Current highest status is "${currentHighestStatus}". Status can only progress forward.`);
        return;
      }
      
      setSavedRemarks([...savedRemarks, { ...remark, id: Date.now() }]);
      // Remove from form data
      const updatedRemarks = formData.remarks.filter((_, i) => i !== index);
      setFormData({ ...formData, remarks: updatedRemarks });
      
      // Update main task status to match the saved remark status
      setFormData(prev => ({ ...prev, status: remark.status }));
    }
  };

  // Remove saved entries
  const removeSavedContact = (id: number) => {
    setSavedContacts(savedContacts.filter(c => c.id !== id));
  };

  const removeSavedWorkscopeDetail = (id: number) => {
    setSavedWorkscopeDetails(savedWorkscopeDetails.filter(d => d.id !== id));
  };

  const removeSavedSchedule = (id: number) => {
    setSavedSchedule(savedSchedule.filter(s => s.id !== id));
  };

  const removeSavedRemark = (id: number) => {
    setSavedRemarks(savedRemarks.filter(r => r.id !== id));
  };

  // Functions for editing saved contacts
  const startEditSavedContact = (id: number) => {
    const contact = savedContacts.find(c => c.id === id);
    if (contact) {
      setEditingSavedContact(id);
    }
  };

  const saveEditedContact = (id: number, updatedContact: TasksContacts) => {
    setSavedContacts(savedContacts.map(c => 
      c.id === id ? { ...c, ...updatedContact } : c
    ));
    setEditingSavedContact(null);
  };

  const cancelEditSavedContact = () => {
    setEditingSavedContact(null);
  };

  // Functions for editing saved workscope details
  const startEditSavedWorkscope = (id: number) => {
    const workscope = savedWorkscopeDetails.find(w => w.id === id);
    if (workscope) {
      setEditingSavedWorkscope(id);
    }
  };

  const saveEditedWorkscope = (id: number, updatedWorkscope: TasksWorkscopeDetails) => {
    setSavedWorkscopeDetails(savedWorkscopeDetails.map(w => 
      w.id === id ? { ...w, ...updatedWorkscope } : w
    ));
    setEditingSavedWorkscope(null);
  };

  const cancelEditSavedWorkscope = () => {
    setEditingSavedWorkscope(null);
  };

  // Functions for editing saved schedule
  const startEditSavedSchedule = (id: number) => {
    const schedule = savedSchedule.find(s => s.id === id);
    if (schedule) {
      setEditingSavedSchedule(id);
    }
  };

  const saveEditedSchedule = (id: number, updatedSchedule: TasksSchedule) => {
    setSavedSchedule(savedSchedule.map(s => 
      s.id === id ? { ...s, ...updatedSchedule } : s
    ));
    setEditingSavedSchedule(null);
  };

  const cancelEditSavedSchedule = () => {
    setEditingSavedSchedule(null);
  };

  const resetForm = async () => {
    const nextTaskId = await fetchNextTaskId();
    setFormData({
      taskID: nextTaskId,
      departmentId: 0,
      addressBookId: 0,
      siteId: 0,
      status: 'Open',
      createdBy: '',
      createdAt: new Date().toISOString(),
      contacts: [{ taskId: 0, contactName: '', contactNumber: '', contactEmail: '' }],
      workscopeDetails: [{ taskId: 0, workscopeCategoryId: 0, workscopeDetails: '', extraNote: '' }],
      schedule: [{ taskId: 0, proposedDateTime: '', priority: 'Medium' }],
      remarks: [], // Only remarks section has no default entries
    });
    // Clear saved entries
    setSavedContacts([]);
    setSavedWorkscopeDetails([]);
    setSavedSchedule([]);
    setSavedRemarks([]);
    // Clear editing state
    setEditingSavedContact(null);
    setEditingSavedWorkscope(null);
    setEditingSavedSchedule(null);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if remarks are required and present
    const allRemarks = [
      ...formData.remarks.filter(r => r.remark),
      ...savedRemarks
    ];
    
    if (allRemarks.length === 0) {
      alert('Please add at least one remark before submitting the task.');
      return;
    }
    
    try {
      const submitData = {
        departmentId: formData.departmentId,
        addressBookId: formData.addressBookId,
        siteId: formData.siteId,
        status: formData.status,
        contacts: [
          ...formData.contacts.filter(c => c.contactName && c.contactNumber),
          ...savedContacts
        ],
        workscopeDetails: [
          ...formData.workscopeDetails.filter(w => w.workscopeDetails),
          ...savedWorkscopeDetails
        ],
        schedule: [
          ...formData.schedule.filter(s => s.proposedDateTime && s.priority),
          ...savedSchedule
        ],
        remarks: [
          ...formData.remarks.filter(r => r.remark),
          ...savedRemarks
        ],
      };

      if (editingId) {
        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
        if (!res.ok) throw new Error('Failed to update task');
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
        if (!res.ok) throw new Error('Failed to create task');
      }

      await fetchTasks();
      await resetForm();
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  const handleEdit = (id: number) => {
    const item = tasks.find(t => t.id === id);
    if (item) {
      // Load remarks into saved remarks section first
      setSavedRemarks(item.remarks || []);
      
      // Determine the highest status from saved remarks
      const highestStatus = item.remarks && item.remarks.length > 0 
        ? item.remarks.reduce((highest, remark) => {
            const statusOrder = ['Open', 'Assigned', 'Work in Progress', 'Closed'];
            const currentIndex = statusOrder.indexOf(highest);
            const remarkIndex = statusOrder.indexOf(remark.status);
            return remarkIndex > currentIndex ? remark.status : highest;
          }, 'Open')
        : 'Open';
      
      setFormData({
        ...item,
        status: highestStatus, // Set status to the highest from saved remarks
        contacts: item.contacts || [],
        workscopeDetails: item.workscopeDetails || [],
        schedule: item.schedule ? item.schedule.map(s => ({
          ...s,
          proposedDateTime: s.proposedDateTime ? new Date(s.proposedDateTime).toISOString().slice(0, 16) : ''
        })) : [],
        remarks: [], // Don't load remarks into current form
      });
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      await fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
        <p className="text-gray-600">Track and manage tasks and work orders</p>
      </div>

      <div className="mb-6">
        <button
          onClick={async () => {
            const nextTaskId = await fetchNextTaskId();
            setFormData({
              taskID: nextTaskId,
              departmentId: 0,
              addressBookId: 0,
              siteId: 0,
              status: 'Open',
              createdBy: '',
              createdAt: new Date().toISOString(),
              contacts: [{ taskId: 0, contactName: '', contactNumber: '', contactEmail: '' }],
              workscopeDetails: [{ taskId: 0, workscopeCategoryId: 0, workscopeDetails: '', extraNote: '' }],
              schedule: [{ taskId: 0, proposedDateTime: '', priority: 'Medium' }],
              remarks: [], // Only remarks section has no default entries
            });
            setShowForm(true);
            setEditingId(null);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Task
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Task' : 'Add New Task'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Task Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                Task ID
              </label>
              <input
                type="text"
                value={formData.taskID}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Department
              </label>
                <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
                >
                  <option value={0}>Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Address Book (Customer)
              </label>
                <select
                value={formData.addressBookId}
                  onChange={(e) => {
                    const selectedId = parseInt(e.target.value);
                    setFormData({ ...formData, addressBookId: selectedId, siteId: 0 });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
                >
                  <option value={0}>Select Customer</option>
                  {addressBooks.filter(ab => ab.addressType === 'Customer').map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.addressBookID} - {customer.customerName}
                    </option>
                  ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Site
              </label>
                <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
                  disabled={formData.addressBookId === 0}
                >
                  <option value={0}>Select Site</option>
                  {sites.filter(site => site.addressBookId === formData.addressBookId).map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.siteID} - {site.siteName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task Contacts */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Task Contacts</h3>
                <button
                  type="button"
                  onClick={addContact}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Add Contact
                </button>
              </div>
              {/* Saved Contacts */}
              {savedContacts.map((contact) => (
                <div key={contact.id} className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                        {editingSavedContact === contact.id ? (
                          <input
                            type="text"
                            defaultValue={contact.contactName}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                            onBlur={(e) => {
                              const updatedContact = { ...contact, contactName: e.target.value };
                              saveEditedContact(contact.id!, updatedContact);
                            }}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 bg-white p-2 rounded border">{contact.contactName}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        {editingSavedContact === contact.id ? (
                          <input
                            type="text"
                            defaultValue={contact.contactNumber}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                            onBlur={(e) => {
                              const updatedContact = { ...contact, contactNumber: e.target.value };
                              saveEditedContact(contact.id!, updatedContact);
                            }}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 bg-white p-2 rounded border">{contact.contactNumber}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                        {editingSavedContact === contact.id ? (
                          <input
                            type="email"
                            defaultValue={contact.contactEmail}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                            onBlur={(e) => {
                              const updatedContact = { ...contact, contactEmail: e.target.value };
                              saveEditedContact(contact.id!, updatedContact);
                            }}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 bg-white p-2 rounded border">{contact.contactEmail || 'N/A'}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      {editingSavedContact === contact.id ? (
                        <button
                          type="button"
                          onClick={() => setEditingSavedContact(null)}
                          className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditSavedContact(contact.id!)}
                            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedContact(contact.id!)}
                            className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Form Contacts */}
              {formData.contacts.map((contact, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={contact.contactName}
                      onChange={(e) => updateContact(index, 'contactName', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={contact.contactNumber}
                      onChange={(e) => updateContact(index, 'contactNumber', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={contact.contactEmail}
                      onChange={(e) => updateContact(index, 'contactEmail', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => saveContact(index)}
                      disabled={!contact.contactName || !contact.contactNumber}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Workscope Details */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Workscope Details</h3>
                <button
                  type="button"
                  onClick={addWorkscopeDetail}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Add Workscope Detail
                </button>
              </div>
              {/* Saved Workscope Details */}
              {savedWorkscopeDetails.map((detail) => (
                <div key={detail.id} className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 gap-3 flex-1">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Workscope Category</label>
                        {editingSavedWorkscope === detail.id ? (
                          <select
                            defaultValue={detail.workscopeCategoryId}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                            onBlur={(e) => {
                              const updatedWorkscope = { ...detail, workscopeCategoryId: parseInt(e.target.value) };
                              saveEditedWorkscope(detail.id!, updatedWorkscope);
                            }}
                          >
                            <option value={0}>Select Workscope Category</option>
                            {Array.isArray(serviceWorkscopeCategories) && serviceWorkscopeCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.workscopeCategoryName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                            {serviceWorkscopeCategories.find(cat => cat.id === detail.workscopeCategoryId)?.workscopeCategoryName || 'N/A'}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Workscope Details</label>
                        {editingSavedWorkscope === detail.id ? (
                          <textarea
                            defaultValue={detail.workscopeDetails}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                            rows={3}
                            onBlur={(e) => {
                              const updatedWorkscope = { ...detail, workscopeDetails: e.target.value };
                              saveEditedWorkscope(detail.id!, updatedWorkscope);
                            }}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 bg-white p-2 rounded border min-h-[60px]">{detail.workscopeDetails}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Extra Note</label>
                        {editingSavedWorkscope === detail.id ? (
                          <input
                            type="text"
                            defaultValue={detail.extraNote || ''}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                            onBlur={(e) => {
                              const updatedWorkscope = { ...detail, extraNote: e.target.value };
                              saveEditedWorkscope(detail.id!, updatedWorkscope);
                            }}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 bg-white p-2 rounded border">{detail.extraNote || 'N/A'}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      {editingSavedWorkscope === detail.id ? (
                        <button
                          type="button"
                          onClick={() => setEditingSavedWorkscope(null)}
                          className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditSavedWorkscope(detail.id!)}
                            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedWorkscopeDetail(detail.id!)}
                            className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Form Workscope Details */}
              {formData.workscopeDetails.map((detail, index) => (
                <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Workscope Category</label>
                      <select
                        value={detail.workscopeCategoryId}
                        onChange={(e) => updateWorkscopeDetail(index, 'workscopeCategoryId', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                      >
                        <option value={0}>Select Workscope Category</option>
                        {Array.isArray(serviceWorkscopeCategories) && serviceWorkscopeCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.workscopeCategoryName}
                          </option>
                        ))}
                      </select>
            </div>
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Workscope Details</label>
                      <textarea
                        value={detail.workscopeDetails}
                        onChange={(e) => updateWorkscopeDetail(index, 'workscopeDetails', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Extra Note</label>
              <input
                type="text"
                          value={detail.extraNote || ''}
                          onChange={(e) => updateWorkscopeDetail(index, 'extraNote', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => saveWorkscopeDetail(index)}
                        disabled={!detail.workscopeDetails || detail.workscopeCategoryId === 0}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => removeWorkscopeDetail(index)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Task Schedule */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Task Schedule</h3>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Add Schedule
                </button>
              </div>
              {/* Saved Schedule */}
              {savedSchedule.map((schedule) => (
                <div key={schedule.id} className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Date & Time</label>
                        {editingSavedSchedule === schedule.id ? (
                          <input
                            type="datetime-local"
                            defaultValue={new Date(schedule.proposedDateTime).toISOString().slice(0, 16)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                            onBlur={(e) => {
                              const updatedSchedule = { ...schedule, proposedDateTime: e.target.value };
                              saveEditedSchedule(schedule.id!, updatedSchedule);
                            }}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                            {new Date(schedule.proposedDateTime).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        {editingSavedSchedule === schedule.id ? (
                          <select
                            defaultValue={schedule.priority}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                            onBlur={(e) => {
                              const updatedSchedule = { ...schedule, priority: e.target.value };
                              saveEditedSchedule(schedule.id!, updatedSchedule);
                            }}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900 bg-white p-2 rounded border">{schedule.priority}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      {editingSavedSchedule === schedule.id ? (
                        <button
                          type="button"
                          onClick={() => setEditingSavedSchedule(null)}
                          className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditSavedSchedule(schedule.id!)}
                            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedSchedule(schedule.id!)}
                            className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Form Schedule */}
              {formData.schedule.map((schedule, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Date & Time</label>
              <input
                type="datetime-local"
                      value={schedule.proposedDateTime}
                      onChange={(e) => updateSchedule(index, 'proposedDateTime', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={schedule.priority}
                      onChange={(e) => updateSchedule(index, 'priority', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => saveSchedule(index)}
                      disabled={!schedule.proposedDateTime || !schedule.priority}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSchedule(index)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Task Remarks */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Task Remarks</h3>
                <button
                  type="button"
                  onClick={addRemark}
                  disabled={isTaskClosed()}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Remark
                </button>
              </div>
              {/* Saved Remarks */}
              {savedRemarks.map((remark) => (
                <div key={remark.id} className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                      <div className="text-sm text-gray-900 bg-white p-2 rounded border min-h-[60px]">{remark.remark}</div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Status</label>
                      <div className="text-sm text-gray-900 bg-white p-2 rounded border">{remark.status}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Form Remarks */}
              {formData.remarks.map((remark, index) => (
                <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                      <textarea
                        value={remark.remark}
                        onChange={(e) => updateRemark(index, 'remark', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                        rows={2}
                      />
                    </div>
                    {remark.remark && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={remark.status}
                          onChange={(e) => updateRemark(index, 'status', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white"
                        >
                          {['Open', 'Assigned', 'Work in Progress', 'Closed'].map(status => (
                            <option 
                              key={status} 
                              value={status}
                              disabled={!canChangeStatus(remark.status, status)}
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => saveRemark(index)}
                        disabled={!remark.remark}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRemark(index)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update' : 'Add'} Task
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tasks</h2>
          {loading && <span className="text-sm text-gray-500">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.length > 0 ? (
                tasks.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.taskID}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {departments.find(d => d.id === item.departmentId)?.departmentName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(() => {
                        const customer = addressBooks.find(ab => ab.id === item.addressBookId);
                        return customer ? `${customer.addressBookID} - ${customer.customerName}` : 'N/A';
                      })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sites.find(s => s.id === item.siteId)?.siteID || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'Open' ? 'bg-green-100 text-green-800' :
                      item.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status || 'Open'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.createdAt).toLocaleDateString()}
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
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-4">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}