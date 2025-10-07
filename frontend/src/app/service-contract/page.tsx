'use client';

import { useState } from 'react';

interface ServiceContract {
  id?: number;
  serviceContractID: string;
  customerId: number;
  branchId: number;
  salesManagerName: string;
}

interface ServiceContractPeriod {
  id?: number;
  serviceContractId: number;
  startDate: string;
  endDate: string;
  nextPMVisitDate?: string;
  contractDescription?: string;
}

interface ServiceContractTerms {
  id?: number;
  serviceContractId: number;
  maxOnSiteVisits: string;
  maxPreventiveMaintenanceVisit: string;
  inclusiveInOnSiteVisitCounts: boolean;
  preventiveMaintenanceCycle: string;
}

interface ServiceContractInventory {
  id?: number;
  serviceContractId: number;
  productTypeId: number;
  makeModel: string;
  snMac: string;
  description: string;
  purchaseDate: string;
  warrantyPeriod: string;
  warrantyStatus: string;
  thirdPartyPurchase: boolean;
}

export default function ServiceContractPage() {
  const [serviceContracts, setServiceContracts] = useState<ServiceContract[]>([]);
  const [periods, setPeriods] = useState<ServiceContractPeriod[]>([]);
  const [terms, setTerms] = useState<ServiceContractTerms[]>([]);
  const [inventories, setInventories] = useState<ServiceContractInventory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ServiceContract>({
    serviceContractID: '',
    customerId: 0,
    branchId: 0,
    salesManagerName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setServiceContracts(serviceContracts.map(item => 
        item.id === editingId ? { ...formData, id: editingId } : item
      ));
    } else {
      const newId = Math.max(...serviceContracts.map(s => s.id || 0), 0) + 1;
      setServiceContracts([...serviceContracts, { ...formData, id: newId }]);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({
      serviceContractID: '',
      customerId: 0,
      branchId: 0,
      salesManagerName: '',
    });
  };

  const handleEdit = (id: number) => {
    const item = serviceContracts.find(s => s.id === id);
    if (item) {
      setFormData(item);
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDelete = (id: number) => {
    setServiceContracts(serviceContracts.filter(s => s.id !== id));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Contract</h1>
        <p className="text-gray-600">Manage service contracts and agreements</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Service Contract
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Service Contract' : 'Add New Service Contract'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Contract ID
              </label>
              <input
                type="text"
                value={formData.serviceContractID}
                onChange={(e) => setFormData({ ...formData, serviceContractID: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer ID
              </label>
              <input
                type="number"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch ID
              </label>
              <input
                type="number"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sales Manager Name
              </label>
              <input
                type="text"
                value={formData.salesManagerName}
                onChange={(e) => setFormData({ ...formData, salesManagerName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update' : 'Add'} Service Contract
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    serviceContractID: '',
                    customerId: 0,
                    branchId: 0,
                    salesManagerName: '',
                  });
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
          <h2 className="text-xl font-semibold">Service Contracts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Contract ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceContracts.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.serviceContractID}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.customerId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.branchId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.salesManagerName}
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
