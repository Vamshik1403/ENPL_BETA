'use client';

import { PlusIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

import { debounce } from 'lodash'; // or implement your own

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

interface TaskInventory {
  productTypeId?: number;
  productTypeName?: string;
  makeModel?: string;
  snMac?: string;
  description?: string;
  purchaseDate?: string;
  warrantyPeriod?: string;
  thirdPartyPurchase?: boolean;
  warrantyStatus?: string;
}

interface Task {
  id?: number;
  taskID: string;
  userId: number;
  departmentId: number;
  addressBookId: number;
  siteId: number;
  status: string;
  department?: string;
  customer?: string;
  site?: string;
  addressBook?: string;
  workscopeCat?: string;
  createdBy: string;
  description?: string;
  title?: string;
  createdAt: string;
  contacts?: TasksContacts[];
  workscopeDetails?: TasksWorkscopeDetails[];
  schedule?: TasksSchedule[];
  remarks?: TasksRemarks[];
  taskInventories?: TaskInventory[];
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
  description?: string;
  createdAt: string;
}

interface TaskFormData extends Task {
  contacts: TasksContacts[];
  workscopeDetails: TasksWorkscopeDetails[];
  schedule: TasksSchedule[];
  remarks: TasksRemarks[];
}

// TaskModal Component
interface TaskModalProps {
  showModal: boolean;
  editingId: number | null;
  formData: TaskFormData;
  departments: Department[];
  addressBooks: AddressBook[];
  sites: Site[];
  serviceWorkscopeCategories: ServiceWorkscopeCategory[];
  departmentSearch: string;
  customerSearch: string;
  workscopeCategorySearch: string;
  showDepartmentDropdown: boolean;
  showCustomerDropdown: boolean;
  showWorkscopeDropdown: boolean;
  filteredDepartments: Department[];
  filteredCustomers: AddressBook[];
  filteredWorkscopeCategories: ServiceWorkscopeCategory[];
  filteredSites: Site[];
  savedContacts: TasksContacts[];
  savedWorkscopeDetails: TasksWorkscopeDetails[];
  savedSchedule: TasksSchedule[];
  savedRemarks: TasksRemarks[];
  editingSavedContact: number | null;
  editingSavedWorkscope: number | null;
  editingSavedSchedule: number | null;
  inventories: any[];
  productTypes: any[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDepartmentSearchChange: (value: string) => void;
  onCustomerSearchChange: (value: string) => void;
  onWorkscopeCategorySearchChange: (value: string) => void;
  onShowDepartmentDropdownChange: (show: boolean) => void;
  onShowCustomerDropdownChange: (show: boolean) => void;
  onShowWorkscopeDropdownChange: (show: boolean) => void;
  onFormDataChange: (data: TaskFormData) => void;
  onAddContact: () => void;
  onRemoveContact: (index: number) => void;
  onUpdateContact: (index: number, field: keyof TasksContacts, value: string) => void;
  onAddWorkscopeDetail: () => void;
  onRemoveWorkscopeDetail: (index: number) => void;
  onUpdateWorkscopeDetail: (index: number, field: keyof TasksWorkscopeDetails, value: string | number) => void;
  onAddSchedule: () => void;
  onRemoveSchedule: (index: number) => void;
  onUpdateSchedule: (index: number, field: keyof TasksSchedule, value: string) => void;
  onAddRemark: () => void;
  onRemoveRemark: (index: number) => void;
  onUpdateRemark: (index: number, field: keyof TasksRemarks, value: string) => void;
  onSaveContact: (index: number) => void;
  onSaveWorkscopeDetail: (index: number) => void;
  onSaveSchedule: () => void;
  onSaveRemark: (index: number) => void;
  onRemoveSavedContact: (id: number) => void;
  onRemoveSavedWorkscopeDetail: (id: number) => void;
  onRemoveSavedSchedule: (id: number) => void;
  onRemoveSavedRemark: (id: number) => void;
  onStartEditSavedContact: (id: number) => void;
  onSaveEditedContact: (id: number, updatedContact: TasksContacts) => void;
  onCancelEditSavedContact: () => void;
  onStartEditSavedWorkscope: (id: number) => void;
  onSaveEditedWorkscope: (id: number, updatedWorkscope: TasksWorkscopeDetails) => void;
  onCancelEditSavedWorkscope: () => void;
  onStartEditSavedSchedule: (id: number) => void;
  onSaveEditedSchedule: (id: number, updatedSchedule: TasksSchedule) => void;
  onCancelEditSavedSchedule: () => void;
  isTaskClosed: () => boolean;
  onEditLatestRemark: (remark: TasksRemarks) => void;
  onOpenInventoryModal: () => void;
  onRemoveInventory: (index: number) => void;
}

const getAuthToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token");



// TaskModal Component - Updated structure
const TaskModal: React.FC<TaskModalProps> = ({
  showModal,
  editingId,
  formData,
  departments,
  addressBooks,
  serviceWorkscopeCategories,
  customerSearch,
  showCustomerDropdown,
  filteredCustomers,
  filteredSites,
  savedContacts,
  savedWorkscopeDetails,
  savedSchedule,
  savedRemarks,
  inventories,
  productTypes,
  onClose,
  onSubmit,
  onCustomerSearchChange,
  onShowCustomerDropdownChange,
  onFormDataChange,
  onAddContact,
  onRemoveContact,
  onUpdateContact,
  onAddWorkscopeDetail,
  onRemoveWorkscopeDetail,
  onUpdateWorkscopeDetail,
  onAddSchedule,
  onRemoveSchedule,
  onUpdateSchedule,
  onAddRemark,
  onRemoveRemark,
  onUpdateRemark,
  onSaveContact,
  onSaveWorkscopeDetail,
  onSaveSchedule,
  onRemoveSavedContact,
  onRemoveSavedWorkscopeDetail,
  onRemoveSavedSchedule,
  isTaskClosed,
  onEditLatestRemark,
  onOpenInventoryModal,
  onRemoveInventory,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Task' : 'Add Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Basic Task Information */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Department
                  </label>
                  <select
                    value={
                      formData.departmentId ||
                      (departments.length > 0 ? departments[0].id : '')
                    }
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        departmentId: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Customer
                  </label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      onCustomerSearchChange(e.target.value);
                      onShowCustomerDropdownChange(true);
                    }}
                    onFocus={() => onShowCustomerDropdownChange(true)}
                    placeholder="Search customer..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                  {showCustomerDropdown && customerSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                          onClick={() => {
                            onFormDataChange({ ...formData, addressBookId: customer.id, siteId: 0 });
                            onCustomerSearchChange(`${customer.addressBookID} - ${customer.customerName}`);
                            onShowCustomerDropdownChange(false);
                          }}
                        >
                          {customer.addressBookID} - {customer.customerName}
                        </div>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="px-3 py-2 text-gray-500">No customers found</div>
                      )}
                    </div>
                  )}
                  {formData.addressBookId > 0 && (
                    <div className="mt-1 text-sm text-green-600">
                      Selected: {addressBooks.find(ab => ab.id === formData.addressBookId)?.customerName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Site
                  </label>
                  <select
                    value={formData.siteId}
                    onChange={(e) => onFormDataChange({ ...formData, siteId: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                    disabled={formData.addressBookId === 0}
                  >
                    <option value={0}>Select Site</option>
                    {filteredSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.siteID} - {site.siteName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Task Title

                  </label>
                  <input

                    type="text"
                    value={formData.title || ''}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter task title..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  />

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, description: e.target.value })
                    }
                    placeholder="Add a task description..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white min-h-[100px]"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Task Contacts */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Task Contacts</h3>
                <button
                  type="button"
                  onClick={onAddContact}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  + Add Contact
                </button>
              </div>

              {/* Current Form Contacts - Initially empty, will show when Add Contact is clicked */}
              {formData.contacts.length > 0 && formData.contacts.map((contact, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg border">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={contact.contactName}
                      onChange={(e) => onUpdateContact(index, "contactName", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      placeholder="Enter contact name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={contact.contactNumber}
                      onChange={(e) => onUpdateContact(index, "contactNumber", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={contact.contactEmail}
                      onChange={(e) => onUpdateContact(index, "contactEmail", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      placeholder="Enter contact email"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => onSaveContact(index)}
                      disabled={!contact.contactName || !contact.contactNumber}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Save Contact
                    </button>
                    {formData.contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveContact(index)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Saved Contacts Table */}
              {savedContacts.length > 0 && (
                <div className="bg-white rounded-lg border overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="p-3 text-left text-blue-800 font-semibold">Name</th>
                        <th className="p-3 text-left text-blue-800 font-semibold">Number</th>
                        <th className="p-3 text-left text-blue-800 font-semibold">Email</th>
                        <th className="p-3 text-left text-blue-800 font-semibold w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedContacts.map((contact) => (
                        <tr key={contact.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="p-3 text-gray-700">{contact.contactName}</td>
                          <td className="p-3 text-gray-700">{contact.contactNumber}</td>
                          <td className="p-3 text-gray-700">{contact.contactEmail || "N/A"}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => onRemoveSavedContact(contact.id!)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Workscope Details */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Workscope Details</h3>
                <button
                  type="button"
                  onClick={onAddWorkscopeDetail}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  + Add WorkScope
                </button>
              </div>

              {/* Current Form Workscope Details - Initially empty */}
              {formData.workscopeDetails.length > 0 && formData.workscopeDetails.map((detail, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white rounded-lg border">
                  {/* Workscope Category Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workscope Category
                    </label>
                    <select
                      value={detail.workscopeCategoryId || 0}
                      onChange={(e) => onUpdateWorkscopeDetail(index, "workscopeCategoryId", parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    >
                      <option value={0}>Select Category</option>
                      {serviceWorkscopeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.workscopeCategoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Workscope Details Textarea */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workscope Details
                    </label>
                    <textarea
                      value={detail.workscopeDetails || ''}
                      onChange={(e) => onUpdateWorkscopeDetail(index, 'workscopeDetails', e.target.value)}
                      placeholder="Enter workscope details..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white min-h-[42px] resize-vertical"
                      rows={2}
                    />
                  </div>

                  {/* Add/Remove Buttons */}
                  <div className="flex justify-end items-end gap-2 md:col-span-2">
                    <button
                      type="button"
                      onClick={() => onSaveWorkscopeDetail(index)}
                      disabled={!detail.workscopeDetails || detail.workscopeCategoryId === 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Save Workscope
                    </button>
                    {formData.workscopeDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveWorkscopeDetail(index)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Saved Workscope Details Table */}
              {savedWorkscopeDetails.length > 0 && (
                <div className="bg-white rounded-lg border overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="p-3 text-left text-blue-800 font-semibold">Category</th>
                        <th className="p-3 text-left text-blue-800 font-semibold">Details</th>
                        <th className="p-3 text-left text-blue-800 font-semibold w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedWorkscopeDetails.map((workscope) => (
                        <tr key={workscope.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="p-3 text-gray-700">
                            {serviceWorkscopeCategories.find(cat => cat.id === workscope.workscopeCategoryId)?.workscopeCategoryName || 'N/A'}
                          </td>
                          <td className="p-3 text-gray-700">{workscope.workscopeDetails}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => onRemoveSavedWorkscopeDetail(workscope.id!)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
              </div>

              {/* Add Schedule Form - Initially empty, will show when needed */}
              {formData.schedule.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg border">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.schedule[0]?.proposedDateTime || ''}
                      onChange={(e) => onUpdateSchedule(0, 'proposedDateTime', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.schedule[0]?.priority || 'Medium'}
                      onChange={(e) => onUpdateSchedule(0, 'priority', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={onSaveSchedule}
                      disabled={!formData.schedule[0]?.proposedDateTime || !formData.schedule[0]?.priority}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Schedule
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Schedule Table */}
              {savedSchedule.length > 0 && (
                <div className="bg-white rounded-lg border overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="p-3 text-left text-blue-800 font-semibold">Date & Time</th>
                        <th className="p-3 text-left text-blue-800 font-semibold">Priority</th>
                        <th className="p-3 text-left text-blue-800 font-semibold w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedSchedule.map((schedule) => (
                        <tr key={schedule.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="p-3 text-gray-700">
                            {new Date(schedule.proposedDateTime).toLocaleString()}
                          </td>
                          <td className="p-3 text-gray-700">{schedule.priority}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => onRemoveSavedSchedule(schedule.id!)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Inventory Section */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
                <button
                  type="button"
                  onClick={onOpenInventoryModal}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  + Add Inventory Item
                </button>
              </div>

              {inventories.length > 0 ? (
                <div className="bg-white rounded-lg border overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="p-3 text-left text-blue-800 font-semibold">Product Type</th>
                        <th className="p-3 text-left text-blue-800 font-semibold">Make & Model</th>
                        <th className="p-3 text-left text-blue-800 font-semibold">SN/MAC</th>
                        <th className="p-3 text-left text-blue-800 font-semibold">Warranty</th>
                        <th className="p-3 text-left text-blue-800 font-semibold">3rd Party</th>
                        <th className="p-3 text-left text-blue-800 font-semibold w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventories.map((inv, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                          <td className="p-3 text-gray-700">{inv.productTypeName}</td>
                          <td className="p-3 text-gray-700">{inv.makeModel}</td>
                          <td className="p-3 text-gray-700">{inv.snMac}</td>
                          <td className="p-3 text-gray-700">{inv.warrantyStatus}</td>
                          <td className="p-3 text-gray-700">{inv.thirdPartyPurchase ? "Yes" : "No"}</td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => onRemoveInventory(i)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border">
                  No inventory items added yet
                </div>
              )}
            </div>

            {/* Task Remarks */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Task Remarks</h3>
              </div>

              {/* Show New Remark Form ONLY in Add Task Modal */}
              {!editingId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-lg border">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Remark
                    </label>
                    <textarea
                      value={formData.remarks[0]?.remark || ''}
                      onChange={(e) => onUpdateRemark(0, 'remark', e.target.value)}
                      placeholder="Enter new remark..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white min-h-[42px] resize-vertical"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.remarks[0]?.status || 'Open'}
                      onChange={(e) => onUpdateRemark(0, 'status', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      disabled
                    >
                      <option value="Open">Open</option>
                    </select>
                    <div className="text-xs text-gray-500 mt-1">
                      Status can only be updated in the Remarks modal
                    </div>
                  </div>

                  <div className="justify-end flex items-end gap-2 md:col-span-3">
                    <button
                      type="button"
                      onClick={onAddRemark}
                      disabled={isTaskClosed() || !formData.remarks[0]?.remark || !formData.remarks[0]?.status}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Remark
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Remarks Display - Show existing remarks as read-only */}
              {savedRemarks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    {editingId ? 'Task Remarks' : 'Saved Remarks'}
                  </h4>
                  <div className="space-y-3">
                    {[...savedRemarks]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((remark) => (
                        <div
                          key={remark.id}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-start"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-gray-800 mb-1">
                              <strong>Status:</strong> {remark.status}
                            </div>
                            <div className="text-gray-700">{remark.remark}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(remark.createdAt).toLocaleString()} — {remark.createdBy}
                            </div>
                          </div>

                          {remark.id === [...savedRemarks]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.id && (
                              <button
                                type="button"
                                onClick={() => onEditLatestRemark(remark)}
                                className="text-blue-600 hover:text-blue-800 text-sm ml-2 flex items-center gap-1"
                                title="Edit latest remark"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Remarks Only Modal Component
interface RemarksModalProps {
  showModal: boolean;
  task: Task | null;
  savedRemarks: TasksRemarks[];
  onClose: () => void;
  onAddRemark: (remark: string, status: string) => void;
  onRemoveRemark: (id: number) => void;
  onEditLatestRemark: (remark: TasksRemarks) => void;
  getAllowedStatuses: (currentStatus: string) => string[];
}

// Update RemarksModal component
const RemarksModal: React.FC<RemarksModalProps> = ({
  showModal,
  task,
  savedRemarks,
  onClose,
  onAddRemark,
  onRemoveRemark,
  onEditLatestRemark,
  getAllowedStatuses,
}) => {
  const [newRemark, setNewRemark] = useState('');


  // Also update the normalizeStatus function to handle "Work in Progress" properly:
  const normalizeStatus = (status: string) => {
    if (!status) return 'Open';

    const normalized = status
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/\s+/g, ' ');

    // Handle variations of "Work in Progress"
    if (normalized.includes('Progress') || normalized.includes('Wip') || normalized === 'Wip') {
      return 'Work in Progress';
    }

    return normalized;
  };


  // In RemarksModal component, replace getCurrentTaskStatus function with:
  const getCurrentTaskStatus = () => {
    if (!task?.remarks || task.remarks.length === 0) {
      return "Open";
    }

    const latest = [...task.remarks].sort(
      (a, b) => (b.id || 0) - (a.id || 0)
    )[0];

    return normalizeStatus(latest.status);
  };

  const currentStatus = getCurrentTaskStatus();
  const allowedStatuses = getAllowedStatuses(currentStatus);

  // always reset dropdown when modal opens OR remarks change
  useEffect(() => {
    if (!showModal) return;

    setNewStatus(
      allowedStatuses.length ? allowedStatuses[0] : currentStatus
    );
  }, [showModal, task?.remarks]);




  // Initialize newStatus properly
  const [newStatus, setNewStatus] = useState(
    allowedStatuses.length ? allowedStatuses[0] : currentStatus
  );

  // Update effect to handle status changes
  useEffect(() => {
    if (!task || !showModal) return;

    const current = normalizeStatus(getCurrentTaskStatus());
    const allowed = getAllowedStatuses(current);

    // Set to first allowed status, or current if no allowed transitions
    setNewStatus(allowed.length ? allowed[0] : current);
  }, [task, showModal]);

// In RemarksModal component, add:
const [isSubmitting, setIsSubmitting] = useState(false);

// Update handleSubmit:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (isSubmitting) return; // Prevent double submit
  
  if (newRemark.trim()) {
    setIsSubmitting(true);
    
    try {
      await onAddRemark(newRemark.trim(), newStatus);
      setNewRemark('');
      
      const updatedCurrentStatus = newStatus;
      const updatedAllowedStatuses = getAllowedStatuses(updatedCurrentStatus);
      setNewStatus(updatedAllowedStatuses[0] || 'Scheduled');
    } catch (error) {
      console.error("Failed to add remark:", error);
    } finally {
      setIsSubmitting(false);
    }
  }
};


  if (!showModal || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Remarks for Task: {task.taskID}
              </h2>
              <div className="mt-1">
                <span className="text-sm font-medium text-gray-700">Current Status: </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${currentStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                  currentStatus === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
                    currentStatus === 'On-Hold' ? 'bg-orange-100 text-orange-800' :
                      currentStatus === 'Rescheduled' ? 'bg-purple-100 text-purple-800' :
                        currentStatus === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                  }`}>
                  {currentStatus}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Add Remark Form */}
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Remark
                </label>
                <textarea
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  placeholder="Enter your remark..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-500">
                  Allowed next statuses based on current status: {currentStatus}
                </div>
              </div>
            </div>
 <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Remark & Update Status
            </button>
          </form>

          {/* Remarks List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {savedRemarks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No remarks yet</p>
            ) : (
              [...savedRemarks]
                .sort((a, b) => (b.id || 0) - (a.id || 0))
                .map((remark) => {
                  const sortedById = [...savedRemarks].sort((a, b) => (b.id || 0) - (a.id || 0));
                  const latestRemarkId = sortedById[0]?.id;
                  const isLatestRemark = remark.id === latestRemarkId;

                  return (
                    <div
                      key={remark.id}
                      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${remark.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          remark.status === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
                            remark.status === 'On-Hold' ? 'bg-orange-100 text-orange-800' :
                              remark.status === 'Rescheduled' ? 'bg-purple-100 text-purple-800' :
                                remark.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                  remark.status === 'Reopen' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                          }`}>
                          {remark.status}
                        </span>
                        <div className="flex gap-2">
                          {isLatestRemark && (
                            <button
                              onClick={() => onEditLatestRemark(remark)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-900 mb-2">{remark.remark}</p>
                      <div className="text-xs text-gray-500">
                        Commented by {remark.createdBy} on {new Date(remark.createdAt).toLocaleString()}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main TasksPage Component
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [serviceWorkscopeCategories, setServiceWorkscopeCategories] = useState<ServiceWorkscopeCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventories, setInventories] = useState<any[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [currentUserName, setCurrentUserName] = useState<string>('User');

  type CrudPerm = {
    read: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };

  type PermissionsJson = Record<string, CrudPerm>;

  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionsJson | null>(null);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [userDepartmentId, setUserDepartmentId] = useState<number | null>(null);


  const taskPermissions: CrudPerm = {
    read: permissions?.TASKS?.read ?? false,
    create: permissions?.TASKS?.create ?? false,
    edit: permissions?.TASKS?.edit ?? false,
    delete: permissions?.TASKS?.delete ?? false,
  };

  const debouncedFetchTasks = debounce(async () => {
  await fetchTasks();
}, 300);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUserType = localStorage.getItem("userType");

    if (storedUserId) setUserId(Number(storedUserId));
    if (storedUserType) setUserType(storedUserType);
  }, []);

  const HOURS_24 = 24 * 60 * 60 * 1000;

const isTaskOpen = (task: Task) =>
  task.status?.toLowerCase() === "open";

const isTaskOlderThan24Hours = (task: Task) => {
  if (!task.createdAt) return false;

  const createdTime = new Date(task.createdAt).getTime();
  const now = Date.now();

  return now - createdTime > HOURS_24;
};

const hasTaskBeenAttempted = (task: Task) => {
  return task.remarks && task.remarks.length > 0;
};




  const fetchProductTypes = async () => {
    try {
      const res = await fetch("http://localhost:8000/producttype");
      const data = await res.json();
      setProductTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load product types:", err);
      setProductTypes([]);
    }
  };

  const removeInventory = (index: number) => {
    setInventories(prev => prev.filter((_, i) => i !== index));
  };

  const normalizeStatus = (status?: string) => {
    if (!status) return "Open";

    const s = status.trim().toLowerCase();

    if (s === "wip" || s.includes("progress")) return "Work in Progress";
    if (s === "on-hold" || s === "on hold") return "On-Hold";
    if (s === "re-open" || s === "reopen") return "Reopen";

    return s.replace(/\b\w/g, c => c.toUpperCase());
  };


  // 🔥 Fixed Allowed status transitions
  const getAllowedStatuses = (currentStatusRaw: string) => {
    const currentStatus = normalizeStatus(currentStatusRaw);

    switch (currentStatus) {
      case "Open":
        return ["Scheduled"];

      case "Scheduled":
        return ["Work in Progress", "Rescheduled", "On-Hold"];

      case "Work in Progress":
        return ["On-Hold", "Completed"];

      case "Rescheduled":
        return ["Work in Progress", "On-Hold"];

      case "On-Hold":
        return ["Rescheduled"];

      case "Completed":
        return ["Reopen"];

      case "Reopen":
        return ["Rescheduled"];

      default:
        return [];
    }
  };

  // 🔍 Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;



  const visibleTasks = tasks.filter(task => {
    // SUPERADMIN sees everything
    if (userType === "SUPERADMIN") return true;

    // wait until user context is ready
    if (!userId || userDepartmentId === null) return false;

    // HYBRID VISIBILITY RULE
    return (
      task.userId === userId ||
      task.departmentId === userDepartmentId
    );
  });








  const filteredTasks = visibleTasks.filter((task) => {
    const term = searchTerm.toLowerCase();
    const departmentName =
      departments.find(d => d.id === task.departmentId)?.departmentName?.toLowerCase() || '';
    const customerName =
      addressBooks.find(a => a.id === task.addressBookId)?.customerName?.toLowerCase() || '';
    const siteName =
      sites.find(s => s.id === task.siteId)?.siteName?.toLowerCase() || '';

    return (
      task.taskID.toLowerCase().includes(term) ||
      departmentName.includes(term) ||
      customerName.includes(term) ||
      siteName.includes(term) ||
      task.status.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

const sortedTasks = [...filteredTasks].sort((a, b) => {
  const aOpen = isTaskOpen(a);
  const bOpen = isTaskOpen(b);

  // Open tasks always first
  if (aOpen && !bOpen) return -1;
  if (!aOpen && bOpen) return 1;

  // If both same status, newest first
  return (
    new Date(b.createdAt).getTime() -
    new Date(a.createdAt).getTime()
  );
});

const paginatedTasks = sortedTasks.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

  useEffect(() => {
    if (!userId) return;

    setFormData(prev => ({
      ...prev,
      userId,
    }));
  }, [userId]);


  // Form state - Initialize with empty arrays
  const [formData, setFormData] = useState<TaskFormData>({
    taskID: '',
    userId: userId || 0,
    departmentId: departments.length > 0 ? departments[0].id : 0,
    addressBookId: 0,
    siteId: 0,
    status: 'Open',
    createdBy: currentUserName,
    createdAt: new Date().toISOString(),
    description: '',
    title: '',
    contacts: [], // Start with empty array
    workscopeDetails: [], // Start with empty array
    schedule: [], // Start with empty array
    remarks: [] // Start with empty array
  });

  // Search and dropdown states
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [workscopeCategorySearch, setWorkscopeCategorySearch] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showWorkscopeDropdown, setShowWorkscopeDropdown] = useState(false);

  // Saved items state
  const [savedContacts, setSavedContacts] = useState<TasksContacts[]>([]);
  const [savedWorkscopeDetails, setSavedWorkscopeDetails] = useState<TasksWorkscopeDetails[]>([]);
  const [savedSchedule, setSavedSchedule] = useState<TasksSchedule[]>([]);
  const [savedRemarks, setSavedRemarks] = useState<TasksRemarks[]>([]);

  // Editing states
  const [editingSavedContact, setEditingSavedContact] = useState<number | null>(null);
  const [editingSavedWorkscope, setEditingSavedWorkscope] = useState<number | null>(null);
  const [editingSavedSchedule, setEditingSavedSchedule] = useState<number | null>(null);

  // Remark editing states
  const [showEditRemarkModal, setShowEditRemarkModal] = useState(false);
  const [remarkToEdit, setRemarkToEdit] = useState<TasksRemarks | null>(null);
  const [editRemarkText, setEditRemarkText] = useState("");
  const [editRemarkStatus, setEditRemarkStatus] = useState("");
  const [taskForRemarkEdit, setTaskForRemarkEdit] = useState<Task | null>(null);

  // Filtered data
  const filteredDepartments = departments.filter(dept =>
    dept.departmentName.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const filteredCustomers = addressBooks.filter(customer =>
    customer.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.addressBookID.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredWorkscopeCategories = serviceWorkscopeCategories.filter(cat =>
    cat.workscopeCategoryName.toLowerCase().includes(workscopeCategorySearch.toLowerCase())
  );

  const filteredSites = sites.filter(site =>
    site.addressBookId === formData.addressBookId
  );

  // ✅ Auto-fill Task Contacts when a site is selected
  useEffect(() => {
    if (!formData.siteId || formData.siteId === 0) return;

    const fetchSiteContacts = async () => {
      try {
        const res = await fetch(`http://localhost:8000/sites/${formData.siteId}`);
        const data = await res.json();

        if (data?.contacts?.length > 0) {
          const converted = data.contacts.map((c: any) => ({
            id: c.id || Date.now() + Math.random(),
            taskId: 0,
            contactName: c.contactPerson,
            contactNumber: c.contactNumber,
            contactEmail: c.emailAddress
          }));

          setSavedContacts(converted);
        }
      } catch (err) {
        console.error("Auto-fill site contacts failed:", err);
      }
    };



    fetchSiteContacts();
  }, [formData.siteId]);

  const fetchUserPermissions = async (uid: number) => {
    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8000/user-permissions/${uid}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      if (!res.ok) throw new Error("Permission fetch failed");

      const data = await res.json();

      let perms = null;

      if (data?.permissions?.permissions) {
        perms = data.permissions.permissions;
      } else if (data?.permissions) {
        perms = data.permissions;
      } else {
        perms = data;
      }

      setPermissions(perms);
      localStorage.setItem("userPermissions", JSON.stringify(perms));
    } catch (err) {
      console.error(err);
      const stored = localStorage.getItem("userPermissions");
      if (stored) {
        setPermissions(JSON.parse(stored));
      } else {
        setPermissions({});
      }
    }
  };


  // Fetch data
  useEffect(() => {
    fetchTasks();
    fetchDepartments();
    fetchAddressBooks();
    fetchSites();
    fetchNextTaskId();
    fetchServiceWorkscopeCategories();
    fetchProductTypes();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserPermissions(userId);
      fetchLoggedUser(userId);
    }
  }, [userId]);

useEffect(() => {
  const storedUserId = localStorage.getItem("userId");
  const storedUserType = localStorage.getItem("userType");
  const storedUserName = localStorage.getItem("username");

  if (storedUserId) setUserId(Number(storedUserId));
  if (storedUserType) setUserType(storedUserType);
  if (storedUserName) setCurrentUserName(storedUserName);
}, []);


  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:8000/department');
      const data = await response.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  useEffect(() => {
    if (!loggedUser?.department) return;
    if (departments.length === 0) return;

    const dept = departments.find(
      d =>
        d.departmentName.trim().toLowerCase() ===
        loggedUser.department.trim().toLowerCase()
    );

    setUserDepartmentId(dept?.id ?? null);
  }, [loggedUser, departments]);


  const fetchAddressBooks = async () => {
    try {
      const response = await fetch('http://localhost:8000/address-book');
      const data = await response.json();
      setAddressBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching address books:', error);
      setAddressBooks([]);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('http://localhost:8000/sites');
      const data = await response.json();
      setSites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]);
    }
  };

  const fetchServiceWorkscopeCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/workscope-category');
      if (!response.ok) {
        throw new Error('Failed to fetch service workscope categories');
      }
      const data = await response.json();
      setServiceWorkscopeCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching service workscope categories:', error);
      setServiceWorkscopeCategories([]);
    }
  };

const fetchLoggedUser = async (uid: number) => {
  const token = getAuthToken();
  
  try {
    const res = await fetch("http://localhost:8000/auth/users", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const users = await res.json();
    const me = users.find((u: any) => u.id === uid);
    
    if (me) {
      setLoggedUser(me);
      // Store the user's actual name for later use
      const username = me.name || me.username || me.email || 'User';
      localStorage.setItem("username", username);
    }
  } catch (err) {
    console.error("Failed to fetch user details:", err);
    setLoggedUser(null);
  }
};

 const fetchTasks = async () => {
  try {
    setLoading(true);
    const response = await fetch('http://localhost:8000/task');
    const data = await response.json();

    // Only sort if needed
    const tasksWithSortedRemarks = Array.isArray(data)
      ? data.map((task: Task) => ({
        ...task,
        // Only sort when actually needed
        remarks: task.remarks
          ? [...task.remarks].sort((a, b) => (b.id || 0) - (a.id || 0))
          : []
      }))
      : [];

    setTasks(tasksWithSortedRemarks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    setTasks([]);
  } finally {
    setLoading(false);
  }
};

  const fetchNextTaskId = async () => {
    try {
      const res = await fetch(`http://localhost:8000/task/next-id`);
      const data = await res.json();
      return data.taskId;
    } catch (err) {
      console.error('Error fetching next task ID:', err);
      return 'TASK/001';
    }
  };

  // Modal handlers
  const handleOpenModal = async () => {
  const nextTaskId = await fetchNextTaskId();
  const actualUserName = localStorage.getItem("username") || currentUserName || "User";
      setFormData({
      taskID: nextTaskId,
      userId: userId || 0,
      departmentId: departments.length > 0 ? departments[0].id : 0,
      addressBookId: 0,
      siteId: 0,
      status: 'Open',
    createdBy: actualUserName, // Use actual user name
      createdAt: new Date().toISOString(),
      description: '',
      title: '',
      // Start with empty arrays - fields will open when "Add" is clicked
      contacts: [],
      workscopeDetails: [],
      schedule: [
        {
          taskId: 0,
          proposedDateTime: "",
          priority: "Medium",
        }
      ],
      // Start with one empty remark for adding new remarks
      remarks: [{
        taskId: 0,
        remark: '',
        status: 'Open',
    createdBy: actualUserName, // Use actual user name
        createdAt: new Date().toISOString()
      }]
    });
    setSavedContacts([]);
    setSavedWorkscopeDetails([]);
    setSavedSchedule([]);
    setSavedRemarks([]);
    setInventories([]);
    setEditingId(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      taskID: '',
      userId: userId || 0,
      departmentId: departments.length > 0 ? departments[0].id : 0,
      addressBookId: 0,
      siteId: 0,
      status: 'Open',
      createdBy: currentUserName,
      createdAt: new Date().toISOString(),
      description: '',
      title: '',
      contacts: [],
      workscopeDetails: [],
      schedule: [
        {
          taskId: 0,
          proposedDateTime: "",
          priority: "Medium",
        }
      ],
      remarks: []
    });
    setSavedContacts([]);
    setSavedWorkscopeDetails([]);
    setSavedSchedule([]);
    setSavedRemarks([]);
    setInventories([]);
  };

  const handleOpenRemarksModal = (task: Task) => {
    setSelectedTask(task);

    if (task.remarks && task.remarks.length > 0) {
      const sortedRemarks = [...task.remarks].sort((a, b) => (b.id || 0) - (a.id || 0));
      setSavedRemarks(sortedRemarks);
    } else {
      setSavedRemarks([]);
    }

    setShowRemarksModal(true);
  };

  const handleCloseRemarksModal = () => {
    setShowRemarksModal(false);
    setSelectedTask(null);
    setSavedRemarks([]);
  };

  // Form submission - FIXED TO INCLUDE REMARKS
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  const cleanArray = (arr: any[], mapper: any) =>
    arr.length ? arr.map(mapper) : undefined;

  try {
    // Get the actual user name from localStorage or state
    const actualUserName = localStorage.getItem("username") || currentUserName || "User";
    
    // Determine task status from saved remarks
    let taskStatus = 'Open';
    let remarksToSave: any[] = [];

    // First check saved remarks
    if (savedRemarks.length > 0) {
      const sortedRemarks = [...savedRemarks].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      taskStatus = sortedRemarks[0]?.status || 'Open';
      remarksToSave = sortedRemarks.map(r => ({
        remark: r.remark,
        status: r.status,
        createdBy: r.createdBy || actualUserName, // Use actual user name
        createdAt: r.createdAt || new Date().toISOString(),
        description: r.description || "",

      }));
    }
    // Then check if there's a new remark in the form (for Add Task)
    else if (formData.remarks && formData.remarks.length > 0 && formData.remarks[0].remark) {
      const newRemark = {
        remark: formData.remarks[0].remark,
        status: 'Open', // Always "Open" for new tasks
        createdBy: actualUserName, // Use actual user name
        createdAt: new Date().toISOString(),
        description: ""
      };
      remarksToSave = [newRemark];
      taskStatus = 'Open';
    }

    console.log("Remarks to save:", remarksToSave); // Debug log

    const taskData = {
      id: editingId || undefined,
      userId,
      taskID: formData.taskID,
      departmentId: formData.departmentId,
      addressBookId: formData.addressBookId,
      siteId: formData.siteId,
      status: taskStatus,
      createdBy: actualUserName, // Also update main task createdBy
      createdAt: formData.createdAt,
      description: formData.description,
      title: formData.title,

      contacts: cleanArray(savedContacts, (c: any) => ({
        contactName: c.contactName,
        contactNumber: c.contactNumber,
        contactEmail: c.contactEmail
      })),

      workscopeDetails: savedWorkscopeDetails.length > 0
        ? savedWorkscopeDetails.map(w => ({
          workscopeCategoryId: Number(w.workscopeCategoryId),
          workscopeDetails: w.workscopeDetails,
          extraNote: w.extraNote || ""
        }))
        : undefined,

      schedule: cleanArray(savedSchedule, (s: any) => ({
        proposedDateTime: s.proposedDateTime,
        priority: s.priority
      })),

      // ✅ FIX: INCLUDE REMARKS IN PAYLOAD
      remarks: remarksToSave.length > 0
        ? remarksToSave
        : undefined,

      taskInventories: inventories.length
        ? inventories.map(inv => ({
          serviceContractId: 0,
          productTypeId: Number(inv.productTypeId),
          makeModel: inv.makeModel,
          snMac: inv.snMac,
          description: inv.description,
          purchaseDate: inv.purchaseDate,
          warrantyPeriod: inv.warrantyPeriod,
          thirdPartyPurchase: inv.thirdPartyPurchase,
          warrantyStatus: inv.warrantyStatus
            ? String(inv.warrantyStatus).trim()
            : "Active"
        }))
        : undefined,
    };

    console.log("DEBUG PAYLOAD:", JSON.stringify(taskData, null, 2));

    const url = editingId
      ? `http://localhost:8000/task/${editingId}`
      : `http://localhost:8000/task`;

    const method = editingId ? "PATCH" : "POST";

    const token = getAuthToken();

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save task: ${errorText}`);
    }

    await fetchTasks();
    alert("Task saved successfully!");
    handleCloseModal();
  } catch (err) {
    console.error("Save error:", err);
    setError(err instanceof Error ? err.message : "Failed to save task");
  } finally {
    setLoading(false);
  }
};

 const handleAddRemarkInModal = async (remark: string, status: string) => {
  if (!selectedTask) return;

  // Show immediate feedback
  const submitButton = document.activeElement as HTMLButtonElement;
  const originalText = submitButton?.textContent;


  try {
    const token = getAuthToken();
    const actualUserName = localStorage.getItem("username") || currentUserName || "User";

    // OPTIMIZATION: Optimistic update
    const tempRemark = {
      id: Date.now(), // Temporary ID
      taskId: selectedTask.id!,
      remark,
      status,
      createdBy: actualUserName,
      createdAt: new Date().toISOString(),
      description: ""
    };

    // Update UI immediately (optimistic update)
    const updatedRemarks = [tempRemark, ...savedRemarks];
    setSavedRemarks(updatedRemarks);
    
    // Update the task in local state immediately
    if (selectedTask) {
      const updatedTask = {
        ...selectedTask,
        status,
        remarks: updatedRemarks
      };
      setSelectedTask(updatedTask);
    }

    // Update tasks list optimistically
    setTasks(prev => prev.map(task => 
      task.id === selectedTask.id 
        ? { ...task, status, remarks: updatedRemarks }
        : task
    ));

    // Then make API call
    const response = await fetch(`http://localhost:8000/tasks-remarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        taskId: selectedTask.id,
        remark,
        status,
        createdBy: actualUserName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add remark");
    }

    const newRemark = await response.json();

    // Replace temporary remark with actual one from server
    const finalUpdatedRemarks = [newRemark, ...savedRemarks];
    setSavedRemarks(finalUpdatedRemarks);

    // Update with real data
    setTasks(prev => prev.map(task => 
      task.id === selectedTask.id 
        ? { 
            ...task, 
            status, 
            remarks: finalUpdatedRemarks 
          }
        : task
    ));

    // Only fetch if you need to sync with other users
    // await fetchTasks(); // REMOVE or keep if needed for real-time sync

  } catch (err) {
    console.error(err);
    setError("Failed to add remark");
    
    // Revert optimistic update on error
    setSavedRemarks(savedRemarks);
    setTasks(prev => prev.map(task => 
      task.id === selectedTask.id 
        ? { ...task, status: selectedTask.status, remarks: savedRemarks }
        : task
    ));
  } finally {
    // Restore button state
    if (submitButton) {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }
};

  const handleRemoveRemarkInModal = async (id: number) => {
    try {
      const updatedRemarks = savedRemarks.filter(remark => remark.id !== id);
      setSavedRemarks(updatedRemarks);

      if (selectedTask) {
        let newStatus = 'Open';
        if (updatedRemarks.length > 0) {
          const sortedRemarks = [...updatedRemarks].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          newStatus = sortedRemarks[0]?.status || 'Open';
        }

        const updatedTask = {
          id: selectedTask.id,
          taskID: selectedTask.taskID,
          departmentId: selectedTask.departmentId,
          addressBookId: selectedTask.addressBookId,
          siteId: selectedTask.siteId,
          status: newStatus,
          createdBy: selectedTask.createdBy,
          createdAt: selectedTask.createdAt,
          description: selectedTask.description || '',
          title: selectedTask.title || '',
          contacts: (selectedTask.contacts || []).map(c => ({
            contactName: c.contactName,
            contactNumber: c.contactNumber,
            contactEmail: c.contactEmail
          })),
          workscopeDetails: (selectedTask.workscopeDetails || []).map(w => ({
            workscopeCategoryId: w.workscopeCategoryId,
            workscopeDetails: w.workscopeDetails,
            extraNote: w.extraNote || ""
          })),
          schedule: (selectedTask.schedule || []).map(s => ({
            proposedDateTime: s.proposedDateTime,
            priority: s.priority
          })),
          remarks: updatedRemarks.map(r => ({
            remark: r.remark,
            status: r.status,
            createdBy: r.createdBy,
            createdAt: r.createdAt,
            description: r.description || ""
          }))
        };


        const token = getAuthToken();

        const response = await fetch(`http://localhost:8000/task/${selectedTask.id}`, {
          method: 'PATCH',
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedTask),
        });


        if (!response.ok) {
          setSavedRemarks(savedRemarks);
          throw new Error('Failed to remove remark');
        }

        setSelectedTask(prev => prev ? { ...prev, status: newStatus, remarks: updatedRemarks } : null);
      }

      await fetchTasks();
      alert("Remark removed successfully");

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove remark');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const token = getAuthToken();

    try {

      const response = await fetch(`http://localhost:8000/task/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete task');

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  // Contact handlers
  const handleAddContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { taskId: 0, contactName: '', contactNumber: '', contactEmail: '' }]
    }));
  };

  const handleRemoveContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateContact = (index: number, field: keyof TasksContacts, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const handleSaveContact = (index: number) => {
    const contact = formData.contacts[index];
    if (contact.contactName && contact.contactNumber) {
      setSavedContacts(prev => [...prev, { ...contact, id: Date.now() }]);
      handleRemoveContact(index);
    }
  };

  const handleRemoveSavedContact = (id: number) => {
    setSavedContacts(prev => prev.filter(contact => contact.id !== id));
  };

  // -----------------------------------------
  // WORKSCOPE SECTION
  // -----------------------------------------

  const handleAddWorkscopeDetail = () => {
    setFormData(prev => ({
      ...prev,
      workscopeDetails: [
        ...prev.workscopeDetails,
        { id: 0, taskId: 0, workscopeCategoryId: 0, workscopeDetails: "", extraNote: "" }
      ]
    }));
  };

  const handleUpdateWorkscopeDetail = (index: number, field: keyof TasksWorkscopeDetails, value: any) => {
    setFormData(prev => ({
      ...prev,
      workscopeDetails: prev.workscopeDetails.map((w, i) =>
        i === index ? { ...w, [field]: value } : w
      )
    }));
  };

  const handleRemoveWorkscopeDetail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workscopeDetails: prev.workscopeDetails.filter((_, i) => i !== index)
    }));
  };

  const handleSaveWorkscopeDetail = (index: number) => {
    const w = formData.workscopeDetails[index];

    console.log("Saving workscope:", w);

    if (!w.workscopeCategoryId || !w.workscopeDetails.trim()) {
      alert("Please select a category and enter workscope details");
      return;
    }

    const cleaned = {
      id: Date.now(),
      taskId: editingId || 0,
      workscopeCategoryId: Number(w.workscopeCategoryId),
      workscopeDetails: w.workscopeDetails.trim(),
      extraNote: w.extraNote?.trim() || ""
    };

    console.log("Cleaned workscope:", cleaned);

    setSavedWorkscopeDetails(prev => [...prev, cleaned]);

    setFormData(prev => ({
      ...prev,
      workscopeDetails: prev.workscopeDetails.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveSavedWorkscopeDetail = (id: number) => {
    setSavedWorkscopeDetails(prev => prev.filter(w => w.id !== id));
  };

  // Schedule handlers
  const handleAddSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { taskId: 0, proposedDateTime: '', priority: 'Medium' }]
    }));
  };

  const handleRemoveSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSchedule = (index: number, field: keyof TasksSchedule, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }));
  };

  const handleSaveSchedule = () => {
    const schedule = formData.schedule[0];
    if (schedule.proposedDateTime && schedule.priority) {
      setSavedSchedule(prev => [...prev, { ...schedule, id: Date.now() }]);
      setFormData(prev => ({
        ...prev,
        schedule: [{ taskId: 0, proposedDateTime: '', priority: 'Medium' }]
      }));
    }
  };

  const handleRemoveSavedSchedule = (id: number) => {
    setSavedSchedule(prev => prev.filter(schedule => schedule.id !== id));
  };

  // Remark handlers
  const handleAddRemark = () => {
    const remark = formData.remarks[0];
    if (remark.remark && remark.status) {
      const newRemark = {
        ...remark,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: currentUserName
      };

      setSavedRemarks(prev => [...prev, newRemark]);
      setFormData(prev => ({
        ...prev,
        remarks: [{
          taskId: 0,
          remark: '',
          status: 'Open',
          createdBy: currentUserName,
          createdAt: new Date().toISOString()
        }]
      }));

      alert("Remark saved. Click 'Create Task' to save to database.");
    }
  };

  const handleRemoveRemark = (index: number) => {
    setFormData(prev => ({
      ...prev,
      remarks: prev.remarks.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateRemark = (index: number, field: keyof TasksRemarks, value: string) => {
    setFormData(prev => ({
      ...prev,
      remarks: prev.remarks.map((remark, i) =>
        i === index ? { ...remark, [field]: value } : remark
      )
    }));
  };

  const handleSaveRemark = (index: number) => {
    const remark = formData.remarks[index];
    if (remark.remark && remark.status) {
      setSavedRemarks(prev => [...prev, { ...remark, id: Date.now() }]);
      handleRemoveRemark(index);
    }
  };

  const handleRemoveSavedRemark = (id: number) => {
    setSavedRemarks(prev => prev.filter(remark => remark.id !== id));
  };

  // Edit handlers for saved items
  const handleStartEditSavedContact = (id: number) => {
    setEditingSavedContact(id);
  };

  const handleSaveEditedContact = (id: number, updatedContact: TasksContacts) => {
    setSavedContacts(prev => prev.map(contact =>
      contact.id === id ? { ...updatedContact, id } : contact
    ));
    setEditingSavedContact(null);
  };

  const handleCancelEditSavedContact = () => {
    setEditingSavedContact(null);
  };

  const handleStartEditSavedWorkscope = (id: number) => {
    setEditingSavedWorkscope(id);
  };

  const handleSaveEditedWorkscope = (id: number, updatedWorkscope: TasksWorkscopeDetails) => {
    setSavedWorkscopeDetails(prev => prev.map(workscope =>
      workscope.id === id ? { ...updatedWorkscope, id } : workscope
    ));
    setEditingSavedWorkscope(null);
  };

  const handleCancelEditSavedWorkscope = () => {
    setEditingSavedWorkscope(null);
  };

  const handleStartEditSavedSchedule = (id: number) => {
    setEditingSavedSchedule(id);
  };

  const handleSaveEditedSchedule = (id: number, updatedSchedule: TasksSchedule) => {
    setSavedSchedule(prev => prev.map(schedule =>
      schedule.id === id ? { ...updatedSchedule, id } : schedule
    ));
    setEditingSavedSchedule(null);
  };

  const handleCancelEditSavedSchedule = () => {
    setEditingSavedSchedule(null);
  };

  // Check if task is closed
  const isTaskClosed = () => {
    return savedRemarks.some(remark => remark.status === 'Closed') ||
      formData.remarks.some(remark => remark.status === 'Closed');
  };

  // In the handleEditTask function, update the inventory loading part:
  const handleEditTask = (task: Task) => {
   const sortedRemarks = task.remarks
    ? [...task.remarks].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    : [];

  const formattedSchedule = (task.schedule || []).map(schedule => ({
    ...schedule,
    proposedDateTime: schedule.proposedDateTime ?
      new Date(schedule.proposedDateTime).toISOString().slice(0, 16) : ''
  }));

  let taskStatus = 'Open';
  if (task.remarks && task.remarks.length > 0) {
    const sortedRemarks = [...task.remarks].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    taskStatus = sortedRemarks[0]?.status || 'Open';
  }

    const actualUserName = localStorage.getItem("username") || currentUserName || "User";


    setFormData({
      taskID: task.taskID,
      userId: task.userId,
      departmentId: task.departmentId,
      addressBookId: task.addressBookId,
      siteId: task.siteId,
      status: taskStatus,
    createdBy: actualUserName, // Use actual user name
      createdAt: task.createdAt,
      description: task.description || '',
      title: task.title || '',
      // Start with empty arrays for adding new items
      contacts: [],
      workscopeDetails: [],
      schedule: [
        {
          taskId: task.id || 0,
          proposedDateTime: "",
          priority: "Medium",
        }
      ],

      // Start with one empty remark for adding new ones
      remarks: [{
        taskId: 0,
        remark: '',
        status: 'Open',
    createdBy: actualUserName, // Use actual user name
        createdAt: new Date().toISOString()
      }]
    });

    setSavedContacts(task.contacts || []);
    setSavedWorkscopeDetails(
      (task.workscopeDetails || []).map(w => ({
        id: w.id!,
        taskId: w.taskId!,
        workscopeCategoryId: Number(w.workscopeCategoryId),
        workscopeDetails: w.workscopeDetails,
        extraNote: w.extraNote || ""
      }))
    );

    setSavedSchedule(task.schedule || []);
    setSavedRemarks(task.remarks || []);

    // Load task inventories if they exist - FIXED: Use actual warrantyStatus from API
    if (task.taskInventories) {
      setInventories(task.taskInventories.map((inv: any) => ({
        productTypeId: inv.productTypeId,
        productTypeName: productTypes.find(pt => pt.id === inv.productTypeId)?.productTypeName || 'Unknown',
        makeModel: inv.makeModel,
        snMac: inv.snMac,
        description: inv.description,
        purchaseDate: inv.purchaseDate,
        warrantyPeriod: inv.warrantyPeriod,
        thirdPartyPurchase: inv.thirdPartyPurchase,
        // FIX: Use the actual warrantyStatus from API, default to "Active" only if null/undefined
        warrantyStatus: inv.warrantyStatus ?? "Active"
      })));
    } else {
      setInventories([]);
    }

    setEditingId(task.id || null);
    setShowModal(true);
  };

  // Remark editing handlers
  const handleOpenEditRemarkModal = (remark: TasksRemarks) => {
    setRemarkToEdit(remark);
    setEditRemarkText(remark.remark);
    setEditRemarkStatus(remark.status);

    if (showRemarksModal && selectedTask) {
      setTaskForRemarkEdit(selectedTask);
    } else if (showModal && editingId) {
      let currentStatus = 'Open';
      if (savedRemarks.length > 0) {
        const sortedRemarks = [...savedRemarks].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        currentStatus = sortedRemarks[0]?.status || 'Open';
      }

      setTaskForRemarkEdit({
        id: editingId,
        taskID: formData.taskID,
        departmentId: formData.departmentId,
        addressBookId: formData.addressBookId,
        siteId: formData.siteId,
        status: currentStatus,
        createdBy: formData.createdBy,
        createdAt: formData.createdAt,
        description: formData.description,
        title: formData.title,
        contacts: savedContacts,
        workscopeDetails: savedWorkscopeDetails,
        schedule: savedSchedule,
        remarks: savedRemarks
      } as Task);
    }

    setShowEditRemarkModal(true);
  };

  const handleSaveEditedRemark = async () => {
    if (!remarkToEdit) return;

    const token = getAuthToken();

    try {
      const response = await fetch(`http://localhost:8000/tasks-remarks/${remarkToEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          remark: editRemarkText,
          status: editRemarkStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update remark");
      }

      const updated = await response.json();

      const updatedRemarks = savedRemarks.map(r =>
        r.id === updated.id ? updated : r
      );

      setSavedRemarks(updatedRemarks);

      setShowEditRemarkModal(false);
      setRemarkToEdit(null);

      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError("Failed to update remark");
    }
  };

  const handleCloseEditRemarkModal = () => {
    setShowEditRemarkModal(false);
    setRemarkToEdit(null);
    setTaskForRemarkEdit(null);
  };

  // Inventory Modal Component - UPDATED with warrantyStatus field
  // Replace the entire InventoryModalComponent with this updated version:
  const InventoryModalComponent = () => {
    const [form, setForm] = useState({
      productTypeId: "",
      makeModel: "",
      snMac: "",
      description: "",

      purchaseDate: "",
      warrantyPeriod: "",
      warrantyStatus: "",
      thirdPartyPurchase: false
    });

    // Add state to track if we're editing an existing item
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    if (!showInventoryModal) return null;

    // Function to reset the form
    const resetForm = () => {
      setForm({
        productTypeId: "",
        makeModel: "",
        snMac: "",
        description: "",
        purchaseDate: "",
        warrantyPeriod: "",
        warrantyStatus: "Active",
        thirdPartyPurchase: false
      });
      setEditingIndex(null);
    };

  

    const handleSave = () => {
      if (!form.productTypeId || !form.makeModel || !form.snMac) {
        alert("Product type, model, SN/MAC are required");
        return;
      }

      const selectedProduct = productTypes.find(
        (pt: any) => pt.id === Number(form.productTypeId)
      );

      const newInventoryItem = {
        ...form,
        productTypeId: Number(form.productTypeId),
        productTypeName: selectedProduct?.productTypeName,
        warrantyStatus: form.warrantyStatus,
      };

      if (editingIndex !== null) {
        // Update existing item
        const updatedInventories = [...inventories];
        updatedInventories[editingIndex] = newInventoryItem;
        setInventories(updatedInventories);
      } else {
        // Add new item
        setInventories((prev: any[]) => [...prev, newInventoryItem]);
      }

      setShowInventoryModal(false);
      resetForm();
    };

    const handleDelete = (index: number) => {
      if (confirm('Are you sure you want to remove this inventory item?')) {
        setInventories(prev => prev.filter((_, i) => i !== index));
        if (editingIndex === index) {
          resetForm();
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl text-gray-900 font-semibold">
              {editingIndex !== null ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </h2>
            <button
              onClick={() => {
                setShowInventoryModal(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type *
                </label>
                <select
                  value={form.productTypeId}
                  onChange={(e) =>
                    setForm({ ...form, productTypeId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                >
                  <option value="">Select Product Type</option>
                  {productTypes.map((pt: any) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.productTypeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make & Model *
                </label>
                <input
                  value={form.makeModel}
                  onChange={(e) =>
                    setForm({ ...form, makeModel: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SN / MAC *
                </label>
                <input
                  value={form.snMac}
                  onChange={(e) =>
                    setForm({ ...form, snMac: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Status
                </label>
                <select
                  value={form.warrantyStatus}
                  onChange={(e) =>
                    setForm({ ...form, warrantyStatus: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Void">Void</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm({ ...form, purchaseDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Period
                </label>
                <input
                  value={form.warrantyPeriod}
                  onChange={(e) =>
                    setForm({ ...form, warrantyPeriod: e.target.value })
                  }
                  placeholder="e.g., 1 year, 2 years"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>




            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                rows={3}
              />
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="thirdPartyPurchase"
                checked={form.thirdPartyPurchase}
                onChange={(e) =>
                  setForm({ ...form, thirdPartyPurchase: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="thirdPartyPurchase" className="text-sm font-medium text-gray-700">
                Third Party Purchase?
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowInventoryModal(false)}
              className="px-5 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 -mt-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Management</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex gap-4">
            <button
              onClick={handleOpenModal}
              disabled={!taskPermissions.create}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${taskPermissions.create
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              <PlusIcon className="h-5 w-5" />
              Create Task
            </button>
          </div>

          {/* 🔍 Search Bar */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-blue-800 font-semibold">
                      Task ID
                    </th>
                    <th className="px-6 py-4 text-left text-blue-800 font-semibold">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-blue-800 font-semibold">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-blue-800 font-semibold">
                      Site
                    </th>
                    <th className="px-6 py-4 text-left text-blue-800 font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-blue-800 font-semibold">
                      Remarks
                    </th>
                    <th className="px-6 py-4 text-left text-blue-800 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {paginatedTasks.map((task) => {

      
   const isOverdueOpen =
      isTaskOpen(task) && 
      isTaskOlderThan24Hours(task) && 
      !hasTaskBeenAttempted(task);

      return (
        <tr
          key={task.id}
          className={`
            border-b transition-all
            ${isOverdueOpen
              ? "bg-red-50 border-l-4 border-red-600"
              : "hover:bg-gray-50"}
          `}
        >
          <td className="p-3 font-medium text-gray-900">
            {task.taskID}
            {isOverdueOpen && (
              <span className="ml-2 text-xs font-semibold text-red-600">
                ⚠ Open &gt; 24h
              </span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {departments.find(d => d.id === task.departmentId)?.departmentName || 'N/A'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {addressBooks.find(ab => ab.id === task.addressBookId)?.customerName || 'N/A'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {sites.find(s => s.id === task.siteId)?.siteName || 'N/A'}
          </td>

          <td className="px-6 py-4 whitespace-nowrap">
            {(() => {
              // No remarks at all → default Open
              if (!task.remarks || task.remarks.length === 0) {
                return (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    Open
                  </span>
                );
              }

              // Sort remarks by latest
              const sortedRemarks = [...task.remarks].sort(
                (a, b) => (b.id || 0) - (a.id || 0)
              );

              const latestRemark = sortedRemarks[0];
              const status = latestRemark?.status || 'Open';

              return (
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : status === 'Work in Progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : status === 'On-Hold'
                          ? 'bg-orange-100 text-orange-800'
                          : status === 'Rescheduled'
                            ? 'bg-purple-100 text-purple-800'
                            : status === 'Scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : status === 'Reopen'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800' // Open + fallback
                    }`}
                >
                  {status}
                </span>
              );
            })()}
          </td>


          <td className="px-6 py-4 text-sm text-gray-900 align-top w-64">
            {task.remarks && task.remarks.length > 0 ? (
              <div className="flex flex-col space-y-1">
                <div className="font-medium break-words leading-snug">
                  {(() => {
                    const sortedRemarks = [...task.remarks].sort((a, b) => (b.id || 0) - (a.id || 0));
                    const latestRemark = sortedRemarks[0];

                    return (
                      <span className="block text-gray-800">
                        {latestRemark.remark}
                      </span>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <span className="text-gray-400">No remarks</span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex gap-2">
              <a
                            href={`/tasks/view/${task.taskID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900 underline"
                          >
                            View
                          </a>

              <button

                onClick={() => taskPermissions.edit && handleEditTask(task)}
                disabled={!taskPermissions.edit}
                className={`transition-colors
                  ${taskPermissions.edit
                    ? "text-blue-600 hover:text-blue-900"
                    : "text-gray-400 cursor-not-allowed"
                  }`}
                title={
                  taskPermissions.edit ? "Edit Task" : "No permission to edit"
                }
              >

                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() =>
                  taskPermissions.create && handleOpenRemarksModal(task)
                }
                disabled={!taskPermissions.create}
                className={`transition-colors
                  ${taskPermissions.create
                    ? "text-green-600 hover:text-green-900"
                    : "text-gray-400 cursor-not-allowed"
                  }`}
                title={
                  taskPermissions.create
                    ? "View / Add Remarks"
                    : "No permission to add remarks"
                }
              >

                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </button>
              <button
                onClick={() => taskPermissions.delete && handleDeleteTask(task.id!)}
                disabled={!taskPermissions.delete}
                className={`transition-colors
                  ${taskPermissions.delete
                    ? "text-red-600 hover:text-red-900"
                    : "text-gray-400 cursor-not-allowed"
                  }`}
                title={
                  taskPermissions.delete ? "Delete Task" : "No permission to delete"
                }
              >

                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      );
    })}
    {tasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No tasks found. Create your first task!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* 📄 Pagination Controls */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Task Modal */}
        <TaskModal
          showModal={showModal}
          editingId={editingId}
          formData={formData}
          departments={departments}
          addressBooks={addressBooks}
          sites={sites}
          serviceWorkscopeCategories={serviceWorkscopeCategories}
          departmentSearch={departmentSearch}
          customerSearch={customerSearch}
          workscopeCategorySearch={workscopeCategorySearch}
          showDepartmentDropdown={showDepartmentDropdown}
          showCustomerDropdown={showCustomerDropdown}
          showWorkscopeDropdown={showWorkscopeDropdown}
          filteredDepartments={filteredDepartments}
          filteredCustomers={filteredCustomers}
          filteredWorkscopeCategories={filteredWorkscopeCategories}
          filteredSites={filteredSites}
          savedContacts={savedContacts}
          savedWorkscopeDetails={savedWorkscopeDetails}
          savedSchedule={savedSchedule}
          savedRemarks={savedRemarks}
          editingSavedContact={editingSavedContact}
          editingSavedWorkscope={editingSavedWorkscope}
          editingSavedSchedule={editingSavedSchedule}
          inventories={inventories}
          productTypes={productTypes}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          onDepartmentSearchChange={setDepartmentSearch}
          onCustomerSearchChange={setCustomerSearch}
          onWorkscopeCategorySearchChange={setWorkscopeCategorySearch}
          onShowDepartmentDropdownChange={setShowDepartmentDropdown}
          onShowCustomerDropdownChange={setShowCustomerDropdown}
          onShowWorkscopeDropdownChange={setShowWorkscopeDropdown}
          onFormDataChange={setFormData}
          onAddContact={handleAddContact}
          onRemoveContact={handleRemoveContact}
          onUpdateContact={handleUpdateContact}
          onAddWorkscopeDetail={handleAddWorkscopeDetail}
          onRemoveWorkscopeDetail={handleRemoveWorkscopeDetail}
          onUpdateWorkscopeDetail={handleUpdateWorkscopeDetail}
          onAddSchedule={handleAddSchedule}
          onRemoveSchedule={handleRemoveSchedule}
          onUpdateSchedule={handleUpdateSchedule}
          onAddRemark={handleAddRemark}
          onRemoveRemark={handleRemoveRemark}
          onUpdateRemark={handleUpdateRemark}
          onSaveContact={handleSaveContact}
          onSaveWorkscopeDetail={handleSaveWorkscopeDetail}
          onSaveSchedule={handleSaveSchedule}
          onSaveRemark={handleSaveRemark}
          onRemoveSavedContact={handleRemoveSavedContact}
          onRemoveSavedWorkscopeDetail={handleRemoveSavedWorkscopeDetail}
          onRemoveSavedSchedule={handleRemoveSavedSchedule}
          onRemoveSavedRemark={handleRemoveSavedRemark}
          onStartEditSavedContact={handleStartEditSavedContact}
          onSaveEditedContact={handleSaveEditedContact}
          onCancelEditSavedContact={handleCancelEditSavedContact}
          onStartEditSavedWorkscope={handleStartEditSavedWorkscope}
          onSaveEditedWorkscope={handleSaveEditedWorkscope}
          onCancelEditSavedWorkscope={handleCancelEditSavedWorkscope}
          onStartEditSavedSchedule={handleStartEditSavedSchedule}
          onSaveEditedSchedule={handleSaveEditedSchedule}
          onCancelEditSavedSchedule={handleCancelEditSavedSchedule}
          isTaskClosed={isTaskClosed}
          onEditLatestRemark={handleOpenEditRemarkModal}
          onOpenInventoryModal={() => setShowInventoryModal(true)}
          onRemoveInventory={removeInventory}
        />

        {/* Remarks Modal */}
        <RemarksModal
          showModal={showRemarksModal}
          task={selectedTask}
          savedRemarks={savedRemarks}
          onClose={handleCloseRemarksModal}
          onAddRemark={handleAddRemarkInModal}
          onRemoveRemark={handleRemoveRemarkInModal}
          onEditLatestRemark={handleOpenEditRemarkModal}
          getAllowedStatuses={getAllowedStatuses}
        />

        {/* Edit Remark Modal */}
        {showEditRemarkModal && remarkToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Latest Remark
              </h3>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={editRemarkStatus}
                onChange={(e) => setEditRemarkStatus(e.target.value)}
                className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {getAllowedStatuses(editRemarkStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remark
              </label>
              <textarea
                value={editRemarkText}
                onChange={(e) => setEditRemarkText(e.target.value)}
                className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                rows={3}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditRemarkModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedRemark}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Modal */}
        <InventoryModalComponent />
      </div>
    </div>
  );
}