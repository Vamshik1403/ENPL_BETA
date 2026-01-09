'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch(
      `https://enplerp.electrohelps.in/customer-contact/by-email?email=${email}`,
    );

    if (!res.ok) {
      setError('Email not registered');
      setLoading(false);
      return;
    }

    const data = await res.json();
    if (!data) {
      setError('Email not registered');
      setLoading(false);
      return;
    }

    localStorage.setItem('customerSession', JSON.stringify(data));
    router.push('/customer/complaint');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-blue-900">
          Customer Login
        </h1>

        <input
          type="email"
          placeholder="Enter your registered email"
          className="w-full border px-4 py-2 rounded text-black"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
