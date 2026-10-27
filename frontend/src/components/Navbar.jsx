import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import ConfirmModal from "./ConfirmModal";

export default function Navbar({ currentTab, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const { activeBranch, setActiveBranch, backendOnline } = useStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const titles = {
    pos: "POS Terminal & Fast Checkout",
    dashboard: "Store Overview & Executive Analytics",
    products: "Products & SKU Catalog",
    inventory: "Inventory & Stock Movement Ledger",
    customers: "Customers CRM & Khata Ledger",
    sales: "Sales History & Tax Invoices",
    purchases: "Purchase Orders & Receiving",
    suppliers: "Suppliers & Payables",
    reports: "Financial Reports & Closing",
    expenses: "Operating Expenses & Cash Register",
    staff: "Staff Management & Shift Roles",
    "ai-insights": "AI Business Assistant & Demand Forecast",
    settings: "Store Settings & Tax Profile"
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            className="mobile-toggle btn-icon"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>
              {titles[currentTab] || "RetailHub"}
            </h1>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Branch Selector */}
          <div className="branch-selector" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fa-solid fa-location-dot" style={{ color: "var(--primary)", fontSize: "13px" }}></i>
            <select
              value={activeBranch}
              onChange={(e) => setActiveBranch(e.target.value)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "12.5px",
                fontWeight: "600",
                background: "#ffffff",
                color: "var(--text-main)"
              }}
            >
              <option value="Main Flagship Store (Downtown)">Main Flagship (Downtown)</option>
              <option value="Metro Center Outlet (Uptown)">Metro Center Outlet (Uptown)</option>
            </select>
          </div>

          {/* Backend Connection Indicator */}
          <div
            className={`badge ${backendOnline ? "badge-success" : "badge-warning"}`}
            title={backendOnline ? "Connected to PostgreSQL REST API" : "Running on standalone offline engine"}
            style={{ cursor: "help" }}
          >
            <i className={`fa-solid ${backendOnline ? "fa-circle-check" : "fa-cloud"}`}></i>
            <span>{backendOnline ? "API Live" : "Offline Ready"}</span>
          </div>

          {/* User profile button & Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 10px",
                borderRadius: "8px",
                background: "#f1f5f9"
              }}
            >
              <span style={{ fontSize: "12.5px", fontWeight: "700" }}>{user?.name}</span>
              <span className="badge badge-neutral" style={{ fontSize: "10.5px" }}>{user?.role}</span>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "12px", gap: "6px" }}
              title="Sign Out"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span className="d-none-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <ConfirmModal
          title="Sign Out Confirmation"
          message="Are you sure you want to end your current session and sign out of RetailHub?"
          confirmText="Yes, Sign Out"
          confirmType="danger"
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
