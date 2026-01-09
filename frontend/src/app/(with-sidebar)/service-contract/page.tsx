'use client';

import { useEffect, useState } from 'react';

// Simple API helper
async function apiFetch(url: string, method = 'GET', body?: any) {
  try {
    const res = await fetch(`https://enplerp.electrohelps.in/backend${url}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();

    // 🟢 Ignore 404 so modal still opens
    if (res.status === 404) {
      console.warn(`⚠️ [${method}] ${url} returned 404 — returning empty array.`);
      return []; // ✅ ensures .map() works safely
    }

    if (!res.ok) {
      console.error(`❌ [${method}] ${url} failed (${res.status})`);
      console.error('Response Text:', text);
      throw new Error(`API Error ${res.status}: ${text}`);
    }

    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.error('🚨 Fetch Error:', err);
    throw err;
  }
}

interface ServiceContract {
  id?: number;
  serviceContractID: string;
  customerId: number;
  branchId: number;
  salesManagerName: string;
  amcType: string;
  startDate: string;
  endDate: string;
  nextPMVisitDate: string;
  maxOnSiteVisits: string;
  maxPreventiveMaintenanceVisit: string;
  inclusiveInOnSiteVisitCounts: boolean;
  serviceContractTypeId?: number;
  preventiveMaintenanceCycle: string;
  contractDescription: string;
  contractType?: string;       // "Free" or "Paid"
  billingType?: string;        // "Prepaid" or "Postpaid"
  billingCycle?: string;       // number of days, e.g. 90
  paymentStatus?: string;      // "Paid" or "Unpaid"
  billingSchedule?: any[];     // array of generated billing periods
  customerName?: string;
  branchName?: string;
  periods?: any[];
  terms?: any[];
  services?: any[];
  inventories?: any[];
  histories?: any[];
}
type CrudPerm = {
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};




interface UserPermissions {
  id: number;
  userId: number;
  permissions: {
    permissions: {
      SERVICE_CONTRACTS: {
        edit: boolean;
        read: boolean;
        create: boolean;
        delete: boolean;
      };
      // Add other modules if needed
    };
  };
}

interface ContractService {
  id?: number;
  serviceName: string;
  description: string;
  serviceCategoryName?: string;
  contractWorkCategoryId?: number;
}

interface ServiceContractInventory {
  id?: number;
  productType: string;
  makeModel: string;
  snMac: string;
  description: string;
  purchaseDate: string;
  warrantyPeriod: string;
  warrantyStatus: string;
  thirdPartyPurchase: boolean;
  productTypeName?: string;
  productTypeId?: number;
}

interface ServiceContractHistory {
  id?: number;
  serviceContractId: number;
  taskId: string;
  serviceType: string;
  serviceDate: string;
  startTime: string;
  endTime: string;
  serviceDetails: string;
  _delete?: boolean; // for marking deletions
  _hidden?: boolean; // for hiding deleted items from UI
  serviceContract?: {
    id: number;
    serviceContractID: string;
    customerId: number;
    branchId: number;
    salesManagerName: string;
    amcType: string;
    // Add other fields you need from service contract
  };
}

// Icons
const Icons = {
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Building: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Tool: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Package: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Delete: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  History: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Close: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  ChevronDown: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>),
  ChevronUp: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>),
};

export default function ServiceContractPage() {
  const [serviceContracts, setServiceContracts] = useState<ServiceContract[]>([]);
  const [contractServices, setContractServices] = useState<ContractService[]>([]);
  const [inventories, setInventories] = useState<ServiceContractInventory[]>([]);
  const [serviceHistories, setServiceHistories] = useState<ServiceContractHistory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  // For search and suggestion visibility
  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [showProductTypeSuggestions, setShowProductTypeSuggestions] = useState(false);
  const [filteredProductTypes, setFilteredProductTypes] = useState<any[]>([]);
  const [serviceCategorySearch, setServiceCategorySearch] = useState('');
  const [productTypeSearch, setProductTypeSearch] = useState('');
  // 🔍 Search + Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 👈 adjust how many contracts per page
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);

  const [billingSchedule, setBillingSchedule] = useState<
    { dueDate: string; paymentStatus: string; overdueDays: number }[]
  >([]);
  const [showBillingSchedule, setShowBillingSchedule] = useState(true);

  type PermissionsJson = Record<string, CrudPerm>;

const [permissions, setPermissions] = useState<PermissionsJson | null>(null);
const [userId, setUserId] = useState<number | null>(null);

useEffect(() => {
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) {
    setUserId(Number(storedUserId));
  }
}, []);


  const [showManagerSuggestions, setShowManagerSuggestions] = useState(false);
  const [showServiceCatSuggestions, setShowServiceCatSuggestions] = useState(false);
  const [filteredServiceCats, setFilteredServiceCats] = useState<any[]>([]);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [serviceHistoryList, setServiceHistoryList] = useState<ServiceContractHistory[]>([]);
  const [historyFormModal, setHistoryFormModal] = useState<ServiceContractHistory>({
    serviceContractId: 0,
    taskId: '',
    serviceType: 'On-Site Visit',
    serviceDate: '',
    startTime: '',
    endTime: '',
    serviceDetails: '',
  });

  

  const handleAddHistory = () => {
    if (historyFormModal.taskId && historyFormModal.serviceDate) {
      setServiceHistoryList((prev) => [...prev, historyFormModal]);
      setHistoryFormModal({
        serviceContractId: 0,
        taskId: '',
        serviceType: 'On-Site Visit',
        serviceDate: '',
        startTime: '',
        endTime: '',
        serviceDetails: '',
      });
      setShowHistoryModal(false);
    } else {
      alert('Please fill required fields');
    }
  };

  const removeHistory = (index: number) => {
    setServiceHistoryList(prev => {
      const item = prev[index];

      // If it exists in DB, mark it for delete but hide from UI
      if (item.id) {
        return prev.map((h, i) =>
          i === index ? { ...h, _delete: true, _hidden: true } : h
        );
      }

      // If it's a new (unsaved) row → remove completely
      return prev.filter((_, i) => i !== index);
    });
  };

  // 🔍 Filter + paginate contracts
  const filteredContracts = serviceContracts.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.serviceContractID?.toLowerCase().includes(term) ||
      item.customerName?.toLowerCase().includes(term) ||
      item.branchName?.toLowerCase().includes(term) ||
      item.salesManagerName?.toLowerCase().includes(term) ||
      item.amcType?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  const [formData, setFormData] = useState<ServiceContract>({
    serviceContractID: '',
    customerId: 0,
    branchId: 0,
    salesManagerName: '',
    amcType: '',
    startDate: '',
    endDate: '',
    nextPMVisitDate: '',
    maxOnSiteVisits: '',
    maxPreventiveMaintenanceVisit: '',
    inclusiveInOnSiteVisitCounts: false,
    preventiveMaintenanceCycle: '',
    contractDescription: '',
    contractType: 'Free',       // "Free" or "Paid"
    billingType: '',            // "Prepaid" or "Postpaid"
    billingCycle: '',           // number of days, e.g. 90
    paymentStatus: 'Paid',      // "Paid" or "Unpaid"
    billingSchedule: []         // array of generated billing periods
  });

  const [serviceForm, setServiceForm] = useState<ContractService>({
    serviceName: '',
    description: '',
  });

  const [inventoryForm, setInventoryForm] = useState<ServiceContractInventory>({
    productType: '',
    makeModel: '',
    snMac: '',
    description: '',
    purchaseDate: '',
    warrantyPeriod: '',
    warrantyStatus: '',
    thirdPartyPurchase: false,
  });

  const [historyForm, setHistoryForm] = useState<ServiceContractHistory>({
    serviceContractId: 0,
    taskId: '',
    serviceType: 'On-Site Visit',
    serviceDate: '',
    startTime: '',
    endTime: '',
    serviceDetails: '',
  });

  function generateBillingSchedule(start: string, end: string, cycleDays: number) {
    const schedule: { dueDate: string; paymentStatus: string; overdueDays: number }[] = [];
    if (!start || !end || !cycleDays) return schedule;

    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      const dueDate = new Date(current);
      const today = new Date();
      const isOverdue = today > dueDate;
      const overdueDays = isOverdue
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      schedule.push({
        dueDate: dueDate.toISOString().split('T')[0],
        paymentStatus: 'Unpaid',
        overdueDays,
      });

      current.setDate(current.getDate() + cycleDays);
    }
    return schedule;
  }

useEffect(() => {
  if (userId) {
    fetchUserPermissions(userId);
  }
}, [userId]);

const fetchUserPermissions = async (userId: number) => {
  try {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token');

    const res = await fetch(
      `https://enplerp.electrohelps.in/backend/user-permissions/${userId}`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      }
    );

    if (!res.ok) throw new Error('Permission fetch failed');

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
    localStorage.setItem('userPermissions', JSON.stringify(perms));
  } catch (err) {
    console.error(err);
    const stored = localStorage.getItem('userPermissions');
    if (stored) {
      setPermissions(JSON.parse(stored));
    } else {
      setPermissions({});
    }
  }
};


  useEffect(() => {
    if (
      formData.contractType === 'Paid' &&
      formData.startDate &&
      formData.endDate &&
      formData.billingCycle
    ) {
      const schedule = generateBillingSchedule(
        formData.startDate,
        formData.endDate,
        parseInt(formData.billingCycle)
      );
      setBillingSchedule(schedule);
    }
  }, [formData.contractType, formData.startDate, formData.endDate, formData.billingCycle]);



  const updatePaymentStatus = (index: number, status: string) => {
    const updated = [...billingSchedule];
    updated[index].paymentStatus = status;

    const today = new Date();
    const due = new Date(updated[index].dueDate);
    updated[index].overdueDays =
      status === 'Unpaid' && today > due
        ? Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    setBillingSchedule(updated);
  };


  useEffect(() => {
    const interval = setInterval(() => {
      setBillingSchedule((prev) =>
        prev.map((item) => {
          const today = new Date();
          const due = new Date(item.dueDate);
          const overdueDays =
            item.paymentStatus === 'Unpaid' && today > due
              ? Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
              : 0;
          return { ...item, overdueDays };
        })
      );
    }, 24 * 60 * 60 * 1000); // update daily

    return () => clearInterval(interval);
  }, []);


