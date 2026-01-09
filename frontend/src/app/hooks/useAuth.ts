"use client";

import { useEffect, useState } from "react";

type UserType = "SUPERADMIN" | "ADMIN" | "MANAGER" | "EXECUTIVE";

interface LoginResponse {
  access_token: string;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [fullName, setFullName] = useState<string>("User");

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Login
      const res = await fetch("https://enplerp.electrohelps.in/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const msg = await res.json();
        setError(msg.message || "Invalid credentials");
        setLoading(false);
        return false;
      }

      const data: LoginResponse = await res.json();

      // Save token
      localStorage.setItem("access_token", data.access_token);

      // 2️⃣ Fetch users list
      const usersRes = await fetch("https://enplerp.electrohelps.in/auth/users", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      const users = await usersRes.json();

      // 3️⃣ Find logged user
      const found = users.find((u: any) => u.username === username);

      if (!found) {
        setError("User not found in the system");
        return false;
      }

      // 4️⃣ Store in localStorage
      localStorage.setItem("userId", String(found.id));
      localStorage.setItem("fullName", found.fullName);
      localStorage.setItem("userType", found.userType);

      // 5️⃣ set state for UI
      setUserId(found.id);
      setUserType(found.userType);
      setFullName(found.fullName);

      return true;
    } catch (err) {
      setError("Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error, userId, userType, fullName };
};
