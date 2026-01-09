'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';



/* Eye Icons */
const EyeOpen = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z" />
  </svg>
);

const EyeClosed = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.221-3.568M9.88 9.88a3 3 0 104.24 4.24" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M6.1 6.1L3 3m3.1 3.1L10.6 10.6m5.3 5.3L21 21m-5.1-5.1l3.4-3.4" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [loading, setLoading] = useState(false);

  const API_LOGIN = 'https://enplerp.electrohelps.in/backend/auth/login';

  const handleLogin = async (e: any) => {
  e.preventDefault();
  setErrorMsg('');
  setSuccessMsg('');
  setLoading(true);

  try {
    const res = await fetch(API_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.message || 'Invalid username or password');
      setLoading(false);
      return;
    }

    // Store token
    localStorage.setItem('token', data.access_token);

    // 🔥 FETCH USER DETAILS
    const userRes = await fetch("https://enplerp.electrohelps.in/backend/auth/users", {
      headers: {
        Authorization: `Bearer ${data.access_token}`
      }
    });

    const users = await userRes.json();

    // 🔥 FIND CURRENT USER
    const loggedUser = users.find((u: any) => u.username === username);

    if (loggedUser) {
      localStorage.setItem("fullName", loggedUser.fullName);
      localStorage.setItem("userType", loggedUser.userType);
      localStorage.setItem("userId", loggedUser.id.toString());
    }

    setSuccessMsg('Login successful! Redirecting...');
    setLoading(false);

    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);

  } catch (err) {
    setErrorMsg('Server error. Try again.');
    setLoading(false);
  }
};

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 border border-gray-200">

        {/* Page Title */}
        <h1 className="text-3xl font-bold text-blue-800 text-center mb-6">
          Login
        </h1>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-300">
            {errorMsg}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded bg-green-100 text-green-700 border border-green-300">
            {successMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>

          {/* Username */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="mb-4 relative">
            <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>

            <input
              type={showPass ? 'text' : 'password'}
              className="w-full px-4 py-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Eye Icon */}
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-600 hover:text-black"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>
      </div>
    </div>
  );
}
