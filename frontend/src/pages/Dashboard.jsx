import React from "react";
import { useStore } from "../context/StoreContext";
import { formatCurrency } from "../services/api";

export default function Dashboard({ setTab }) {
  const { products, sales, customers } = useStore();

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCost = sales.reduce((sum, s) => sum + (s.costTotal || s.total * 0.7), 0);
  const grossProfit = Math.max(0, totalSalesRevenue - totalCost);
  const totalOutstandingCredit = customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);
  const lowStockItems = products.filter((p) => Number(p.stock) <= Number(p.minStock));

  const kpis = [
    {
      label: "Total Sales Revenue",
      value: formatCurrency(totalSalesRevenue),
      icon: "fa-dollar-sign",
      color: "#059669",
      sub: `${sales.length} transactions recorded`
    },
    {
      label: "Estimated Gross Profit",
      value: formatCurrency(grossProfit),
      icon: "fa-chart-pie",
      color: "#2563eb",
      sub: "Average ~28% margin"
    },
    {
      label: "Khata Credit Receivables",
      value: formatCurrency(totalOutstandingCredit),
      icon: "fa-book-bookmark",
      color: "#d97706",
      sub: "Customer dues pending"
    },
    {
      label: "Active Products in Store",
      value: products.length,
      icon: "fa-boxes-stacked",
      color: "#7c3aed",
      sub: `${lowStockItems.length} low stock warnings`
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: `${kpi.color}15`,
                color: kpi.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px"
              }}
            >
              <i className={`fa-solid ${kpi.icon}`}></i>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)", marginTop: "2px" }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                {kpi.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
          ⚡ Fast Operations & Shortcuts
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button className="btn btn-primary" onClick={() => setTab("pos")} style={{ padding: "10px 18px", fontSize: "13px" }}>
            <i className="fa-solid fa-cash-register"></i> Open POS Terminal
          </button>
          <button className="btn btn-secondary" onClick={() => setTab("products")} style={{ padding: "10px 18px", fontSize: "13px" }}>
            <i className="fa-solid fa-plus"></i> Add New Product
          </button>
          <button className="btn btn-secondary" onClick={() => setTab("inventory")} style={{ padding: "10px 18px", fontSize: "13px" }}>
            <i className="fa-solid fa-warehouse"></i> Inventory Stock Audit
          </button>
          <button className="btn btn-secondary" onClick={() => setTab("customers")} style={{ padding: "10px 18px", fontSize: "13px" }}>
            <i className="fa-solid fa-users"></i> Khata Credit Ledger
          </button>
          <button className="btn btn-secondary" onClick={() => setTab("reports")} style={{ padding: "10px 18px", fontSize: "13px" }}>
            <i className="fa-solid fa-file-invoice"></i> Financial Reports
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Sales & Low-Stock Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Recent Transactions */}
        <div className="card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Recent Transactions</h3>
            <button
              onClick={() => setTab("sales")}
              style={{ border: "none", background: "transparent", color: "var(--primary)", fontSize: "12.5px", fontWeight: "700", cursor: "pointer" }}
            >
              View All Sales →
            </button>
          </div>

          <table className="data-table" style={{ width: "100%", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Invoice</th>
                <th style={{ padding: "10px" }}>Customer</th>
                <th style={{ padding: "10px" }}>Method</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 6).map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px", fontWeight: "700", color: "var(--primary)" }}>
                    #{s.id}
                  </td>
                  <td style={{ padding: "10px" }}>{s.customer}</td>
                  <td style={{ padding: "10px" }}>
                    <span className="badge badge-neutral">{s.paymentMethod}</span>
                  </td>
                  <td style={{ padding: "10px", textAlign: "right", fontWeight: "800" }}>
                    {formatCurrency(s.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low-Stock Warnings */}
        <div className="card" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#b91c1c" }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "6px" }}></i>
              Low Stock Warnings
            </h3>
            <span className="badge badge-danger">{lowStockItems.length}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {lowStockItems.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                All inventory levels are healthy!
              </div>
            ) : (
              lowStockItems.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#991b1b" }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "#b91c1c" }}>
                      Min: {p.minStock} {p.unit}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="badge badge-danger" style={{ fontWeight: "800" }}>
                      {p.stock} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
