'use client';

import { useEffect, useState } from 'react';

// Simple API helper
async function apiFetch(url: string, method = 'GET', body?: any) {
  try {
    const res = await fetch(`http://localhost:8000${url}`, {
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
  startDate: string;
  endDate: string;
  nextPMVisitDate: string;
  maxOnSiteVisits: string;
  maxPreventiveMaintenanceVisit: string;
  inclusiveInOnSiteVisitCounts: boolean;
  preventiveMaintenanceCycle: string;
  contractDescription: string;
  customerName?: string;
  branchName?: string;
  periods?: any[];
  terms?: any[];
  services?: any[];
  inventories?: any[];
  histories?: any[];
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
   serviceContract?: {
    id: number;
    serviceContractID: string;
    customerId: number;
    branchId: number;
    salesManagerName: string;
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

  const [formData, setFormData] = useState<ServiceContract>({
    serviceContractID: '',
    customerId: 0,
    branchId: 0,
    salesManagerName: '',
    startDate: '',
    endDate: '',
    nextPMVisitDate: '',
    maxOnSiteVisits: '',
    maxPreventiveMaintenanceVisit: '',
    inclusiveInOnSiteVisitCounts: false,
    preventiveMaintenanceCycle: '',
    contractDescription: '',
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

  // ⬇️ fetch customers (only addressType = "Customer")
  useEffect(() => {
    const fetchCustomers = async () => {
      const data = await apiFetch('/address-book');
      const filtered = data.filter((c: any) => c.addressType === 'Customer');
      setCustomers(filtered);
    };
    fetchCustomers();
  }, []);

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
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch('/serviceworkcategory');
        setServiceCategories(res);
      } catch (err) {
        console.error('Error loading service work categories', err);
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

  // ⬇️ when Add New button clicked → prefill next ID
  const handleAddNew = async () => {
    const res = await apiFetch('/service-contract/next/id');
    setFormData({
      serviceContractID: res.nextID || '',
      customerId: 0,
      branchId: 0,
      salesManagerName: '',
      startDate: '',
      endDate: '',
      nextPMVisitDate: '',
      maxOnSiteVisits: '',
      maxPreventiveMaintenanceVisit: '',
      inclusiveInOnSiteVisitCounts: false,
      preventiveMaintenanceCycle: '',
      contractDescription: '',
    });
    setContractServices([]);
    setInventories([]);
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
      const enhancedContracts = contracts.map((contract: any) => {
        const customer = customers.find(c => c.id === contract.customerId);
        let branchName = 'N/A';
        
        if (customer && contract.branchId) {
          const branch = customer.sites?.find((s: any) => s.id === contract.branchId);
          branchName = branch?.siteName || 'N/A';
        }
        
        return {
          ...contract,
          customerName: customer?.customerName || 'Unknown Customer',
          branchName: branchName,
          startDate: contract.startDate || '',
          endDate: contract.endDate || ''
        };
      });
      
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
        });

        // 🔹 POST or PATCH period
        await apiFetch(`/service-contract-period`, 'POST', {
          serviceContractId: editingId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          nextPMVisitDate: formData.nextPMVisitDate,
          contractDescription: formData.contractDescription,
        });

        // 🔹 POST or PATCH terms
        await apiFetch(`/service-contract-terms`, 'POST', {
          serviceContractId: editingId,
          maxOnSiteVisits: formData.maxOnSiteVisits,
          maxPreventiveMaintenanceVisit: formData.maxPreventiveMaintenanceVisit,
          inclusiveInOnSiteVisitCounts: formData.inclusiveInOnSiteVisitCounts,
          preventiveMaintenanceCycle: formData.preventiveMaintenanceCycle,
        });
      } else {
        // 🟢 CREATE NEW CONTRACT FIRST
        const main = await apiFetch('/service-contract', 'POST', {
          customerId: formData.customerId,
          branchId: formData.branchId,
          salesManagerName: formData.salesManagerName,
        });
        serviceContractId = main.id;

        // 🔹 Create period + terms after contract creation
        await apiFetch(`/service-contract-period`, 'POST', {
          serviceContractId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          nextPMVisitDate: formData.nextPMVisitDate,
          contractDescription: formData.contractDescription,
        });

        await apiFetch(`/service-contract-terms`, 'POST', {
          serviceContractId,
          maxOnSiteVisits: formData.maxOnSiteVisits,
          maxPreventiveMaintenanceVisit: formData.maxPreventiveMaintenanceVisit,
          inclusiveInOnSiteVisitCounts: formData.inclusiveInOnSiteVisitCounts,
          preventiveMaintenanceCycle: formData.preventiveMaintenanceCycle,
        });
      }

      // Now (re)insert child items
      // ✅ Services
      for (const s of contractServices) {
        await apiFetch('/service-contract-services', 'POST', {
          serviceContractId,
          contractWorkCategoryId: parseInt(s.serviceName) || 1,
        });
      }

      // ✅ Inventories
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

      // ✅ Service History
      if (historyForm.taskId.trim() && historyForm.serviceDate && historyForm.startTime && historyForm.endTime) {
        await apiFetch('/service-contract-history', 'POST', {
          ...historyForm,
          serviceContractId: serviceContractId || editingId,
        });
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
      // 1️⃣ Fetch main contract with all related data in one call
      const main = await apiFetch(`/service-contract/${id}`);
      console.log('Fetched contract data:', main);

      // Get customer and site info for dropdowns
      const customer = customers.find(c => c.id === main.customerId);
      const sites = customer ? customer.sites : [];

      // 2️⃣ Safely set form data from the nested periods and terms
      const period = main.periods && main.periods.length > 0 ? main.periods[0] : {};
      const term = main.terms && main.terms.length > 0 ? main.terms[0] : {};

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

      // Set sites for dropdown
      setSites(sites);

      // 3️⃣ Set Contract Services from the nested services array
      const servicesData = main.services || [];
      console.log('Services data:', servicesData);
      
      const enhancedServices = servicesData.map((s: any) => {
        const category = serviceCategories.find(cat => cat.id === s.contractWorkCategoryId);
        return {
          id: s.id,
          serviceName: s.contractWorkCategoryId?.toString() || '',
          description: s.description || '',
          serviceCategoryName: category?.serviceWorkCategoryName || 'Unknown Category',
          contractWorkCategoryId: s.contractWorkCategoryId
        };
      });
      
      setContractServices(enhancedServices);
      console.log('Enhanced services:', enhancedServices);

      // 4️⃣ Set Inventories from the nested inventories array
      const inventoryData = main.inventories || [];
      console.log('Inventory data:', inventoryData);
      
      const enhancedInventories = inventoryData.map((i: any) => {
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
          productTypeId: i.productTypeId
        };
      });
      
      setInventories(enhancedInventories);
      console.log('Enhanced inventories:', enhancedInventories);

      // 5️⃣ Set Service Histories from the nested histories array
      const historiesData = main.histories || [];
      console.log('Histories data:', historiesData);
      
      if (historiesData.length > 0) {
        const latestHistory = historiesData[0];
        setHistoryForm({
          serviceContractId: id,
          taskId: latestHistory.taskId || '',
          serviceType: latestHistory.serviceType || 'On-Site Visit',
          serviceDate: latestHistory.serviceDate ? latestHistory.serviceDate.slice(0, 10) : '',
          startTime: latestHistory.startTime || '',
          endTime: latestHistory.endTime || '',
          serviceDetails: latestHistory.serviceDetails || '',
        });
      }

      // 6️⃣ Open modal
      setEditingId(id);
      setShowForm(true);
    } catch (err) {
      console.error('Error fetching contract for edit', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this service contract?')) return;
    await apiFetch(`/service-contract/${id}`, 'DELETE');
    await loadContracts();
  };

  const handleAddService = () => {
    if (serviceForm.serviceName.trim()) {
      const category = serviceCategories.find(cat => cat.id.toString() === serviceForm.serviceName);
      setContractServices([
        ...contractServices, 
        {
          ...serviceForm,
          serviceCategoryName: category?.serviceWorkCategoryName || 'Unknown Category'
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Service Contract Management</h1>
        <p className="text-gray-600">Manage service contracts, terms, inventory, and service histories</p>
      </div>

      <div className="mb-6">
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center gap-2"
        >
          <Icons.Plus />
          Add New Service Contract
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
                        onChange={() => {}}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed text-black"
                        icon={<Icons.Settings />}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Icons.User />
                        Customer Name
                      </label>
                      <select
                        value={formData.customerId || ''}
                        onChange={(e) => handleCustomerSelect(parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-white"
                        required
                      >
                        <option value="">Select Customer</option>
                        {customers.map((cust) => (
                          <option key={cust.id} value={cust.id}>
                            {cust.customerName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
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
                        onChange={val => setFormData({ ...formData, salesManagerName: val })}
                        required
                        className="text-black"
                        icon={<Icons.User />}
                      />
                    </div>
                  </div>
                </div>

                {/* Contract Period Section */}
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <Icons.Calendar />
                    Contract Period
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField 
                      label="Contract Start Date" 
                      type="date" 
                      value={formData.startDate} 
                      onChange={val => setFormData({ ...formData, startDate: val })} 
                      required
                      className="text-black"
                      icon={<Icons.Calendar />}
                    />
                    <InputField 
                      label="Contract End Date" 
                      type="date" 
                      value={formData.endDate} 
                      onChange={val => setFormData({ ...formData, endDate: val })} 
                      required
                      className="text-black"
                      icon={<Icons.Calendar />}
                    />
                    <InputField 
                      label="Next Due PM Visit" 
                      type="date" 
                      value={formData.nextPMVisitDate} 
                      onChange={val => setFormData({ ...formData, nextPMVisitDate: val })} 
                      className="text-black"
                      icon={<Icons.Calendar />}
                    />
                  </div>
                </div>

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
                      type="number"
                      className="text-black"
                      icon={<Icons.Settings />}
                    />
                    <InputField 
                      label="Max Preventive Maintenance Visit" 
                      value={formData.maxPreventiveMaintenanceVisit} 
                      onChange={val => setFormData({ ...formData, maxPreventiveMaintenanceVisit: val })} 
                      type="number"
                      className="text-black"
                      icon={<Icons.Settings />}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Icons.Settings />
                        Inclusive in On-Site Visit Counts
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
                      label="Preventive Maintenance Cycle (Days)" 
                      value={formData.preventiveMaintenanceCycle} 
                      onChange={val => setFormData({ ...formData, preventiveMaintenanceCycle: val })} 
                      type="number"
                      className="text-black"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
                      <select
                        value={serviceForm.serviceName}
                        onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      >
                        <option value="">Select Service Category</option>
                        {serviceCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.serviceWorkCategoryName}
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
                            <th className="p-3 text-left text-indigo-800 font-semibold">Category</th>
                            <th className="p-3 text-left text-indigo-800 font-semibold">Description</th>
                            <th className="p-3 text-left text-indigo-800 font-semibold w-20">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contractServices.map((s, i) => (
                            <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                              <td className="p-3 text-gray-700">{s.serviceCategoryName}</td>
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
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <Icons.History />
                    Service History
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField
                      label="Task ID"
                      value={historyForm.taskId}
                      onChange={(val) => setHistoryForm({ ...historyForm, taskId: val })}
                      placeholder="Enter task ID"
                      className="text-black"
                      icon={<Icons.Settings />}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                      <select
                        value={historyForm.serviceType}
                        onChange={(e) => setHistoryForm({ ...historyForm, serviceType: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-white"
                      >
                        <option value="On-Site Visit">On-Site Visit</option>
                        <option value="PM Visit">PM Visit</option>
                        <option value="Remote Support">Remote Support</option>
                      </select>
                    </div>

                    <InputField
                      label="Service Date"
                      type="date"
                      value={historyForm.serviceDate}
                      onChange={(val) => setHistoryForm({ ...historyForm, serviceDate: val })}
                      className="text-black"
                      icon={<Icons.Calendar />}
                    />

                    <InputField
                      label="Start Time"
                      type="time"
                      value={historyForm.startTime}
                      onChange={(val) => setHistoryForm({ ...historyForm, startTime: val })}
                      className="text-black"
                      icon={<Icons.Calendar />}
                    />

                    <InputField
                      label="End Time"
                      type="time"
                      value={historyForm.endTime}
                      onChange={(val) => setHistoryForm({ ...historyForm, endTime: val })}
                      className="text-black"
                      icon={<Icons.Calendar />}
                    />

                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Details</label>
                      <textarea
                        value={historyForm.serviceDetails}
                        onChange={(e) => setHistoryForm({ ...historyForm, serviceDetails: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[80px] text-black bg-white"
                        placeholder="Enter service details..."
                      />
                    </div>
                  </div>
                </div>

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Category</label>
                <select
                  value={inventoryForm.productType}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, productType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-white"
                >
                  <option value="">Select Product Type</option>
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

              <InputField
                label="Warranty Status"
                value={inventoryForm.warrantyStatus}
                onChange={(val) => setInventoryForm({ ...inventoryForm, warrantyStatus: val })}
                placeholder="e.g., Active, Expired..."
                className="text-black"
              />

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
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-semibold text-white">Service Contracts</h2>
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
              {serviceContracts.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-700 font-medium">{item.serviceContractID}</td>
                  <td className="px-6 py-4 text-gray-700">{item.customerName}</td>
                  <td className="px-6 py-4 text-gray-700">{item.branchName}</td>
                  <td className="px-6 py-4 text-gray-700">{item.salesManagerName}</td>
                  <td className="px-6 py-4 text-gray-700">{item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-700">{item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleEdit(item.id!)} 
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                      >
                        <Icons.Edit />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id!)} 
                        className="text-red-600 hover:text-red-800 font-medium transition-colors flex items-center gap-1"
                      >
                        <Icons.Delete />
                        Delete
                      </button>
                    </div>
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