const serviceContractPerm = {
  read: permissions?.SERVICE_CONTRACTS?.read ?? false,
  create: permissions?.SERVICE_CONTRACTS?.create ?? false,
  edit: permissions?.SERVICE_CONTRACTS?.edit ?? false,
  delete: permissions?.SERVICE_CONTRACTS?.delete ?? false,
};

console.log('SERVICE CONTRACT permissions:', serviceContractPerm);

  // Add to the useEffect that loads data
  useEffect(() => {
    if (userId) {
      fetchUserPermissions(userId);
    }
  }, [userId]);

  // ⬇️ fetch customers (only addressType = "Customer")
  useEffect(() => {
    const fetchCustomers = async () => {
      const data = await apiFetch('/address-book');
      const filtered = data.filter((c: any) => c.addressType === 'Customer');
      setCustomers(filtered);
    };
    fetchCustomers();
  }, []);

  // 🟢 Load all contracts with names when customers are loaded
  useEffect(() => {
    if (customers.length > 0) {
      loadContracts();
      loadServiceHistories();
    }
  }, [customers]);

  // ⬇️ Fetch Product Types when component mounts
  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const res = await apiFetch('/producttype');
        setProductTypes(res);
      } catch (err) {
        console.error('Error fetching product types', err);
      }
    };
    fetchProductTypes();
  }, []);

  // ⬇️ Fetch all categories once when form mounts
  // ⬇️ Fetch all categories once when form mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch('/contractworkcategory');
        setServiceCategories(res);
      } catch (err) {
        console.error('Error loading contract work categories', err);
      }
    };
    fetchCategories();
  }, []);

  // 🟢 Load all contracts with names when customers are loaded
  useEffect(() => {
    if (customers.length > 0) {
      loadContracts();
      loadServiceHistories();
    }
  }, [customers]);

  // Load service histories
  const loadServiceHistories = async () => {
    try {
      const histories = await apiFetch('/service-contract-history');
      setServiceHistories(histories);
    } catch (err) {
      console.error('Error loading service histories', err);
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasksData = await apiFetch('/task');
        setTasks(tasksData);
      } catch (err) {
        console.error('Error fetching tasks', err);
      }
    };
    fetchTasks();
  }, []);

  // ⬇️ when Add button clicked → prefill next ID
  const handleAddNew = async () => {
    const res = await apiFetch('/service-contract/next/id');
    setFormData({
      serviceContractID: res.nextID || '',
      customerId: 0,
      branchId: 0,
      salesManagerName: '',
      amcType: '',
      startDate: '',
      endDate: '',
      nextPMVisitDate: '',
      contractType: 'Free',
      maxOnSiteVisits: '',
      maxPreventiveMaintenanceVisit: '',
      inclusiveInOnSiteVisitCounts: false,
      preventiveMaintenanceCycle: '',
      contractDescription: '',
    });

    setContractServices([]);
    setInventories([]);
    setServiceHistoryList([]); // ✅ reset Service History when adding new contract
    setHistoryForm({
      serviceContractId: 0,
      taskId: '',
      serviceType: 'On-Site Visit',
      serviceDate: '',
      startTime: '',
      endTime: '',
      serviceDetails: '',
    });
    setShowForm(true);
    setEditingId(null);
  };


  // ⬇️ handle customer select to populate sites dropdown
  const handleCustomerSelect = (customerId: number) => {
    const selected = customers.find((c) => c.id === customerId);
    setFormData({ ...formData, customerId, branchId: 0 });
    setSites(selected ? selected.sites : []);
  };

  const loadContracts = async () => {
    try {
      const contracts = await apiFetch('/service-contract');

      // Enhance contracts with customer and branch names
      const enhancedContracts = await Promise.all(
        contracts.map(async (contract: any) => {
          const customer = customers.find(c => c.id === contract.customerId);
          let branchName = 'N/A';

          if (customer && contract.branchId) {
            const branch = customer.sites?.find((s: any) => s.id === contract.branchId);
            branchName = branch?.siteName || 'N/A';
          }

          // Fetch period data for this contract - CORRECTED ENDPOINT
          let startDate = '';
          let endDate = '';
          try {
            const periodData = await apiFetch(`/service-contract-period/${contract.id}`);
            console.log(`Period data for contract ${contract.id}:`, periodData);

            if (periodData && periodData.startDate) {
              startDate = periodData.startDate || '';
              endDate = periodData.endDate || '';
            }
          } catch (err) {
            console.warn(`No period data found for contract ${contract.id}`, err);
          }

          return {
            ...contract,
            customerName: customer?.customerName || 'Unknown Customer',
            branchName: branchName,
            startDate: startDate,
            endDate: endDate
          };
        })
      );

      setServiceContracts(enhancedContracts);
    } catch (err) {
      console.error('Error loading contracts', err);
    }
  };


  // 🟢 Submit Form — save all related data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let serviceContractId = editingId;

      if (editingId) {
        // 🟡 UPDATE EXISTING CONTRACT
        await apiFetch(`/service-contract/${editingId}`, 'PATCH', {
          customerId: formData.customerId,
          branchId: formData.branchId,
          salesManagerName: formData.salesManagerName,
          amcType: formData.amcType,
        });

        // 🔹 Update or create period
        await apiFetch(`/service-contract-period`, 'POST', {
          serviceContractId: editingId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          nextPMVisitDate: formData.nextPMVisitDate,
          contractDescription: formData.contractDescription,
        });

        // 🔹 Update or create terms
        await apiFetch(`/service-contract-terms`, 'POST', {
          serviceContractId: editingId,
          maxOnSiteVisits: formData.maxOnSiteVisits,
          maxPreventiveMaintenanceVisit: formData.maxPreventiveMaintenanceVisit,
          inclusiveInOnSiteVisitCounts: formData.inclusiveInOnSiteVisitCounts,
          preventiveMaintenanceCycle: formData.preventiveMaintenanceCycle,
        });

        // ✅ Update ServiceContractType and BillingSchedule by contractId
        await apiFetch(`/service-contract-type/${formData.serviceContractTypeId}`, 'PATCH', {
          serviceContractType: formData.contractType,
          serviceContractId: editingId,
          billingType: formData.billingType,
          billingCycle: formData.billingCycle,
          billingDueDate: formData.startDate,
          paymentStatus: formData.paymentStatus,
          billingSchedule,
        });

        // 🔴 Clean existing services and inventories before re-adding
        await apiFetch(`/service-contract-services/contract/${editingId}`, 'DELETE');
        await apiFetch(`/service-contract-inventory/contract/${editingId}`, 'DELETE');
      } else {
        // 🟢 CREATE NEW CONTRACT
        const main = await apiFetch('/service-contract', 'POST', {
          customerId: formData.customerId,
          branchId: formData.branchId,
          salesManagerName: formData.salesManagerName,
          amcType: formData.amcType,
        });

        serviceContractId = main.id;

        // 🔹 Create period
        await apiFetch(`/service-contract-period`, 'POST', {
          serviceContractId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          nextPMVisitDate: formData.nextPMVisitDate,
          contractDescription: formData.contractDescription,
        });

        // 🔹 Create terms
        await apiFetch(`/service-contract-terms`, 'POST', {
          serviceContractId,
          maxOnSiteVisits: formData.maxOnSiteVisits,
          maxPreventiveMaintenanceVisit: formData.maxPreventiveMaintenanceVisit,
          inclusiveInOnSiteVisitCounts: formData.inclusiveInOnSiteVisitCounts,
          preventiveMaintenanceCycle: formData.preventiveMaintenanceCycle,
        });

        // 🟢 Create ServiceContractType and initial BillingSchedule
        const typeRes = await apiFetch('/service-contract-type', 'POST', {
          serviceContractType: formData.contractType,
          serviceContractId,
          billingType: formData.billingType || '',
          billingCycle: formData.billingCycle || '',
          billingDueDate: formData.startDate || '',
          paymentStatus: formData.paymentStatus || 'Paid',
          billingSchedule,
        });

        if (billingSchedule?.length && typeRes?.id) {
          await apiFetch('/service-contract-billing/bulk', 'POST', {
            serviceContractTypeId: typeRes.id,
            billings: billingSchedule,
          });
        }
      }

      // ✅ Re-add all Services
      for (const s of contractServices) {
        await apiFetch('/service-contract-services', 'POST', {
          serviceContractId,
          contractWorkCategoryId: parseInt(s.serviceName) || 1,
          description: s.description,
        });
      }

      // ✅ Re-add all Inventories
      for (const inv of inventories) {
        await apiFetch('/service-contract-inventory', 'POST', {
          serviceContractId,
          productTypeId: parseInt(inv.productType) || 1,
          makeModel: inv.makeModel,
          snMac: inv.snMac,
          description: inv.description,
          purchaseDate: inv.purchaseDate
            ? new Date(inv.purchaseDate).toISOString()
            : new Date().toISOString(),
          warrantyPeriod: inv.warrantyPeriod,
          warrantyStatus: inv.warrantyStatus,
          thirdPartyPurchase: inv.thirdPartyPurchase,
        });
      }

      // ✅ Add All Service Histories
      // SERVICE HISTORY SYNC
      for (const hist of serviceHistoryList) {
        // delete
        if (hist._delete && hist.id) {
          await apiFetch(`/service-contract-history/${hist.id}`, "DELETE");
          continue;
        }

        // update
        if (hist.id && !hist._delete) {
          await apiFetch(`/service-contract-history/${hist.id}`, "PATCH", {
            ...hist,
            serviceContractId,
            serviceDate: new Date(hist.serviceDate).toISOString(),
          });
          continue;
        }

        // create
        if (!hist.id && !hist._delete) {
          await apiFetch(`/service-contract-history`, "POST", {
            ...hist,
            serviceContractId,
            serviceDate: new Date(hist.serviceDate).toISOString(),
          });
        }
      }



      alert(editingId ? '✅ Service Contract updated!' : '✅ Service Contract created!');
      setShowForm(false);
      await loadContracts();
      await loadServiceHistories();
    } catch (err) {
      console.error('Save error', err);
      alert('❌ Failed to save data. Check console.');
    }
  };


  const handleEdit = async (id: number) => {
    try {
      // 1️⃣ Fetch main contract with all related data
      const main = await apiFetch(`/service-contract/${id}`);
      console.log('Fetched contract data:', main);

      const customer = customers.find(c => c.id === main.customerId);
      const sites = customer ? customer.sites : [];
      const period = main.periods?.[0] || {};
      const term = main.terms?.[0] || {};

      // 2️⃣ Set base form values
      setFormData({
        ...main,
        startDate: period?.startDate?.slice(0, 10) || '',
        endDate: period?.endDate?.slice(0, 10) || '',
        nextPMVisitDate: period?.nextPMVisitDate?.slice(0, 10) || '',
        contractDescription: period?.contractDescription || '',
        maxOnSiteVisits: term?.maxOnSiteVisits || '',
        maxPreventiveMaintenanceVisit: term?.maxPreventiveMaintenanceVisit || '',
        inclusiveInOnSiteVisitCounts: term?.inclusiveInOnSiteVisitCounts || false,
        preventiveMaintenanceCycle: term?.preventiveMaintenanceCycle || '',
      });

      setSites(sites);

      // 3️⃣ Services
      const enhancedServices = (main.services || []).map((s: any) => {
        const category = serviceCategories.find(cat => cat.id === s.contractWorkCategoryId);
        return {
          id: s.id,
          serviceName: s.contractWorkCategoryId?.toString() || '',
          description: s.description || '',
          serviceCategoryName: category?.contractWorkCategoryName || 'Unknown Category',
        };
      });
      setContractServices(enhancedServices);

      // 4️⃣ Inventories
      const enhancedInventories = (main.inventories || []).map((i: any) => {
        const productType = productTypes.find(pt => pt.id === i.productTypeId);
        return {
          id: i.id,
          productType: i.productTypeId?.toString() || '',
          makeModel: i.makeModel || '',
          snMac: i.snMac || '',
          description: i.description || '',
          purchaseDate: i.purchaseDate ? i.purchaseDate.slice(0, 10) : '',
          warrantyPeriod: i.warrantyPeriod || '',
          warrantyStatus: i.warrantyStatus || '',
          thirdPartyPurchase: i.thirdPartyPurchase || false,
          productTypeName: productType?.productTypeName || 'Unknown Type',
        };
      });
      setInventories(enhancedInventories);

      // 5️⃣ Service History
      // 5️⃣ Service History
      const historiesData = main.histories || [];
      if (historiesData.length > 0) {
        const mappedHistories = historiesData.map((h: any) => ({
          id: h.id,
          serviceContractId: id,
          taskId: h.taskId || '',
          serviceType: h.serviceType || 'On-Site Visit',
          serviceDate: h.serviceDate ? h.serviceDate.slice(0, 10) : '',
          startTime: h.startTime || '',
          endTime: h.endTime || '',
          serviceDetails: h.serviceDetails || '',
        }));
        setServiceHistoryList(mappedHistories); // ✅ display them in table
      }


      // 6️⃣ Contract Type & Billing
      try {
        const typeResArr = await apiFetch(`/service-contract-type?contractId=${id}`);
        const contractTypeRes = Array.isArray(typeResArr) ? typeResArr[0] : typeResArr;

        // Store the correct ServiceContractType ID for update/delete operations
        if (contractTypeRes) {
          setFormData(prev => ({
            ...prev,
            serviceContractTypeId: contractTypeRes.id,  // ✅ store correct ID
          }));
        }


        if (contractTypeRes) {
          const billingRes = await apiFetch(`/service-contract-billing/type/${contractTypeRes.id}`);

          setFormData(prev => ({
            ...prev,
            contractType: contractTypeRes.serviceContractType,
            billingType: contractTypeRes.billingType,
            billingCycle: contractTypeRes.billingCycle,
            paymentStatus: contractTypeRes.paymentStatus,
          }));

          setBillingSchedule(billingRes || []);
        }
      } catch (err) {
        console.warn('Billing info not found for contract', id, err);
      }

      // 7️⃣ Open modal
      setEditingId(id);
      setShowForm(true);
    } catch (err) {
      console.error('Error fetching contract for edit', err);
    }
  };


  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service contract?")) return;

    // 1️⃣ delete billing & type by contractId
    await apiFetch(`/service-contract-type/contract/${id}`, "DELETE");

    // 2️⃣ delete main contract
    await apiFetch(`/service-contract/${id}`, "DELETE");

    await loadContracts();
  };


  const handleAddService = () => {
    if (serviceForm.serviceName.trim()) {
      const category = serviceCategories.find(cat => cat.id.toString() === serviceForm.serviceName);
      setContractServices([
        ...contractServices,
        {
          ...serviceForm,
          serviceCategoryName: category?.contractWorkCategoryName || 'Unknown Category' // Changed this line
        }
      ]);
      setServiceForm({ serviceName: '', description: '' });
    }
  };

  const handleAddInventory = () => {
    if (inventoryForm.productType.trim()) {
      const productType = productTypes.find(pt => pt.id.toString() === inventoryForm.productType);
      setInventories(prev => [
        ...prev,
        {
          ...inventoryForm,
          productTypeName: productType?.productTypeName || 'Unknown Type'
        }
      ]);
      setInventoryForm({
        productType: '',
        makeModel: '',
        snMac: '',
        description: '',
        purchaseDate: '',
        warrantyPeriod: '',
        warrantyStatus: '',
        thirdPartyPurchase: false,
      });
      setShowInventoryModal(false);
    }
  };

  const removeService = (index: number) => {
    setContractServices(contractServices.filter((_, i) => i !== index));
  };

  const removeInventory = (index: number) => {
    setInventories(inventories.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowCustomerSuggestions(false);
      setShowManagerSuggestions(false);
      setShowServiceCatSuggestions(false);
      setShowTaskSuggestions(false);
      setShowProductTypeSuggestions(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


  return (
    <div className="p-8 bg-gray-50 min-h-screen -mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Service Contract Management</h1>
      </div>

      <div className="mb-6">
 <button
  type="button"
  onClick={handleAddNew}   // ✅ THIS WAS MISSING
  disabled={!serviceContractPerm.create}
  className={`px-6 py-3 rounded ${
    serviceContractPerm.create
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
>
  Add Service Contract
</button>


      </div>

      {/* Main Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-900">
                  {editingId ? 'Edit Service Contract' : 'Create New Service Contract'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-lg p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icons.Close />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <Icons.User />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <InputField
                        label="Service Contract ID"
                        value={formData.serviceContractID || ''}
                        onChange={() => { }}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed text-black"
                        icon={<Icons.Settings />}
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Icons.User />
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={
                          customerSearch ||
                          customers.find((c) => c.id === formData.customerId)?.customerName ||
                          ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerSearch(val);
                          setShowCustomerSuggestions(true);
                          if (val.trim()) {
                            const filtered = customers.filter((c) =>
                              c.customerName.toLowerCase().includes(val.toLowerCase())
                            );
                            setFilteredCustomers(filtered);
                          } else {
                            setFilteredCustomers(customers);
                          }
                        }}
                        onFocus={() => setShowCustomerSuggestions(true)}
                        placeholder="Search customer..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      />

                      {/* Suggestions dropdown */}
                      {showCustomerSuggestions && filteredCustomers.length > 0 && (
                        <ul className="absolute z-50 bg-white border border-gray-200 w-full max-h-48 overflow-y-auto rounded-lg shadow-lg mt-1">
                          {filteredCustomers.map((cust) => (
                            <li
                              key={cust.id}
                              className="px-4 py-2 cursor-pointer hover:bg-blue-100 text-gray-800"
                              onClick={() => {
                                handleCustomerSelect(cust.id);
                                setCustomerSearch(cust.customerName);
                                setShowCustomerSuggestions(false);
                              }}
                            >
                              {cust.customerName}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>


                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Icons.Building />
                        Branch / Site
                      </label>
                      <select
                        value={formData.branchId || ''}
                        onChange={(e) => setFormData({ ...formData, branchId: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-white"
                        required
                      >
                        <option value="">Select Site</option>
                        {sites.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.siteName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 lg:col-span-1">
                      <InputField
                        label="Sales Manager Name"
                        value={formData.salesManagerName}
                        placeholder='enter salesmanager name'
                        onChange={val => setFormData({ ...formData, salesManagerName: val })}
                        required
                        className="text-black bg-white"
                        icon={<Icons.User />}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Icons.Building />
                        AMC Type
                      </label>
                      <select
                        className="w-full p-2 border rounded text-black bg-white"
                        value={formData.amcType}
                        onChange={e => setFormData({ ...formData, amcType: e.target.value })}
                        required
                      >
                        <option value="" disabled>Select AMC Type</option>
                        <option value="Comprehensive">Comprehensive</option>
                        <option value="Non-Comprehensive">Non-Comprehensive</option>
                      </select>
                    </div>


                  </div>
                </div>

                {/* Contract Period Section */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <Icons.Calendar />
                    Contract Period
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Contract Start Date"
                      type="date"
                      value={formData.startDate}
                      onChange={val => setFormData({ ...formData, startDate: val })}
                      required
                      className="text-black  bg-white"
                      icon={<Icons.Calendar />}
                    />
                    <InputField
                      label="Contract End Date"
                      type="date"
                      value={formData.endDate}
                      onChange={val => setFormData({ ...formData, endDate: val })}
                      required
                      className="text-black  bg-white"
                      icon={<Icons.Calendar />}
                    />
                  </div>
                </div>

                {/* Contract Type & Billing Section */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <Icons.Calendar />
                    Contract Type & Billing
                  </h3>

                  {/* Contract Type */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      Contract Type
                    </label>
                    <select
                      value={formData.contractType || 'Free'}
                      onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                    >
                      <option value="Free">Free</option>
                      <option value="Paid">Paid</option>
                    </select>

                  </div>

                  {/* Billing Fields - only for Paid */}
                  {formData.contractType === 'Paid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Billing Type</label>
                        <select
                          value={formData.billingType}
                          onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                        >
                          <option value="">Select</option>
                          <option value="Prepaid">Prepaid</option>
                          <option value="Postpaid">Postpaid</option>
                        </select>
                      </div>

                      <InputField
                        label="Billing Cycle (Days)"
                        type="number"
                        value={formData.billingCycle || ''}
                        onChange={(val) =>
                          setFormData({ ...formData, billingCycle: val })
                        }
                        placeholder="e.g. 90"
                        className="text-black bg-white"
                      />


                    </div>
                  )}
                </div>


                {/* Billing Schedule (Collapsible Section) */}
                {formData.contractType === 'Paid' && formData.startDate && formData.endDate && formData.billingCycle && (
                  <div className="bg-blue-50 p-6 mt-4 rounded-lg border border-blue-200">
                    {/* Header */}
                    <div
                      className="flex justify-between items-center cursor-pointer select-none"
                      onClick={() => setShowBillingSchedule((prev) => !prev)}
                    >
                      <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                        <Icons.Calendar />
                        Billing Schedule
                      </h3>

                      {/* Toggle Arrow */}
                      <button className="text-blue-700 hover:text-blue-900 transition-transform">
                        {showBillingSchedule ? (
                          <Icons.ChevronUp />
                        ) : (
                          <Icons.ChevronDown />
                        )}
                      </button>
                    </div>

                    {/* Collapsible Content */}
                    {showBillingSchedule && (
                      <div className="mt-4 transition-all duration-300 ease-in-out">
                        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                          <thead className="bg-blue-100">
                            <tr>
                              <th className="p-3 text-black text-left">Due Date</th>
                              <th className="p-3 text-black text-left">Payment Status</th>
                              <th className="p-3 text-black text-left">Overdue Days</th>
                            </tr>
                          </thead>
                          <tbody>
                            {billingSchedule.map((bill, i) => (
                              <tr key={i} className="border-t text-black border-gray-200">
                                <td className="p-3">{bill.dueDate}</td>
                                <td className="p-3">
                                  <select
                                    value={bill.paymentStatus}
                                    onChange={(e) => updatePaymentStatus(i, e.target.value)}
                                    className="border border-gray-300 rounded-lg px-2 py-1 bg-white text-sm"
                                  >
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Unpaid</option>
                                  </select>
                                </td>
                                <td
                                  className={`p-3 font-medium ${bill.paymentStatus === 'Unpaid' && bill.overdueDays > 0
                                    ? 'text-red-600'
                                    : 'text-gray-700'
                                    }`}
                                >
                                  {bill.paymentStatus === 'Unpaid' && bill.overdueDays > 0
                                    ? `${bill.overdueDays} days`
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                      </div>
                    )}
                  </div>
                )}




                {/* Contract Terms Section */}
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                    <Icons.Settings />
                    Contract Terms
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InputField
                      label="Max On-Site Visits"
                      value={formData.maxOnSiteVisits}
                      onChange={val => setFormData({ ...formData, maxOnSiteVisits: val })}
                      type="text"
                      placeholder='Nos'
                      className="text-black  bg-white"
                      icon={<Icons.Settings />}
                    />
                    <InputField
                      label="Max PM Visits"
                      value={formData.maxPreventiveMaintenanceVisit}
                      onChange={val => setFormData({ ...formData, maxPreventiveMaintenanceVisit: val })}
                      type="text"
                      placeholder='Nos'

                      className="text-black  bg-white"
                      icon={<Icons.Settings />}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        PM Visit Inclusive in On-Site Visit
                      </label>
                      <select
                        value={formData.inclusiveInOnSiteVisitCounts ? 'Yes' : 'No'}
                        onChange={(e) => setFormData({ ...formData, inclusiveInOnSiteVisitCounts: e.target.value === 'Yes' })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-white"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <InputField
                      label="Preventive Maintenance Cycle"
                      value={formData.preventiveMaintenanceCycle}
                      onChange={val => setFormData({ ...formData, preventiveMaintenanceCycle: val })}
                      type="text"
                      placeholder='Nos'

                      className="text-black  bg-white"
                      icon={<Icons.Settings />}
                    />
                  </div>
                </div>

                {/* Contract Description */}
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                    <Icons.Tool />
                    Contract Description
                  </h3>
                  <textarea
                    value={formData.contractDescription}
                    onChange={(e) => setFormData({ ...formData, contractDescription: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[100px] text-black bg-white"
                    placeholder="Enter contract description..."
                  />
                </div>

                {/* Contract Services Section */}
                <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
                      <Icons.Tool />
                      Contract Services ({contractServices.length})
                    </h3>
                  </div>

                  {/* Add Service Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-white rounded-lg border">
                    {/* Service Category Searchable Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Category
                      </label>
                      <select
                        value={serviceForm.serviceName || ""}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, serviceName: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select Service Category</option>
                        {serviceCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.contractWorkCategoryName} {/* Changed this line */}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <InputField
                          label="Description"
                          value={serviceForm.description}
                          onChange={val => setServiceForm({ ...serviceForm, description: val })}
                          placeholder="Service description..."
                          className="text-black"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddService}
                        disabled={!serviceForm.serviceName.trim()}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-1 flex items-center gap-2"
                      >
                        <Icons.Plus />
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Services Table */}
                  {contractServices.length > 0 && (
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-indigo-100">
                          <tr>
                            <th className="p-3 text-left text-indigo-800 font-semibold">Service Category</th>
                            <th className="p-3 text-left text-indigo-800 font-semibold">Description</th>
                            <th className="p-3 text-left text-indigo-800 font-semibold w-20">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {contractServices.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="p-3 text-gray-700 font-medium">{s.serviceCategoryName}</td>
                              <td className="p-3 text-gray-700">{s.description}</td>
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => removeService(i)}
                                  className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1"
                                >
                                  <Icons.Delete />
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

                {/* Inventory Section */}
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                      <Icons.Package />
                      Inventory Items ({inventories.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowInventoryModal(true)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                      <Icons.Plus />
                      Add Inventory Item
                    </button>
                  </div>

                  {inventories.length > 0 && (
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-orange-100">
                          <tr>
                            <th className="p-3 text-left text-orange-800 font-semibold">Product Type</th>
                            <th className="p-3 text-left text-orange-800 font-semibold">Make & Model</th>
                            <th className="p-3 text-left text-orange-800 font-semibold">SN/MAC</th>
                            <th className="p-3 text-left text-orange-800 font-semibold">Warranty Status</th>
                            <th className="p-3 text-left text-orange-800 font-semibold">3rd Party</th>
                            <th className="p-3 text-left text-orange-800 font-semibold w-20">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventories.map((inv, i) => (
                            <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                              <td className="p-3 text-gray-700">{inv.productTypeName}</td>
                              <td className="p-3 text-gray-700">{inv.makeModel}</td>
                              <td className="p-3 text-gray-700 font-mono">{inv.snMac}</td>
                              <td className="p-3 text-gray-700">{inv.warrantyStatus}</td>
                              <td className="p-3 text-gray-700">
                                {inv.thirdPartyPurchase ? 'Yes' : 'No'}
                              </td>
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => removeInventory(i)}
                                  className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1"
                                >
                                  <Icons.Delete />
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Service History Section */}
                {/* Service History Section */}
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                      <Icons.History />
                      Service History ({serviceHistoryList.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Icons.Plus />
                      Add Service History
                    </button>
                  </div>

                  {serviceHistoryList.length > 0 && (
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-red-100">
                          <tr>
                            <th className="p-3 text-left text-red-800 font-semibold">Task ID</th>
                            <th className="p-3 text-left text-red-800 font-semibold">Service Type</th>
                            <th className="p-3 text-left text-red-800 font-semibold">Service Date</th>
                            <th className="p-3 text-left text-red-800 font-semibold">Time</th>
                            <th className="p-3 text-left text-red-800 font-semibold">Details</th>
                            <th className="p-3 text-left text-red-800 font-semibold w-20">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceHistoryList
                            .filter(h => !h._hidden)   // ⬅️ FIX
                            .map((hist, i) => (
                              <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="p-3 text-gray-700">{hist.taskId}</td>
                                <td className="p-3 text-gray-700">{hist.serviceType}</td>
                                <td className="p-3 text-gray-700">{hist.serviceDate}</td>
                                <td className="p-3 text-gray-700">
                                  {hist.startTime} - {hist.endTime}
                                </td>
                                <td className="p-3 text-gray-700">{hist.serviceDetails}</td>
                                <td className="p-3">
                                  <button
                                    type="button"
                                    onClick={() => removeHistory(i)}
                                    className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1"
                                  >
                                    <Icons.Delete />
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ---- Service History Modal ---- */}
                {showHistoryModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-red-800 flex items-center gap-2">
                          <Icons.History />
                          Add Service History
                        </h3>
                        <button
                          onClick={() => setShowHistoryModal(false)}
                          className="text-gray-500 hover:text-gray-700 text-lg p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Icons.Close />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Task ID Searchable Input */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Icons.Settings />
                            Task ID
                          </label>

                          <input
                            type="text"
                            value={historyFormModal.taskId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFilteredTasks(
                                tasks.filter(
                                  (t) =>
                                    t.taskID?.toLowerCase().includes(val.toLowerCase()) ||
                                    t.id.toString().includes(val)
                                )
                              );
                              setHistoryFormModal({ ...historyFormModal, taskId: val });
                              setShowTaskSuggestions(true);
                            }}
                            onFocus={() => setShowTaskSuggestions(true)}
                            placeholder="Search Task ID..."
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                          />

                          {showTaskSuggestions && filteredTasks.length > 0 && (
                            <ul className="absolute z-50 bg-white border border-gray-200 w-full max-h-48 overflow-y-auto rounded-lg shadow-lg mt-1">
                              {filteredTasks.map((task) => (
                                <li
                                  key={task.id}
                                  className="px-4 py-2 cursor-pointer hover:bg-blue-100 text-gray-800"
                                  onClick={() => {
                                    setHistoryFormModal({
                                      ...historyFormModal,
                                      taskId: task.taskID || task.id.toString(),
                                    });
                                    setShowTaskSuggestions(false);
                                  }}
                                >
                                  {task.taskID || `Task #${task.id}`}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Service Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Type
                          </label>
                          <select
                            value={historyFormModal.serviceType}
                            onChange={(e) =>
                              setHistoryFormModal({
                                ...historyFormModal,
                                serviceType: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-white"
                          >
                            <option value="">select type</option>
                            <option value="On-Site Visit">On-Site Visit</option>
                            <option value="PM Visit">PM Visit</option>
                            <option value="Remote Support">Remote Support</option>
                          </select>
                        </div>

                        <InputField
                          label="Service Date"
                          type="date"
                          value={historyFormModal.serviceDate}
                          onChange={(val) =>
                            setHistoryFormModal({ ...historyFormModal, serviceDate: val })
                          }
                          className="text-black"
                          icon={<Icons.Calendar />}
                        />

                        <InputField
                          label="Start Time"
                          type="time"
                          value={historyFormModal.startTime}
                          onChange={(val) =>
                            setHistoryFormModal({ ...historyFormModal, startTime: val })
                          }
                          className="text-black"
                          icon={<Icons.Calendar />}
                        />

                        <InputField
                          label="End Time"
                          type="time"
                          value={historyFormModal.endTime}
                          onChange={(val) =>
                            setHistoryFormModal({ ...historyFormModal, endTime: val })
                          }
                          className="text-black"
                          icon={<Icons.Calendar />}
                        />

                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Details
                          </label>
                          <textarea
                            value={historyFormModal.serviceDetails}
                            onChange={(e) =>
                              setHistoryFormModal({
                                ...historyFormModal,
                                serviceDetails: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[100px] text-black bg-white"
                            placeholder="Enter service details..."
                          />
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="flex gap-3 justify-end border-t border-gray-200 pt-6">
                        <button
                          onClick={() => setShowHistoryModal(false)}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <Icons.Close />
                          Cancel
                        </button>
                        <button
                          onClick={handleAddHistory}
                          disabled={!historyFormModal.taskId.trim()}
                          className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                        >
                          <Icons.Plus />
                          Add History
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                  >
                    <Icons.Close />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center gap-2"
                  >
                    <Icons.Settings />
                    {editingId ? 'Update Contract' : 'Create Contract'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Icons.Package />
                Add Inventory Item
              </h3>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-gray-500 hover:text-gray-700 text-lg p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Product Category Searchable Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Category
                </label>
                <select
                  value={inventoryForm.productType}
                  onChange={(e) =>
                    setInventoryForm({ ...inventoryForm, productType: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-white"
                  required
                >
                  <option value="">Select Product Category</option>
                  {productTypes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productTypeName}
                    </option>
                  ))}
                </select>
              </div>

              <InputField
                label="Make & Model"
                value={inventoryForm.makeModel}
                onChange={(val) => setInventoryForm({ ...inventoryForm, makeModel: val })}
                placeholder="Enter make and model..."
                className="text-black"
              />

              <InputField
                label="SN / MAC Address"
                value={inventoryForm.snMac}
                onChange={(val) => setInventoryForm({ ...inventoryForm, snMac: val })}
                placeholder="Enter serial number or MAC..."
                className="text-black"
              />

              <InputField
                label="Description"
                value={inventoryForm.description}
                onChange={(val) => setInventoryForm({ ...inventoryForm, description: val })}
                placeholder="Item description..."
                className="text-black"
              />

              <InputField
                label="Purchase Date"
                type="date"
                value={inventoryForm.purchaseDate}
                onChange={(val) => setInventoryForm({ ...inventoryForm, purchaseDate: val })}
                className="text-black"
              />

              <InputField
                label="Warranty Period"
                value={inventoryForm.warrantyPeriod}
                onChange={(val) => setInventoryForm({ ...inventoryForm, warrantyPeriod: val })}
                placeholder="e.g., 1 year, 2 years..."
                className="text-black"
              />

            <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Warranty Status
  </label>

  <select
    value={inventoryForm.warrantyStatus}
    onChange={(e) =>
      setInventoryForm({
        ...inventoryForm,
        warrantyStatus: e.target.value,
      })
    }
    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 text-black bg-white"
    required
  >
    <option value="">Select Warranty Status</option>
    <option value="Active">Active</option>
    <option value="Expired">Expired</option>
  </select>
</div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3rd Party Purchase
                </label>
                <select
                  value={inventoryForm.thirdPartyPurchase ? 'Yes' : 'No'}
                  onChange={(e) => setInventoryForm({
                    ...inventoryForm,
                    thirdPartyPurchase: e.target.value === 'Yes',
                  })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-white"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t border-gray-200 pt-6">
              <button
                onClick={() => setShowInventoryModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <Icons.Close />
                Cancel
              </button>
              <button
                onClick={handleAddInventory}
                disabled={!inventoryForm.productType.trim()}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                <Icons.Plus />
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contracts List Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center">

          <h2 className="text-xl font-semibold text-white">Service Contracts</h2>
          {/* 🔍 Search bar */}
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset to first page on search
            }}
            className="ml-4 px-3 py-2 rounded-lg text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 border border-gray-300"
          />

        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Contract ID</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Customer Name</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Branch/Site</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Sales Manager</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Start Date</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">End Date</th>
                <th className="px-6 py-4 text-left text-blue-800 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedContracts.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-700 font-medium">{item.serviceContractID}</td>
                  <td className="px-6 py-4 text-gray-700">{item.customerName}</td>
                  <td className="px-6 py-4 text-gray-700">{item.branchName}</td>
                  <td className="px-6 py-4 text-gray-700">{item.salesManagerName}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.periods?.[0]?.startDate
                      ? new Date(item.periods[0].startDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.periods?.[0]?.endDate
                      ? new Date(item.periods[0].endDate).toLocaleDateString()
                      : 'N/A'}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                     <button
  onClick={() => handleEdit(item.id || 0)}
  disabled={!serviceContractPerm.edit}
  className={`p-2 rounded ${
    serviceContractPerm.edit
      ? 'text-blue-600 hover:bg-blue-50'
      : 'text-gray-400 cursor-not-allowed'
  }`}
>
                        <Icons.Edit />
                      </button>
                     <button
  onClick={() => handleDelete(item.id || 0)}
  disabled={!serviceContractPerm.delete}
  className={`p-2 rounded ${
    serviceContractPerm.delete
      ? 'text-red-600 hover:bg-red-50'
      : 'text-gray-400 cursor-not-allowed'
  }`}
>
                        <Icons.Delete />
</button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages || 1}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                ← Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ✅ Improved InputField Component */
function InputField({
  label,
  value,
  onChange,
  type = 'text',
  required,
  readOnly,
  className = '',
  placeholder,
  icon
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${icon ? 'pl-10' : ''} ${className}`}
        />
      </div>
    </div>
  );
}
