import React from 'react';
import InventoryTable from './inventoryTable';

export default function Inventory() {
  return (
    <div className="flex h-screen">
    <main className="flex-1 p-4">
      <InventoryTable />
    </main>
  </div>
  );
};
