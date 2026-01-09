"use client";

import { useEffect, useState } from "react";

interface Task {
  id: number;
  status: string;
}

interface TaskRemark {
  taskId: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [siteCount, setSiteCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [serviceContractCount, setServiceContractCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [productTypeCount, setProductTypeCount] = useState(0);
  const [contractworkCount, setContractworkCount] = useState(0);
  const [workscopeCategoryCount, setWorkscopeCategoryCount] = useState(0);

  // Task counts
  const [taskCount, setTaskCount] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);
  const [wipTasks, setWipTasks] = useState(0);
  const [onHoldTasks, setOnHoldTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [rescheduledTasks, setRescheduledTasks] = useState(0);
  const [scheduledTasks, setScheduledTasks] = useState(0);
  const [reopenTasks, setReopenTasks] = useState(0);

  const [loading, setLoading] = useState(true);

  // Helper function to get latest status for each task
  const getTaskStatuses = (tasks: Task[], remarks: TaskRemark[]) => {
    const statusMap: Record<number, string> = {};
    
    // First, initialize with default status from /task API
    tasks.forEach(task => {
      statusMap[task.id] = task.status || "Open";
    });
    
    // Then update with latest status from tasks-remarks
    // Group remarks by taskId and find the latest (most recent) remark for each task
    const remarksByTaskId: Record<number, TaskRemark> = {};
    
    remarks.forEach(remark => {
      if (!remarksByTaskId[remark.taskId] || 
          new Date(remark.createdAt) > new Date(remarksByTaskId[remark.taskId].createdAt)) {
        remarksByTaskId[remark.taskId] = remark;
      }
    });
    
    // Update status map with latest remark status
    Object.keys(remarksByTaskId).forEach(taskId => {
      const latestRemark = remarksByTaskId[parseInt(taskId, 10)];
      if (latestRemark && latestRemark.status) {
        statusMap[parseInt(taskId, 10)] = latestRemark.status;
      }
    });
    
    return statusMap;
  };

  // Fetch Counts
  const fetchCounts = async () => {
    try {
      const [
        sitesRes, 
        custRes, 
        serviceContractRes, 
        contractworkRes,
        departmentRes, 
        productTypeRes, 
        workscopeRes, 
        taskRes,
        tasksRemarksRes
      ] = await Promise.all([
        fetch("https://ristarerp.openwan.in/backend/sites"),
        fetch("https://ristarerp.openwan.in/backend/address-book"),
        fetch("https://ristarerp.openwan.in/backend/service-contract"),
        fetch("https://ristarerp.openwan.in/backend/contractworkcategory"),
        fetch("https://ristarerp.openwan.in/backend/department"),
        fetch("https://ristarerp.openwan.in/backend/producttype"),
        fetch("https://ristarerp.openwan.in/backend/workscope-category"),
        fetch("https://ristarerp.openwan.in/backend/task"),
        fetch("https://ristarerp.openwan.in/backend/tasks-remarks"),
      ]);

      const sitesData = await sitesRes.json();
      const custData = await custRes.json();
      const serviceContractData = await serviceContractRes.json();
      const contractworkData = await contractworkRes.json();
      const departmentData = await departmentRes.json();
      const productTypeData = await productTypeRes.json();
      const workscopeData = await workscopeRes.json();
      const taskData = await taskRes.json();
      const tasksRemarksData = await tasksRemarksRes.json();

      setSiteCount(Array.isArray(sitesData) ? sitesData.length : 0);
      setCustomerCount(Array.isArray(custData) ? custData.length : 0);
      setServiceContractCount(Array.isArray(serviceContractData) ? serviceContractData.length : 0);
      setContractworkCount(Array.isArray(contractworkData) ? contractworkData.length : 0);
      setDepartmentCount(Array.isArray(departmentData) ? departmentData.length : 0);
      setProductTypeCount(Array.isArray(productTypeData) ? productTypeData.length : 0);
      setWorkscopeCategoryCount(Array.isArray(workscopeData) ? workscopeData.length : 0);

      // Process task statuses
      const tasks: Task[] = Array.isArray(taskData) ? taskData : [];
      const remarks: TaskRemark[] = Array.isArray(tasksRemarksData) ? tasksRemarksData : [];
      
      setTaskCount(tasks.length);

      // Get the latest status for each task
      const taskStatuses = getTaskStatuses(tasks, remarks);
      
      // Count statuses
      const statusCounts: Record<string, number> = {
        "Open": 0,
        "Work in Progress": 0,
        "On-Hold": 0,
        "Rescheduled": 0,
        "Scheduled": 0,
        "Completed": 0,
        "Reopen": 0,
      };
      
      Object.values(taskStatuses).forEach(status => {
        const statusKey = (status as string).trim();
        if (statusCounts[statusKey] !== undefined) {
          statusCounts[statusKey]++;
        } else {
          // For any unexpected status, count it as "Open"
          statusCounts["Open"]++;
        }
      });

      setOpenTasks(statusCounts["Open"]);
     setScheduledTasks(statusCounts["Scheduled"]);
      setWipTasks(statusCounts["Work in Progress"]);
      setOnHoldTasks(statusCounts["On-Hold"]);
      setRescheduledTasks(statusCounts["Rescheduled"]);
      setCompletedTasks(statusCounts["Completed"]);
      setReopenTasks(statusCounts["Reopen"]);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // Reusable Card
  const StatCard = ({ title, value, color }: any) => (
    <div className="bg-white shadow-md rounded-xl p-6 border-l-4"
      style={{ borderColor: color }}>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold mt-2" style={{ color }}>
        {loading ? "..." : value}
      </p>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen -mt-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Dashboard</h1>
      </div>

      {/* Main Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <StatCard title="Total Sites" value={siteCount} color="#2563EB" />
          <StatCard title="Total Customers" value={customerCount} color="#059669" />
          <StatCard title="Service Contract" value={serviceContractCount} color="#7C3AED" />
          <StatCard title="Service Categories" value={contractworkCount} color="#D97706" />
          <StatCard title="Total Departments" value={departmentCount} color="#DC2626" />
          <StatCard title="Product Categories" value={productTypeCount} color="#0891B2" />
          <StatCard title="Workscope Categories" value={workscopeCategoryCount} color="#EA580C" />
        </div>
      </div>

      {/* Task Status Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Task Status Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <StatCard title="Total Tasks" value={taskCount} color="#374151" />
          <StatCard title="Open" value={openTasks} color="#3B82F6" />
        <StatCard title="Scheduled" value={scheduledTasks} color="#10B981" />
          <StatCard title="Work in Progress" value={wipTasks} color="#F59E0B" />
          <StatCard title="On-Hold" value={onHoldTasks} color="#EF4444" />
          <StatCard title="Rescheduled" value={rescheduledTasks} color="#8B5CF6" />
          <StatCard title="Completed" value={completedTasks} color="#22C55E" />
          <StatCard title="Reopen" value={reopenTasks} color="#6366F1" />
        </div>
      </div>

      {/* Optional: Add more sections later */}
    </div>
  );
}