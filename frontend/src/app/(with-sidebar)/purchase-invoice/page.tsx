import React from 'react';
import PurchaseInvoiceTable from './purchaseInvoiceTable';

export default function PurchaseInvoices() {
  return (
    <div className="flex h-screen">
    <main className="flex-1 p-4">
      <PurchaseInvoiceTable />
    </main>
  </div>
  );
}
