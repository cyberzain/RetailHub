import React from "react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

export default function Sidebar({ currentTab, setTab, isOpen, setIsOpen }) {
  const { user, isSalesperson } = useAuth();
  const { backendOnline } = useStore();

  const handleNav = (tabKey) => {
    setTab(tabKey);
    if (window.innerWidth <= 992) {
      setIsOpen(false);
    }
  };

  const navItems = [
    { key: "pos", label: "POS Terminal", icon: "fa-cash-register", roles: ["Owner", "Manager", "Salesperson"], badge: "Live" },
    { key: "dashboard", label: "Dashboard", icon: "fa-chart-pie", roles: ["Owner", "Manager"] },
    { key: "products", label: "Products", icon: "fa-boxes-stacked", roles: ["Owner", "Manager"] },
    { key: "inventory", label: "Inventory", icon: "fa-warehouse", roles: ["Owner", "Manager"] },
    { key: "customers", label: "Customers & Accounts", icon: "fa-users", roles: ["Owner", "Manager", "Salesperson"] },
    { key: "sales", label: "Sales & Invoices", icon: "fa-file-invoice-dollar", roles: ["Owner", "Manager", "Salesperson"] },
    { key: "purchases", label: "Purchase Orders", icon: "fa-cart-flatbed", roles: ["Owner", "Manager"] },
    { key: "suppliers", label: "Suppliers", icon: "fa-truck-field", roles: ["Owner", "Manager"] },
    { key: "reports", label: "Reports & Closing", icon: "fa-chart-line", roles: ["Owner", "Manager"] },
    { key: "expenses", label: "Expenses & Register", icon: "fa-wallet", roles: ["Owner", "Manager"] },
    { key: "staff", label: "Staff & Shifts", icon: "fa-user-shield", roles: ["Owner", "Manager"] },
    { key: "ai-insights", label: "AI Insights", icon: "fa-wand-magic-sparkles", roles: ["Owner", "Manager"] },
    { key: "settings", label: "Store Settings", icon: "fa-gear", roles: ["Owner", "Manager"] }
  ];

  const allowedItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || "Owner")
  );

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div
            className="brand-logo"
            onClick={() => handleNav(isSalesperson ? "pos" : "dashboard")}
            style={{ cursor: "pointer" }}
          >
            <div className="brand-icon">
              <i className="fa-solid fa-store"></i>
            </div>
            <span>Retail</span>Hub
          </div>
        </div>

        <nav className="nav-menu">
          <div className="nav-section-title">Core Operations</div>
          {allowedItems.slice(0, 6).map((item) => (
            <a
              key={item.key}
              href={`#${item.key}`}
              className={`nav-link ${currentTab === item.key ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleNav(item.key);
              }}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className="badge badge-success"
                  style={{ marginLeft: "auto", fontSize: "10px", padding: "2px 7px" }}
                >
                  {item.badge}
                </span>
              )}
            </a>
          ))}

          {allowedItems.length > 6 && (
            <>
              <div className="nav-section-title" style={{ marginTop: "14px" }}>
                Management & Finance
              </div>
              {allowedItems.slice(6).map((item) => (
                <a
                  key={item.key}
                  href={`#${item.key}`}
                  className={`nav-link ${currentTab === item.key ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.key);
                  }}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.label}</span>
                </a>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
              padding: "6px 8px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)"
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "13px",
                color: "#ffffff"
              }}
            >
              {user?.name?.charAt(0) || "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: "700",
                  color: "#ffffff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {user?.name || "Staff"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--sidebar-text)" }}>
                {user?.role || "Team Member"}
              </div>
            </div>
          </div>

          <div className="backend-pill">
            <span className={`backend-dot ${backendOnline ? "connected" : ""}`}></span>
            <span>{backendOnline ? "PostgreSQL API Live" : "Local Engine Ready"}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
