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
  department?: string;
  customer?: string;
  site?: string;
  addressBook?: string;
  workscopeCat?: string;
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
  onAddWorkscopeDetail: () => void; // ✅ Add this line
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
}

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
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Task' : 'Add New Task'}
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
            </div>

            {/* Task Contacts */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Task Contacts</h3>
                <button
                  type="button"
                  onClick={onAddContact}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  + Add Contact
                </button>
              </div>

              {/* Current Form Contacts */}
              {formData.contacts.map((contact, index) => (
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
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Workscope Details</h3>
                <button
                  type="button"
                  onClick={onAddWorkscopeDetail}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  + Add WorkScope
                </button>
              </div>

              {/* Current Form Workscope Details */}
              {formData.workscopeDetails.map((detail, index) => (
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
                  <div className="flex items-end gap-2 md:col-span-2">
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
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Schedule</h3>
              </div>

              {/* Add New Schedule Form - Keep this for adding new schedules */}
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

            {/* Task Remarks */}
            {/* Task Remarks */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Task Remarks</h3>
              </div>

              {/* Add New Remark Form - Keep this for adding new remarks */}
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
                  >
                    <option value="Open">Open</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Work in Progress">Work in Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-end gap-2 md:col-span-3">
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

              {/* Saved Remarks Display - Show existing remarks as read-only */}
              {savedRemarks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Saved Remarks</h4>
                  <div className="space-y-3">
                    {[...savedRemarks].reverse().map((remark, index) => (
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

                        {savedRemarks.indexOf(remark) === savedRemarks.length - 1 && (
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
}

const RemarksModal: React.FC<RemarksModalProps> = ({
  showModal,
  task,
  savedRemarks,
  onClose,
  onAddRemark,
  onRemoveRemark,
  onEditLatestRemark,
}) => {
  const [newRemark, setNewRemark] = useState('');
  const [newStatus, setNewStatus] = useState('Open');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRemark.trim()) {
      onAddRemark(newRemark.trim(), newStatus);
      setNewRemark('');
      setNewStatus('Open');
    }
  };

  if (!showModal || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Remarks for Task: {task.taskID}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Add New Remark Form */}
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
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Work in Progress">Work in Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Remark
            </button>
          </form>

          {/* Remarks List */}
          {/* Remarks List - Latest First */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {savedRemarks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No remarks yet</p>
            ) : (
              [...savedRemarks].reverse().map((remark, index) => (
                <div
                  key={remark.id}
                  className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${remark.status === 'Closed' ? 'bg-green-100 text-green-800' :
                      remark.status === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
                        remark.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {remark.status}
                    </span>
                    <div className="flex gap-2">
                      {/* Edit button for latest remark only - now checking the original array order */}
                      {savedRemarks.indexOf(remark) === savedRemarks.length - 1 && (
                        <button
                          onClick={() => onEditLatestRemark(remark)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveRemark(remark.id!)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-900 mb-2">{remark.remark}</p>
                  <div className="text-xs text-gray-500">
                    Added by {remark.createdBy} on {new Date(remark.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
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
  // 🔍 Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔍 Filter tasks by ID, department, customer, site, or status
  const filteredTasks = tasks.filter((task) => {
    const term = searchTerm.toLowerCase();
    const departmentName = departments.find(d => d.id === task.departmentId)?.departmentName?.toLowerCase() || '';
    const customerName = addressBooks.find(a => a.id === task.addressBookId)?.customerName?.toLowerCase() || '';
    const siteName = sites.find(s => s.id === task.siteId)?.siteName?.toLowerCase() || '';

    return (
      task.taskID.toLowerCase().includes(term) ||
      departmentName.includes(term) ||
      customerName.includes(term) ||
      siteName.includes(term) ||
      task.status.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    taskID: '',
    departmentId: departments.length > 0 ? departments[0].id : 0, // ✅ same fix here
    addressBookId: 0,
    siteId: 0,
    status: 'Open',
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
    contacts: [],
    workscopeDetails: [],
    schedule: [],
    remarks: []
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

  // Fetch data
  useEffect(() => {
    fetchTasks();
    fetchDepartments();
    fetchAddressBooks();
    fetchSites();
    fetchNextTaskId();
    fetchServiceWorkscopeCategories();
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

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:8000/task');
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
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
    setFormData({
      taskID: nextTaskId,
      departmentId: departments.length > 0 ? departments[0].id : 0, // ✅ auto select first
      addressBookId: 0,
      siteId: 0,
      status: 'Open',
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
      // Start with one empty contact
      contacts: [{ taskId: 0, contactName: '', contactNumber: '', contactEmail: '' }],
      // Start with one empty workscope detail
      workscopeDetails: [{ taskId: 0, workscopeCategoryId: 0, workscopeDetails: '', extraNote: '' }],
      // Start with one empty schedule
      schedule: [{ taskId: 0, proposedDateTime: '', priority: 'Medium' }],
      // Start with one empty remark
      remarks: [{
        taskId: 0,
        remark: '',
        status: 'Open',
        createdBy: 'Admin',
        createdAt: new Date().toISOString()
      }]
    });
    setSavedContacts([]);
    setSavedWorkscopeDetails([]);
    setSavedSchedule([]);
    setSavedRemarks([]);
    setEditingId(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      taskID: '',
      departmentId: departments.length > 0 ? departments[0].id : 0, // ✅ same fix here
      addressBookId: 0,
      siteId: 0,
      status: 'Open',
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
      contacts: [{ taskId: 0, contactName: '', contactNumber: '', contactEmail: '' }],
      workscopeDetails: [{ taskId: 0, workscopeCategoryId: 0, workscopeDetails: '', extraNote: '' }],
      schedule: [{ taskId: 0, proposedDateTime: '', priority: 'Medium' }],
      remarks: [{
        taskId: 0,
        remark: '',
        status: 'Open',
        createdBy: 'Admin',
        createdAt: new Date().toISOString()
      }]
    });
    setSavedContacts([]);
    setSavedWorkscopeDetails([]);
    setSavedSchedule([]);
    setSavedRemarks([]);
  };

  const handleOpenRemarksModal = (task: Task) => {
    setSelectedTask(task);
    setSavedRemarks(task.remarks || []);
    setShowRemarksModal(true);
  };

  const handleCloseRemarksModal = () => {
    setShowRemarksModal(false);
    setSelectedTask(null);
    setSavedRemarks([]);
  };

  // Form submission
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty form entries and only use saved items
      const taskData = {
        taskID: formData.taskID,
        departmentId: formData.departmentId,
        addressBookId: formData.addressBookId,
        siteId: formData.siteId,
        status: formData.status,
        createdBy: formData.createdBy,
        createdAt: formData.createdAt,
        // Use only savedContacts (form contacts are temporary for adding new ones)
        contacts: savedContacts.filter(contact =>
          contact.contactName && contact.contactNumber
        ),
        // Use only savedWorkscopeDetails
        workscopeDetails: savedWorkscopeDetails.filter(workscope =>
          workscope.workscopeDetails && workscope.workscopeCategoryId
        ),
        // Use only savedSchedule
        schedule: savedSchedule.filter(schedule =>
          schedule.proposedDateTime && schedule.priority
        ),
        // Use only savedRemarks
        remarks: savedRemarks.filter(remark =>
          remark.remark && remark.status
        )
      };

      const url = editingId ? `http://localhost:8000/task/${editingId}` : 'http://localhost:8000/task';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to save task');
      }

      await fetchTasks();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };



  const handleAddRemarkInModal = async (remark: string, status: string) => {
    if (!selectedTask) return;

    try {
      // 🧹 Prepare a safe payload — remove relation objects dynamically
      const { id, ...rest } = selectedTask as any;

      // Remove potential nested relation objects if they exist
      delete rest.department;
      delete rest.addressBook;
      delete rest.site;
      delete rest.workscopeCat;

      // 🆕 New remark object
      const newRemarkObj = {
        taskId: id!,
        remark,
        status,
        createdBy: "Admin",
        createdAt: new Date().toISOString(),
      };

      // ✅ Construct update payload
      const updatedTask = {
        ...rest,
        remarks: [...(selectedTask.remarks || []), newRemarkObj],
      };

      // ✅ Use same PATCH endpoint as full edit
      const response = await fetch(`http://localhost:8000/task/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) throw new Error("Failed to update task with new remark");

      // ✅ Update UI instantly
      // ✅ Update UI instantly - add to end so it appears first when reversed
      setSavedRemarks((prev) => [...prev, { ...newRemarkObj, id: Date.now() }]);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update remark");
    }
  };

  const handleRemoveRemarkInModal = async (id: number) => {
    try {
      // Remove remark from local state
      const updatedRemarks = savedRemarks.filter(remark => remark.id !== id);

      if (selectedTask) {
        // Create updated task without the removed remark
        const updatedTask = {
          ...selectedTask,
          remarks: updatedRemarks
        };

        // Use the same API as edit modal
        const response = await fetch(`http://localhost:8000/task/${selectedTask.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedTask),
        });

        if (!response.ok) throw new Error('Failed to remove remark');
      }

      // Update local state
      setSavedRemarks(updatedRemarks);
      await fetchTasks();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove remark');
    }
  };

  // Update the handleDeleteTask function
  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`http://localhost:8000/task/${id}`, {
        method: 'DELETE',
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

  // Workscope handlers
  const handleAddWorkscopeDetail = () => {
    setFormData(prev => ({
      ...prev,
      workscopeDetails: [...prev.workscopeDetails, { taskId: 0, workscopeCategoryId: 0, workscopeDetails: '', extraNote: '' }]
    }));
  };

  const handleRemoveWorkscopeDetail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workscopeDetails: prev.workscopeDetails.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateWorkscopeDetail = (index: number, field: keyof TasksWorkscopeDetails, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      workscopeDetails: prev.workscopeDetails.map((detail, i) =>
        i === index ? { ...detail, [field]: value } : detail
      )
    }));
  };

  const handleSaveWorkscopeDetail = (index: number) => {
    const workscope = formData.workscopeDetails[index];
    if (workscope.workscopeDetails && workscope.workscopeCategoryId) {
      setSavedWorkscopeDetails(prev => [...prev, { ...workscope, id: Date.now() }]);
      handleRemoveWorkscopeDetail(index);
    }
  };

  const handleRemoveSavedWorkscopeDetail = (id: number) => {
    setSavedWorkscopeDetails(prev => prev.filter(workscope => workscope.id !== id));
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
      // Reset the form to empty values
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
      setSavedRemarks(prev => [...prev, {
        ...remark,
        id: Date.now(),
        createdAt: new Date().toISOString()
      }]);
      setFormData(prev => ({
        ...prev,
        remarks: [{ taskId: 0, remark: '', status: 'Open', createdBy: 'Admin', createdAt: new Date().toISOString() }]
      }));
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

  // Edit task
  // Edit task
  const handleEditTask = (task: Task) => {
    const formattedSchedule = (task.schedule || []).map(schedule => ({
      ...schedule,
      proposedDateTime: schedule.proposedDateTime ?
        new Date(schedule.proposedDateTime).toISOString().slice(0, 16) : ''
    }));

    setFormData({
      taskID: task.taskID,
      departmentId: task.departmentId,
      addressBookId: task.addressBookId,
      siteId: task.siteId,
      status: task.status,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      // Start with one empty contact for adding new ones
      contacts: [{ taskId: 0, contactName: '', contactNumber: '', contactEmail: '' }],
      // Start with one empty workscope detail for adding new ones
      workscopeDetails: [{ taskId: 0, workscopeCategoryId: 0, workscopeDetails: '', extraNote: '' }],
      // Start with one empty schedule for adding new ones
      schedule: [{ taskId: 0, proposedDateTime: '', priority: 'Medium' }],
      // Start with one empty remark for adding new ones
      remarks: [{
        taskId: 0,
        remark: '',
        status: 'Open',
        createdBy: 'Admin',
        createdAt: new Date().toISOString()
      }]
    });

    // Set saved items with the actual data from the task
    setSavedContacts(task.contacts || []);
    setSavedWorkscopeDetails(task.workscopeDetails || []);
    setSavedSchedule(task.schedule || []);
    setSavedRemarks(task.remarks || []);
    setEditingId(task.id || null);
    setShowModal(true);
  };



  // Remark editing handlers
  const handleOpenEditRemarkModal = (remark: TasksRemarks) => {
    setRemarkToEdit(remark);
    setEditRemarkText(remark.remark);
    setEditRemarkStatus(remark.status);

    // Determine which task we're editing
    if (showModal && editingId) {
      // We're in the main task modal - create a task object from current form data
      setTaskForRemarkEdit({
        id: editingId,
        taskID: formData.taskID,
        departmentId: formData.departmentId,
        addressBookId: formData.addressBookId,
        siteId: formData.siteId,
        status: formData.status,
        createdBy: formData.createdBy,
        createdAt: formData.createdAt,
        remarks: savedRemarks
      } as Task);
    } else if (showRemarksModal && selectedTask) {
      // We're in the remarks-only modal
      setTaskForRemarkEdit(selectedTask);
    }

    setShowEditRemarkModal(true);
  };

  const handleSaveEditedRemark = async () => {
    if (!remarkToEdit || !taskForRemarkEdit) return;

    try {
      // Determine which remarks array to update based on context
      let currentRemarks: TasksRemarks[] = [];

      if (showModal) {
        // We're in the main task modal - use savedRemarks
        currentRemarks = [...savedRemarks];
      } else if (showRemarksModal) {
        // We're in the remarks-only modal
        currentRemarks = [...savedRemarks];
      }

      if (currentRemarks.length === 0) {
        throw new Error("No remarks found to edit");
      }

      // Update the latest remark (last one in the array)
      const updatedRemarks = currentRemarks.map((remark, index, array) => {
        // Check if this is the latest remark (last in array) AND matches the remark we're editing
        const isLatestRemark = index === array.length - 1;
        const isTargetRemark = remark.id === remarkToEdit.id;

        if (isLatestRemark && isTargetRemark) {
          return {
            ...remark,
            remark: editRemarkText,
            status: editRemarkStatus,
            createdAt: new Date().toISOString() // Update timestamp
          };
        }
        return remark;
      });

      // Prepare task data for update
      const cleanTask = { ...taskForRemarkEdit } as any;
      delete cleanTask.department;
      delete cleanTask.addressBook;
      delete cleanTask.site;
      delete cleanTask.workscopeCat;

      const updatedTask = {
        ...cleanTask,
        remarks: updatedRemarks,
      };

      // Update in backend
      const response = await fetch(`http://localhost:8000/task/${taskForRemarkEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) throw new Error("Failed to update remark");

      // Update local state based on which modal we're in
      if (showModal) {
        // Update the saved remarks in task modal
        setSavedRemarks(updatedRemarks);
        // Also update form data if we're editing the current task
        if (editingId === taskForRemarkEdit.id) {
          setFormData(prev => ({
            ...prev,
            remarks: updatedRemarks
          }));
        }
      } else if (showRemarksModal) {
        // Update the saved remarks in remarks modal
        setSavedRemarks(updatedRemarks);
      }

      // Refresh tasks list
      await fetchTasks();

      setShowEditRemarkModal(false);
      setRemarkToEdit(null);
      setTaskForRemarkEdit(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update remark");
    }
  };

  const handleCloseEditRemarkModal = () => {
    setShowEditRemarkModal(false);
    setRemarkToEdit(null);
    setTaskForRemarkEdit(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Management</h1>
          <p className="text-gray-600">Create and manage tasks for your team</p>
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Add New Task
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Task ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {task.taskID}
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${task.status === 'Closed' ? 'bg-green-100 text-green-800' :
                          task.status === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.remarks && task.remarks.length > 0 ? (
                          <div>
                            <div className="font-medium">Latest: {task.remarks[task.remarks.length - 1].remark}</div>
                            <div className="text-xs text-gray-500">
                              Status: {task.remarks[task.remarks.length - 1].status}
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
                            onClick={() => handleEditTask(task)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit Task"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenRemarksModal(task)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="View/Add Remarks"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id!)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete Task"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
        />

        {/* Edit Remark Modal */}
        {showEditRemarkModal && (
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
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="Work in Progress">Work in Progress</option>
                <option value="Closed">Closed</option>
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
      </div>
    </div>
  );
}