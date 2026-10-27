import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ToastContainer from "./components/ToastContainer";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Suppliers from "./pages/Suppliers";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import Staff from "./pages/Staff";
import Settings from "./pages/Settings";
import AIInsights from "./pages/AIInsights";

export default function App() {
  const { user, isAuthenticated, isSalesperson } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hash-based routing to ensure 0 reload 404s
  const [currentTab, setCurrentTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return hash || (isSalesperson ? "pos" : "dashboard");
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setCurrentTab(hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (newTab) => {
    setCurrentTab(newTab);
    window.location.hash = newTab;
  };

  // If user is not authenticated, render Login
  if (!isAuthenticated || !user) {
    return (
      <>
        <Login setTab={handleTabChange} />
        <ToastContainer />
      </>
    );
  }

  const renderActivePage = () => {
    switch (currentTab) {
      case "pos":
        return <POS />;
      case "dashboard":
        return <Dashboard setTab={handleTabChange} />;
      case "products":
        return <Products />;
      case "inventory":
        return <Inventory />;
      case "customers":
        return <Customers />;
      case "sales":
        return <Sales />;
      case "purchases":
        return <Purchases />;
      case "suppliers":
        return <Suppliers />;
      case "reports":
        return <Reports />;
      case "expenses":
        return <Expenses />;
      case "staff":
        return <Staff />;
      case "settings":
        return <Settings />;
      case "ai-insights":
        return <AIInsights />;
      default:
        return isSalesperson ? <POS /> : <Dashboard setTab={handleTabChange} />;
    }
  };

  return (
    <div className="app">
      <Sidebar
        currentTab={currentTab}
        setTab={handleTabChange}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main className="main-content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar currentTab={currentTab} setSidebarOpen={setSidebarOpen} />
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {renderActivePage()}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
