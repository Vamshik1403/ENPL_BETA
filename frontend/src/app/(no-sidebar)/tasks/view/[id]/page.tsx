'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Department {
  id: number;
  departmentName: string;
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

interface ServiceWorkscopeCategory {
  id: number;
  workscopeCategoryName: string;
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

export default function ViewTaskPage() {
  const { id } = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [serviceWorkscopeCategories, setServiceWorkscopeCategories] = useState<ServiceWorkscopeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all related data
        const [taskRes, deptRes, addressRes, sitesRes, workscopeRes] = await Promise.all([
          fetch(`http://localhost:8000/task/${id}`),
          fetch('http://localhost:8000/department'),
          fetch('http://localhost:8000/address-book'),
          fetch('http://localhost:8000/sites'),
          fetch('http://localhost:8000/workscope-category')
        ]);

        if (!taskRes.ok) throw new Error('Failed to fetch task');
        
        const taskData = await taskRes.json();
        const deptData = await deptRes.json();
        const addressData = await addressRes.json();
        const sitesData = await sitesRes.json();
        const workscopeData = await workscopeRes.json();

        setTask(taskData);
        setDepartments(Array.isArray(deptData) ? deptData : []);
        setAddressBooks(Array.isArray(addressData) ? addressData : []);
        setSites(Array.isArray(sitesData) ? sitesData : []);
        setServiceWorkscopeCategories(Array.isArray(workscopeData) ? workscopeData : []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch task');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Helper functions to get related data
  const getDepartmentName = (departmentId: number) => {
    return departments.find(d => d.id === departmentId)?.departmentName || 'N/A';
  };

  const getCustomerName = (addressBookId: number) => {
    return addressBooks.find(ab => ab.id === addressBookId)?.customerName || 'N/A';
  };

  const getSiteName = (siteId: number) => {
    return sites.find(s => s.id === siteId)?.siteName || 'N/A';
  };

  const getWorkscopeCategoryName = (workscopeCategoryId: number) => {
    return serviceWorkscopeCategories.find(cat => cat.id === workscopeCategoryId)?.workscopeCategoryName || 'N/A';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-red-600 text-xl">{error}</div>
    </div>
  );
  
  if (!task) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600 text-xl">Task not found</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Details</h1>
          <p className="text-gray-600">Viewing task: {task.taskID}</p>
        </div>

        {/* Basic Task Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReadonlyField label="Task ID" value={task.taskID} />
            <ReadonlyField label="Status" value={task.status} />
            <ReadonlyField label="Department" value={getDepartmentName(task.departmentId)} />
            <ReadonlyField label="Customer" value={getCustomerName(task.addressBookId)} />
            <ReadonlyField label="Site" value={getSiteName(task.siteId)} />
            <ReadonlyField label="Created By" value={task.createdBy} />
            <ReadonlyField 
              label="Created At" 
              value={new Date(task.createdAt).toLocaleString()} 
            />
          </div>
        </div>

        {/* Task Contacts */}
        {task.contacts && task.contacts.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Task Contacts</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-3 text-left text-blue-800 font-semibold border">Contact Name</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border">Contact Number</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border">Contact Email</th>
                  </tr>
                </thead>
                <tbody>
                  {task.contacts.map((contact, index) => (
                    <tr key={contact.id || index} className="border-t hover:bg-gray-50">
                      <td className="p-3 border text-gray-700">{contact.contactName}</td>
                      <td className="p-3 border text-gray-700">{contact.contactNumber}</td>
                      <td className="p-3 border text-gray-700">{contact.contactEmail || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Workscope Details */}
        {task.workscopeDetails && task.workscopeDetails.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Workscope Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-3 text-left text-blue-800 font-semibold border">Category</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {task.workscopeDetails.map((workscope, index) => (
                    <tr key={workscope.id || index} className="border-t hover:bg-gray-50">
                      <td className="p-3 border text-gray-700">
                        {getWorkscopeCategoryName(workscope.workscopeCategoryId)}
                      </td>
                      <td className="p-3 border text-gray-700">{workscope.workscopeDetails}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Schedule */}
        {task.schedule && task.schedule.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Schedule</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="p-3 text-left text-blue-800 font-semibold border">Proposed Date & Time</th>
                    <th className="p-3 text-left text-blue-800 font-semibold border">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {task.schedule.map((schedule, index) => (
                    <tr key={schedule.id || index} className="border-t hover:bg-gray-50">
                      <td className="p-3 border text-gray-700">
                        {new Date(schedule.proposedDateTime).toLocaleString()}
                      </td>
                      <td className="p-3 border text-gray-700">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          schedule.priority === 'High' || schedule.priority === 'Urgent' 
                            ? 'bg-red-100 text-red-800' 
                            : schedule.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {schedule.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Remarks */}
        {task.remarks && task.remarks.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Remarks History</h2>
            <div className="space-y-4">
              {[...task.remarks].reverse().map((remark, index) => (
                <div key={remark.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      remark.status === 'Closed' ? 'bg-green-100 text-green-800' :
                      remark.status === 'Work in Progress' ? 'bg-yellow-100 text-yellow-800' :
                      remark.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {remark.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(remark.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2">{remark.remark}</p>
                  <div className="text-xs text-gray-500">
                    Added by {remark.createdBy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    </div>
  );
}

/* 🔹 Helper Components */
function ReadonlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 min-h-[42px] flex items-center">
        {value || '—'}
      </div>
    </div>
  );
}