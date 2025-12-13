'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerComplaintPage() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerSites, setCustomerSites] = useState<any[]>([]); // New state for sites
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [remarkText, setRemarkText] = useState('');

  // modal state
  const [showModal, setShowModal] = useState(false);

  // form state
  const [siteId, setSiteId] = useState<number>(0);
  const [departmentId, setDepartmentId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  /* ---------------- INIT ---------------- */

  const fetchTasksByCustomers = async (customerIds: number[]) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/task/by-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds }),
      });

      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestStatus = (task: any): string => {
    if (!task.remarks || task.remarks.length === 0) return 'Open';

    return [...task.remarks]
      .sort((a, b) => b.id - a.id)[0]
      .status.trim();
  };



  useEffect(() => {
    const data = localStorage.getItem('customerSession');
    if (!data) {
      router.push('/customerlogin');
      return;
    }

    const parsed = JSON.parse(data);
    setSession(parsed);

    fetch('http://localhost:8000/department')
      .then(res => res.json())
      .then(setDepartments);

    // ✅ THIS IS CORRECT
    const customerIds: number[] = Array.from(
      new Set(
        (parsed.sites as any[]).map((s) => Number(s.customerId))
      ),
    );


    fetchTasksByCustomers(customerIds);
    fetchCustomerSites(parsed.sites[0].customerId);
  }, []);

  const fetchTasks = async (customerId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/task/by-customer/${customerId}`,
      );

      if (!res.ok) {
        throw new Error('Failed to fetch customer tasks');
      }

      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchCustomerSites = async (addressBookId: number) => {
    try {
      // Fetch sites based on addressBookId
      const res = await fetch(
        `http://localhost:8000/sites/based-on-cust?addressBookId=${addressBookId}`,
      );
      const data = await res.json();
      setCustomerSites(data);
      console.log('Fetched sites:', data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  if (!session) return null;

  /* ---------------- SUBMIT TASK ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!siteId || !departmentId || !title) {
      alert('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare payload according to CreateTaskDto
      const payload = {
        departmentId: departmentId,
        addressBookId: session.sites[0].customerId,
        siteId: siteId,
        status: 'Open', // Default status
        remarks: [                              
          {
            remark: description,
createdBy: `${session.sites[0]?.addressBook?.customerName || 'Customer'} - ${customerSites.find(s => s.id === siteId)?.siteName || 'Site'} (${session.custFirstName} ${session.custLastName})`,
          },
        ],
        title: title // Additional field for title
      };

      const response = await fetch('http://localhost:8000/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      const result = await response.json();
      console.log('Task created successfully:', result);

      // Reset form
      setShowModal(false);
      setSiteId(0);
      setDepartmentId(0);
      setTitle('');
      setDescription('');

      // Refresh tasks list
      fetchTasks(session.sites[0].customerId);

    } catch (error: any) {
      console.error('Error creating task:', error);
      alert(`Error: ${error.message || 'Failed to create task'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- FORMAT DATE ---------------- */

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTaskStatus = (task: any): string => {
    if (!task.remarks || task.remarks.length === 0) return 'Open';

    const latest = [...task.remarks].sort(
      (a, b) => (b.id || 0) - (a.id || 0),
    )[0];

    return (latest?.status || 'Open').trim();
  };


  const getLatestRemark = (task: any): string => {
    if (!task.remarks || task.remarks.length === 0) return '';

    const latest = [...task.remarks].sort(
      (a, b) => (b.id || 0) - (a.id || 0),
    )[0];

    return latest?.remark || '';
  };

  /* ---------------- GET STATUS BADGE STYLE ---------------- */

  const getStatusBadgeStyle = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /* ===================================================== */

  return (
    <div className="min-h-screen text-black bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Customer Tasks/Complaints
            </h1>

          </div>

          <button
            onClick={() => setShowModal(true)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Task
          </button>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Total Tasks</div>
            <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Open Tasks</div>
            <div className="text-3xl font-bold text-blue-600">
              {tasks.filter(t => getTaskStatus(t).toLowerCase() === 'open').length}
            </div>

          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">In Progress</div>
            <div className="text-3xl font-bold text-yellow-600">
              {tasks.filter(t => t.status.toLowerCase().includes('progress')).length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {tasks.filter(
                t => getTaskStatus(t).trim().toLowerCase() === 'completed'
              ).length}
            </div>

          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>
                <p className="text-sm text-gray-600">
                  {isLoading ? 'Loading tasks...' : `${tasks.length} tasks found`}
                </p>
              </div>
              {tasks.length > 0 && (
                <button
                  onClick={() => {
                    fetchTasks(session.sites[0].customerId);
                    fetchCustomerSites(session.sites[0].customerId);
                  }}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-4">Loading tasks...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Task ID
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Latest Remark
                    </th>
                    
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Remarks
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50 transition">

                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-700">
                          {task.taskID}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {task.site?.siteName || 'Unknown Site'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {task.department?.departmentName || 'Unknown Department'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {task.title || task.description?.substring(0, 50) + '...'}
                        </div>   
                      </td>

                      <td className="px-6 py-4">

                          {getLatestRemark(task) && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {getLatestRemark(task)}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {(() => {
                          const status = getTaskStatus(task);

                          return (
                            <span
                              className={`inline-flex  items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(
                                status,
                              )}`}
                            >
                              {status}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setActiveTask(task);
                            setRemarkText('');
                            setRemarkModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-lg"
                          title="View / Add Remark"
                        >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </button>
                      </td>


                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(task.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.updatedAt !== task.createdAt ? 'Updated' : 'Created'}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-600 mb-2">No tasks found</h4>
                        <p className="text-gray-500 mb-4">Get started by creating your first task/complaint</p>
                        <button
                          onClick={() => setShowModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create First Task
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {remarkModalOpen && activeTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl">

              {/* HEADER */}
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <div>
                  <h2 className="text-lg font-bold">
                    Remarks for Task: {activeTask.taskID}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Current Status:
                    <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-xs">
                      {getLatestStatus(activeTask)}
                    </span>
                  </p>
                </div>

                <button onClick={() => setRemarkModalOpen(false)}>✕</button>
              </div>

              {/* BODY */}
              <div className="p-6 space-y-4">

                {/* NEW REMARK */}
                <textarea
                  className="w-full border rounded p-3"
                  placeholder="Enter your message..."
                  value={remarkText}
                  onChange={e => setRemarkText(e.target.value)}
                />

                {/* ACTION BUTTONS */}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      await fetch(
                        `http://localhost:8000/task/${activeTask.id}/customer-remark`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            remark: remarkText,
                            createdBy: `${activeTask.addressBook?.customerName || 'Customer'} - ${activeTask.site?.siteName || 'Site'} (${session.custFirstName} ${session.custLastName})`,
                          }),
                        },
                      );
                      setRemarkModalOpen(false);
                      fetchTasksByCustomers(
                        session.sites.map((s: any) => s.customerId),
                      );
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Send Message
                  </button>


                  {getLatestStatus(activeTask) === 'Completed' && (
                    <button
                      onClick={async () => {
                        const payload: any = {
                          remark: remarkText || 'Reopened by customer',
                          createdBy: `${activeTask.addressBook?.customerName || 'Customer'} - ${activeTask.site?.siteName || 'Site'} (${session.custFirstName} ${session.custLastName})`,
                        };

                        // ✅ Only NOW we change status
                        payload.status = 'Reopen';

                        await fetch(
                          `http://localhost:8000/task/${activeTask.id}/customer-remark`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                          },
                        );

                        setRemarkModalOpen(false);
                        fetchTasksByCustomers(
                          session.sites.map((s: any) => s.customerId),
                        );
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Reopen
                    </button>
                  )}

                </div>

                {/* CHAT HISTORY */}
                <div className="space-y-3 max-h-64 overflow-y-auto border-t pt-4">
                  {[...activeTask.remarks]
                    .sort((a, b) => b.id - a.id)
                    .map((r: any) => (
                      <div key={r.id} className="border rounded p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-semibold">{r.createdBy}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1">{r.remark}</div>
                        <span className="text-xs bg-gray-100 px-2 rounded mt-1 inline-block">
                          {r.status}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL ================= */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>

                </div>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Site Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site *
                    </label>
                    <select
                      className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                      value={siteId || ''}
                      onChange={e => setSiteId(Number(e.target.value))}
                      required
                      disabled={isLoading || customerSites.length === 0}
                    >
                      <option value="">Select a site</option>
                      {customerSites.map(site => (
                        <option key={site.id} value={site.id}>
                          {site.siteName}
                        </option>
                      ))}
                    </select>

                  </div>

                  {/* Department Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                      value={departmentId || ''}
                      onChange={e => setDepartmentId(Number(e.target.value))}
                      required
                      disabled={isLoading}
                    >
                      <option value="">Select a department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.departmentName}
                        </option>
                      ))}
                    </select>

                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    placeholder="Enter a brief title for the task"
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Provide detailed description of the task or complaint (optional)"
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition h-32"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={isLoading}
                  />

                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Customer Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {session.custFirstName} {session.custLastName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Default Status</p>
                      <p className="text-sm font-medium text-blue-600">
                        open
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading || customerSites.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : customerSites.length === 0 ? (
                      'Loading Sites...'
                    ) : (
                      'Create Task'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isLoading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 px-6 py-3 rounded-lg font-medium transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}