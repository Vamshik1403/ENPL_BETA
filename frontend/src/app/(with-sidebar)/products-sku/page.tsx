import React from 'react';
import ProductTable from './ProductTable';

export default function Products() {
  return (
    <div className="flex h-screen">
    <main className="flex-1 p-4">
      <ProductTable />
    </main>
  </div>
  );
}
