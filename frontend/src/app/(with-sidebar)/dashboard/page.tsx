"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Filter, TrendingUp, Clock, ChevronDown, Users, Store, Box, Layers, Package, ShoppingCart, DollarSign, Receipt, CreditCard, Truck } from "lucide-react";
import { 
  FaUsers, FaStore, FaBoxes, FaSitemap, FaProductHunt, FaSwatchbook,
  FaInvision, FaAmazonPay, FaMoneyBill, FaOutdent 
} from "react-icons/fa";

interface Task {
  id: number;
  status: string;
  createdAt: string;
}

interface TaskRemark {
  taskId: number;
  status: string;
  createdAt: string;
}

type DateRange = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

interface DateFilter {
  range: DateRange;
  customStart?: string;
  customEnd?: string;
}

export default function Dashboard() {
  // Dashboard statistics - Original
  const [siteCount, setSiteCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [serviceContractCount, setServiceContractCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [productTypeCount, setProductTypeCount] = useState(0);
  const [contractworkCount, setContractworkCount] = useState(0);
  const [workscopeCategoryCount, setWorkscopeCategoryCount] = useState(0);
  
  // New Inventory & Ticket statistics
  const [counts, setCounts] = useState({
    vendors: 0,
    customers: 0,
    sites: 0,
    products: 0,
    purchaseRate: 0,
    soldPurchaseRate: 0,
    restPurchaseRate: 0,
    purchaseInvoice: 0,
    dueAmount: 0,
    demoOut: 0,
  });

  // Task statistics
  const [totalTasks, setTotalTasks] = useState(0);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allRemarks, setAllRemarks] = useState<TaskRemark[]>([]);
  
  // Task status counts
  const [openTasks, setOpenTasks] = useState(0);
  const [wipTasks, setWipTasks] = useState(0);
  const [onHoldTasks, setOnHoldTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [rescheduledTasks, setRescheduledTasks] = useState(0);
  const [scheduledTasks, setScheduledTasks] = useState(0);
  const [reopenTasks, setReopenTasks] = useState(0);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ range: 'all' });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [taskTrend, setTaskTrend] = useState<number>(0);
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  const router = useRouter();

  // Helper to get date range boundaries
  const getDateRange = (range: DateRange, customStart?: string, customEnd?: string) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    end.setHours(23, 59, 59, 999);
    
    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (customStart && customEnd) {
          const customStartDate = new Date(customStart);
          const customEndDate = new Date(customEnd);
          customStartDate.setHours(0, 0, 0, 0);
          customEndDate.setHours(23, 59, 59, 999);
          return {
            start: customStartDate,
            end: customEndDate
          };
        }
        return {
          start: new Date(0),
          end: new Date(8640000000000000)
        };
      default:
        return {
          start: new Date(0),
          end: new Date(8640000000000000)
        };
    }
    
    return { start, end };
  };

  // Filter tasks by date range
  const filterTasksByDate = (tasks: Task[], filter: DateFilter) => {
    const { start, end } = getDateRange(filter.range, filter.customStart, filter.customEnd);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      taskDate.setHours(12, 0, 0, 0);
      return taskDate >= start && taskDate <= end;
    });
  };

  // Helper function to get latest status for each task
  const getTaskStatuses = (tasks: Task[], remarks: TaskRemark[]) => {
    const statusMap: Record<number, string> = {};
    
    tasks.forEach(task => {
      statusMap[task.id] = task.status || "Open";
    });
    
    const remarksByTaskId: Record<number, TaskRemark> = {};
    
    remarks.forEach(remark => {
      if (!remarksByTaskId[remark.taskId] || 
          new Date(remark.createdAt) > new Date(remarksByTaskId[remark.taskId].createdAt)) {
        remarksByTaskId[remark.taskId] = remark;
      }
    });
    
    Object.keys(remarksByTaskId).forEach(taskId => {
      const latestRemark = remarksByTaskId[parseInt(taskId, 10)];
      if (latestRemark && latestRemark.status) {
        statusMap[parseInt(taskId, 10)] = latestRemark.status;
      }
    });
    
    return statusMap;
  };

  // Calculate task trend
  const calculateTaskTrend = (currentCount: number, previousCount: number) => {
    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    return ((currentCount - previousCount) / previousCount) * 100;
  };

  // Enhanced safe fetch helper function
  const safeFetch = async (url: string): Promise<any> => {
    try {
      console.log(`Fetching: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        // Don't throw error for 404, just return 0
        console.warn(`HTTP ${response.status} for ${url}`);
        return 0;
      }
      
      const contentType = response.headers.get('content-type');
      
      // Handle different response types
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // Check if response is a simple number
        if (typeof data === 'number') {
          return data;
        }
        
        // Check if response is an object with count/data property
        if (data && typeof data === 'object') {
          // Check common property names
          if ('count' in data && typeof data.count === 'number') {
            return data.count;
          }
          if ('total' in data && typeof data.total === 'number') {
            return data.total;
          }
          if ('value' in data && typeof data.value === 'number') {
            return data.value;
          }
          if ('amount' in data && typeof data.amount === 'number') {
            return data.amount;
          }
          if ('data' in data && Array.isArray(data.data)) {
            return data.data.length;
          }
          if (Array.isArray(data)) {
            return data.length;
          }
        }
        
        // If we can't extract a number, return 0
        return 0;
      } else {
        // Handle plain text/number responses
        const text = await response.text();
        const num = parseFloat(text);
        return isNaN(num) ? 0 : num;
      }
      
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      return 0;
    }
  };

  // Fetch all data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setApiErrors([]);
      
      // Fetch original data
      const originalEndpoints = [
        "http://localhost:8000/sites",
        "http://localhost:8000/address-book",
        "http://localhost:8000/service-contract",
        "http://localhost:8000/contractworkcategory",
        "http://localhost:8000/department",
        "http://localhost:8000/producttype",
        "http://localhost:8000/workscope-category",
        "http://localhost:8000/task",
        "http://localhost:8000/tasks-remarks",
      ];

      const originalResults = await Promise.allSettled(
        originalEndpoints.map(url => safeFetch(url))
      );

      // Process original data results
      const [
        sitesData,
        custData,
        serviceContractData,
        contractworkData,
        departmentData,
        productTypeData,
        workscopeData,
        taskData,
        tasksRemarksData
      ] = originalResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to fetch ${originalEndpoints[index]}:`, result.reason);
          return 0;
        }
      });

      // Set basic counts - ensure they're numbers
      setSiteCount(Number(sitesData) || 0);
      setCustomerCount(Number(custData) || 0);
      setServiceContractCount(Number(serviceContractData) || 0);
      setContractworkCount(Number(contractworkData) || 0);
      setDepartmentCount(Number(departmentData) || 0);
      setProductTypeCount(Number(productTypeData) || 0);
      setWorkscopeCategoryCount(Number(workscopeData) || 0);

      // For task data, we need to handle arrays differently
      // Let's fetch task data separately to get arrays
      try {
        const taskResponse = await fetch("http://localhost:8000/task");
        if (taskResponse.ok) {
          const tasksArray = await taskResponse.json();
          setAllTasks(Array.isArray(tasksArray) ? tasksArray : []);
          setTotalTasks(Array.isArray(tasksArray) ? tasksArray.length : 0);
        } else {
          setAllTasks([]);
          setTotalTasks(0);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setAllTasks([]);
        setTotalTasks(0);
      }

      try {
        const remarksResponse = await fetch("http://localhost:8000/tasks-remarks");
        if (remarksResponse.ok) {
          const remarksArray = await remarksResponse.json();
          setAllRemarks(Array.isArray(remarksArray) ? remarksArray : []);
        } else {
          setAllRemarks([]);
        }
      } catch (error) {
        console.error("Failed to fetch task remarks:", error);
        setAllRemarks([]);
      }

      // Apply initial filter
      updateTaskFilter(dateFilter);

      // Fetch new inventory data
      await fetchInventoryData();

    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setApiErrors(prev => [...prev, "Failed to load dashboard data"]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inventory data with error handling
  const fetchInventoryData = async () => {
    try {
      // Define all inventory endpoints with their expected response types
      const inventoryEndpoints = [
        { url: 'http://localhost:8000/vendors/count', key: 'vendors' },
        { url: 'http://localhost:8000/customers/count', key: 'customers' },
        { url: 'http://localhost:8000/sites/count', key: 'sites' },
        { url: 'http://localhost:8000/products/count', key: 'products' },
        { url: 'http://localhost:8000/inventory/purchaseRate/count', key: 'purchaseRate' },
        { url: 'http://localhost:8000/inventory/sold/purchaseRate', key: 'soldPurchaseRate' },
        { url: 'http://localhost:8000/inventory/rest/sold', key: 'restPurchaseRate' },
        { url: 'http://localhost:8000/inventory/count/purchaseInvoice', key: 'purchaseInvoice' },
        { url: 'http://localhost:8000/inventory/count/dueAmount', key: 'dueAmount' },
        { url: 'http://localhost:8000/inventory/count/demo', key: 'demoOut' },
      ];

      const results = await Promise.allSettled(
        inventoryEndpoints.map(endpoint => safeFetch(endpoint.url))
      );

      const newCounts = { ...counts };
      const errors: string[] = [];

      results.forEach((result, index) => {
        const endpoint = inventoryEndpoints[index];
        
        if (result.status === 'fulfilled') {
          const value = result.value;
          const numValue = Number(value);
          
          if (!isNaN(numValue)) {
            newCounts[endpoint.key as keyof typeof newCounts] = numValue;
          } else {
            console.warn(`Invalid number for ${endpoint.url}:`, value);
            newCounts[endpoint.key as keyof typeof newCounts] = 0;
          }
        } else {
          console.error(`Failed to fetch ${endpoint.url}:`, result.reason);
          newCounts[endpoint.key as keyof typeof newCounts] = 0;
          errors.push(`Failed to load ${endpoint.key.replace(/([A-Z])/g, ' ₹1')}`);
        }
      });

      if (errors.length > 0) {
        setApiErrors(prev => [...prev, ...errors.slice(0, 3)]);
      }

      setCounts(newCounts);
      
      // Log the fetched counts for debugging
      console.log("Fetched inventory counts:", newCounts);
    } catch (error) {
      console.error('Failed to fetch inventory counts', error);
      setApiErrors(prev => [...prev, "Failed to load inventory data"]);
    }
  };

  // Update task filter
  const updateTaskFilter = (filter: DateFilter) => {
    const filtered = filterTasksByDate(allTasks, filter);
    setFilteredTasks(filtered);
    setDateFilter(filter);
    
    const taskStatuses = getTaskStatuses(filtered, allRemarks);
    
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
    
    // Calculate trend
    if (filter.range !== 'all') {
      const previousStart = new Date();
      const previousEnd = new Date();
      
      switch (filter.range) {
        case 'today':
          previousStart.setDate(previousStart.getDate() - 1);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setDate(previousEnd.getDate() - 1);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'week':
          previousStart.setDate(previousStart.getDate() - 7);
          const prevDay = previousStart.getDay();
          const prevDiff = previousStart.getDate() - prevDay + (prevDay === 0 ? -6 : 1);
          previousStart.setDate(prevDiff);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setDate(previousEnd.getDate() - 7);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'month':
          previousStart.setMonth(previousStart.getMonth() - 1, 1);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setMonth(previousEnd.getMonth() - 1);
          previousEnd.setDate(0);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case 'year':
          previousStart.setFullYear(previousStart.getFullYear() - 1, 0, 1);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd.setFullYear(previousEnd.getFullYear() - 1, 11, 31);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        default:
          previousStart.setDate(previousStart.getDate() - 1);
          previousEnd.setDate(previousEnd.getDate() - 1);
      }
      
      const previousPeriodTasks = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= previousStart && taskDate <= previousEnd;
      });
      
      const trend = calculateTaskTrend(filtered.length, previousPeriodTasks.length);
      setTaskTrend(parseFloat(trend.toFixed(1)));
    } else {
      setTaskTrend(0);
    }
  };

  // Apply custom date filter
  const applyCustomDateFilter = () => {
    if (!customStartDate || !customEndDate) {
      alert("Please select both start and end dates");
      return;
    }
    
    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert("Start date must be before end date");
      return;
    }
    
    setDateFilter({
      range: 'custom',
      customStart: customStartDate,
      customEnd: customEndDate
    });
    
    updateTaskFilter({
      range: 'custom',
      customStart: customStartDate,
      customEnd: customEndDate
    });
    
    setShowCustomDatePicker(false);
  };

  // Format date for display
  const formatDateRange = (filter: DateFilter) => {
    switch (filter.range) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      case 'custom':
        return `${customStartDate} to ${customEndDate}`;
      default:
        return 'All Time';
    }
  };

  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // StatCard Component with enhanced styling
  const StatCard = ({ 
    title, 
    value, 
    color, 
    onClick, 
    icon: Icon,
    subtitle,
    trend,
    customIcon,
    isCurrency = false
  }: any) => {
    const displayValue = loading 
      ? "..." 
      : isCurrency && typeof value === 'string' && value.startsWith('₹')
        ? value
        : isCurrency
        ? formatCurrency(Number(value) || 0)
        : typeof value === 'number'
        ? value.toLocaleString()
        : value || 0;

    return (
      <div
        className={`bg-white shadow-md rounded-xl p-6 border-l-4 hover:shadow-lg transition-all duration-200 ${
          onClick ? "cursor-pointer hover:scale-[1.02]" : ""
        } relative overflow-hidden group`}
        style={{ borderColor: color }}
        onClick={onClick}
        role={onClick ? "button" : undefined}
      >
        <div 
          className="absolute top-0 left-0 w-1 h-full opacity-10 group-hover:opacity-20 transition-opacity"
          style={{ backgroundColor: color }}
        />
        
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {customIcon ? (
                <div className="text-lg" style={{ color }}>{customIcon}</div>
              ) : Icon ? (
                <Icon size={18} className="opacity-70" style={{ color }} />
              ) : null}
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                {title}
              </h3>
            </div>
            
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-800">
                {displayValue}
              </p>
              
              {trend !== undefined && trend !== 0 && (
                <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
                </span>
              )}
            </div>
            
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          
          {onClick && (
            <div className="text-gray-300 group-hover:text-gray-400 transition-colors">
              <ChevronDown size={20} className="rotate-270" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Inventory Cards Array - with proper numeric values
  const inventoryCards = [
    { 
      title: "Vendors", 
      value: counts.vendors, 
      color: "#4F46E5",
      icon: Users,
      subtitle: "Total suppliers",
      customIcon: <FaUsers />
    },

    { 
      title: "Products", 
      value: counts.products, 
      color: "#D97706",
      icon: Box,
      subtitle: "Total products",
      customIcon: <FaBoxes />
    },
    { 
      title: "Purchase Value", 
      value: counts.purchaseRate,
      color: "#F59E0B",
      icon: ShoppingCart,
      subtitle: "Inventory purchase value",
      customIcon: <FaProductHunt />,
    },
    { 
      title: "Sold Value", 
      value: counts.soldPurchaseRate,
      color: "#DC2626",
      icon: DollarSign,
      subtitle: "Inventory sold value",
      customIcon: <FaAmazonPay />,
    },
    { 
      title: "Stock Value", 
      value: counts.restPurchaseRate,
      color: "#7C3AED",
      icon: Package,
      subtitle: "Current stock value",
      customIcon: <FaSwatchbook />,
    },
    { 
      title: "Purchase Invoices", 
      value: counts.purchaseInvoice,
      color: "#6B7280",
      icon: Receipt,
      subtitle: "Total invoices",
      customIcon: <FaInvision />
    },
    { 
      title: "Due Amount", 
      value: counts.dueAmount,
      color: "#0D9488",
      icon: CreditCard,
      subtitle: "Pending payments",
      customIcon: <FaMoneyBill />,
    },
    { 
      title: "Demo Inventory", 
      value: counts.demoOut,
      color: "#DB2777",
      icon: Truck,
      subtitle: "Items on demo",
      customIcon: <FaOutdent />
    },
  ];

  // Status Indicator Component
  const StatusIndicator = ({ status, count, color }: any) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-gray-700">{status}</span>
      </div>
      <span className="text-xl font-bold text-gray-900">{count}</span>
    </div>
  );

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600">
              Real-time insights and analytics for your service management
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Data updated just now
            </div>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Clock size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {apiErrors.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Note:</span>
            <span>Some data may not be available</span>
          </div>
          <div className="mt-2 text-sm text-yellow-600">
            <button 
              onClick={() => setApiErrors([])}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Statistics Grid */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Key Metrics</h2>
          <div className="text-sm text-gray-500">
            Total records across all modules
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Customers" 
            value={customerCount} 
            color="#059669"
            onClick={() => router.push("/addressbook")}
            icon={Calendar}
            subtitle="Total registered customers"
          />
          <StatCard 
            title="Sites" 
            value={siteCount} 
            color="#2563EB"
            onClick={() => router.push("/sites")}
            icon={Calendar}
            subtitle="Customer locations"
          />
          <StatCard 
            title="Service Contracts" 
            value={serviceContractCount} 
            color="#7C3AED"
            onClick={() => router.push("/service-contract")}
            icon={Calendar}
            subtitle="Active agreements"
          />
          <StatCard 
            title="Total Tasks" 
            value={totalTasks} 
            color="#374151"
            onClick={() => router.push("/tasks")}
            icon={TrendingUp}
            subtitle="All time tasks"
            trend={taskTrend}
          />
        </div>
      </div>

      {/* Inventory & Business Metrics */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Business & Inventory Metrics
            </h2>
            <p className="text-gray-600">
              Financial and inventory overview
            </p>
          </div>
          <button
            onClick={fetchInventoryData}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Clock size={14} />
            Refresh Inventory
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading inventory data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {inventoryCards.map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={card.value}
                color={card.color}
                subtitle={card.subtitle}
                customIcon={card.customIcon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Analysis Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        {/* Task Header with Filter Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 pb-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Task Analysis
            </h2>
            <div className="flex items-center gap-2 text-gray-600">
              <Filter size={16} />
              <span className="font-medium">Period:</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {formatDateRange(dateFilter)}
              </span>
              <span className="text-sm">
                ({filteredTasks.length} of {totalTasks} tasks)
              </span>
            </div>
          </div>
          
          {/* Date Filter Controls */}
          <div className="flex flex-wrap gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['today', 'week', 'month', 'year', 'all'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => updateTaskFilter({ range })}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                    dateFilter.range === range
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {range === 'all' ? 'All Time' : 
                   range === 'week' ? 'This Week' :
                   range === 'month' ? 'This Month' :
                   range === 'year' ? 'This Year' : range}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                dateFilter.range === 'custom'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar size={16} />
              Custom Range
            </button>
          </div>
        </div>

        {/* Custom Date Picker */}
        {showCustomDatePicker && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                  min={customStartDate}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={applyCustomDateFilter}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowCustomDatePicker(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusIndicator 
            status="Open" 
            count={openTasks} 
            color="#3B82F6"
          />
          <StatusIndicator 
            status="Scheduled" 
            count={scheduledTasks} 
            color="#10B981"
          />
          <StatusIndicator 
            status="In Progress" 
            count={wipTasks} 
            color="#F59E0B"
          />
          <StatusIndicator 
            status="On Hold" 
            count={onHoldTasks} 
            color="#EF4444"
          />
          <StatusIndicator 
            status="Rescheduled" 
            count={rescheduledTasks} 
            color="#8B5CF6"
          />
          <StatusIndicator 
            status="Completed" 
            count={completedTasks} 
            color="#22C55E"
          />
          <StatusIndicator 
            status="Reopened" 
            count={reopenTasks} 
            color="#6366F1"
          />
          
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Task Summary</h3>
              <div className="text-sm opacity-90">
                {dateFilter.range === 'custom' ? 'Custom Range' : 'Current Period'}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Total Tasks</span>
                <span className="text-2xl font-bold">{filteredTasks.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Completion Rate</span>
                <span className="text-xl font-bold">
                  {filteredTasks.length > 0 
                    ? `${((completedTasks / filteredTasks.length) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Avg. Daily Tasks</span>
                <span className="text-xl font-bold">
                  {(() => {
                    if (dateFilter.range === 'custom' && customStartDate && customEndDate) {
                      const days = Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return days > 0 ? (filteredTasks.length / days).toFixed(1) : '0';
                    }
                    return '-';
                  })()}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => router.push("/tasks")}
              className="mt-6 w-full py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              View All Tasks →
            </button>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Distribution</h3>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            {[
              { status: 'Completed', count: completedTasks, color: '#22C55E' },
              { status: 'In Progress', count: wipTasks, color: '#F59E0B' },
              { status: 'Scheduled', count: scheduledTasks, color: '#10B981' },
              { status: 'Open', count: openTasks, color: '#3B82F6' },
              { status: 'On Hold', count: onHoldTasks, color: '#EF4444' },
            ]
              .filter(item => item.count > 0)
              .map((item, index, array) => {
                const percentage = (item.count / filteredTasks.length) * 100;
                return (
                  <div
                    key={item.status}
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                      height: '100%',
                      display: 'inline-block'
                    }}
                    title={`${item.status}: ${item.count} (${percentage.toFixed(1)}%)`}
                    className="hover:opacity-90 transition-opacity cursor-help"
                  />
                );
              })}
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4">
            {[
              { status: 'Completed', count: completedTasks, color: '#22C55E' },
              { status: 'In Progress', count: wipTasks, color: '#F59E0B' },
              { status: 'Scheduled', count: scheduledTasks, color: '#10B981' },
              { status: 'Open', count: openTasks, color: '#3B82F6' },
              { status: 'On Hold', count: onHoldTasks, color: '#EF4444' },
              { status: 'Rescheduled', count: rescheduledTasks, color: '#8B5CF6' },
              { status: 'Reopened', count: reopenTasks, color: '#6366F1' },
            ]
              .filter(item => item.count > 0)
              .map(item => (
                <div key={item.status} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {item.status}: <span className="font-semibold">{item.count}</span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Resources</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard 
                title="Service Categories" 
                value={contractworkCount} 
                color="#D97706"
                onClick={() => router.push("/contract-work")}
              />
              <StatCard 
                title="Departments" 
                value={departmentCount} 
                color="#DC2626"
                onClick={() => router.push("/departments")}
              />
              
              <StatCard 
                title="Workscope Categories" 
                value={workscopeCategoryCount} 
                color="#EA580C"
                onClick={() => router.push("/workscope")}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => router.push("/tasks?new=true")}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-left flex items-center justify-between transition-colors"
            >
              <span>Create New Task</span>
              <span className="text-xl">+</span>
            </button>
            <button 
              onClick={() => router.push("/service-contract?new=true")}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-left flex items-center justify-between transition-colors"
            >
              <span>Add Service Contract</span>
              <span className="text-xl">+</span>
            </button>
            <button 
              onClick={() => router.push("/addressbook?new=true")}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-left flex items-center justify-between transition-colors"
            >
              <span>Add New Customer</span>
              <span className="text-xl">+</span>
            </button>
            <button 
              onClick={fetchDashboardData}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 rounded-lg text-left flex items-center justify-between transition-colors mt-4"
            >
              <span>Refresh Dashboard</span>
              <Clock size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      )}
    </div>
  );
}