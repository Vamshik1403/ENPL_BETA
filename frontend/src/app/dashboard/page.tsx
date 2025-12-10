"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [siteCount, setSiteCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  const [loading, setLoading] = useState(true);

  // Fetch Counts
  const fetchCounts = async () => {
    try {
      const [sitesRes, custRes, taskRes] = await Promise.all([
        fetch("http://localhost:8000/sites"),
        fetch("http://localhost:8000/address-book"),
        fetch("http://localhost:8000/task"),
      ]);

      const sitesData = await sitesRes.json();
      const custData = await custRes.json();
      const taskData = await taskRes.json();

      setSiteCount(Array.isArray(sitesData) ? sitesData.length : 0);
      setCustomerCount(Array.isArray(custData) ? custData.length : 0);
      setTaskCount(Array.isArray(taskData) ? taskData.length : 0);
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
        <p className="text-gray-600">Summary of system information</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Sites" value={siteCount} color="#2563EB" />
        <StatCard title="Total Customers" value={customerCount} color="#059669" />
        <StatCard title="Total Tasks" value={taskCount} color="#D97706" />
      </div>

      {/* Optional: Add more sections later */}
    </div>
  );
}
