import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getCurrentUser());
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success) {
        setUser(res.user);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const verifyManagerPin = async (pin) => {
    return await api.verifyManagerPin(pin);
  };

  const isOwner = user?.role === "Owner";
  const isManager = user?.role === "Manager" || isOwner;
  const isSalesperson = user?.role === "Salesperson" || user?.role === "Cashier";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        verifyManagerPin,
        isOwner,
        isManager,
        isSalesperson,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
