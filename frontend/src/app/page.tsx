export default function Home() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to ENPL ERP System</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main Operations */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Address Book</h3>
          <p className="text-gray-600">Manage customer and vendor information</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sites</h3>
          <p className="text-gray-600">Manage customer sites and locations</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Workscope</h3>
          <p className="text-gray-600">Manage workscope categories</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Contracts</h3>
          <p className="text-gray-600">Manage service contracts and agreements</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tasks</h3>
          <p className="text-gray-600">Track and manage tasks and work orders</p>
        </div>
        
        {/* Setup Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <span className="text-xl mr-2">⚙️</span>
            Setup
          </h3>
          <p className="text-gray-600 mb-3">System configuration and management</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-700">
              <span className="mr-2">📦</span>
              Products
            </div>
            <div className="flex items-center text-gray-700">
              <span className="mr-2">🔧</span>
              Service Work
            </div>
            <div className="flex items-center text-gray-700">
              <span className="mr-2">📋</span>
              Contract Work
            </div>
            <div className="flex items-center text-gray-700">
              <span className="mr-2">🏛️</span>
              Departments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}