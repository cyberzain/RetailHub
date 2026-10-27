import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { formatCurrency } from "../services/api";

export default function Reports() {
  const { sales, products } = useStore();
  const [filterPeriod, setFilterPeriod] = useState("all");

  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCOGS = sales.reduce((sum, s) => sum + (s.costTotal || s.total * 0.7), 0);
  const grossProfit = Math.max(0, totalRevenue - totalCOGS);
  const totalTaxCollected = sales.reduce((sum, s) => sum + (s.tax || 0), 0);
  const estimatedExpenses = 84300; // Utilities, Rent, packaging
  const netProfit = grossProfit - estimatedExpenses;

  // Breakdown by payment method
  const methodMap = {};
  sales.forEach((s) => {
    const m = s.paymentMethod || "Cash";
    methodMap[m] = (methodMap[m] || 0) + s.total;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Filter Bar */}
      <div className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Financial Performance & Closing Reports</h3>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Distinguishes revenue, gross profit, and operating net profit</span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <select
            className="form-control"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            style={{ width: "160px", fontWeight: "600" }}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Current Month</option>
            <option value="all">All Time History</option>
          </select>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <i className="fa-solid fa-print"></i> Export / Print
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="card" style={{ padding: "18px", borderLeft: "4px solid #2563eb" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Gross Sales Revenue</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>{formatCurrency(totalRevenue)}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>All settled customer invoices</div>
        </div>

        <div className="card" style={{ padding: "18px", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Cost of Goods Sold (COGS)</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#d97706", marginTop: "4px" }}>{formatCurrency(totalCOGS)}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Supplier purchase inventory cost</div>
        </div>

        <div className="card" style={{ padding: "18px", borderLeft: "4px solid #059669" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Gross Profit</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>{formatCurrency(grossProfit)}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Margin: ~{totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0}%</div>
        </div>

        <div className="card" style={{ padding: "18px", borderLeft: "4px solid #7c3aed" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Estimated Net Profit</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: netProfit >= 0 ? "#7c3aed" : "#dc2626", marginTop: "4px" }}>{formatCurrency(netProfit)}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>After store expenses deduction</div>
        </div>
      </div>

      {/* Two Column: Payment Breakdown & Inventory Valuation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Payment Methods */}
        <div className="card" style={{ padding: "18px" }}>
          <h4 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "700" }}>Revenue by Payment Mode</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.entries(methodMap).map(([mode, amt]) => {
              const pct = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0;
              return (
                <div key={mode}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    <span>{mode}</span>
                    <span>{formatCurrency(amt)} ({pct}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", borderRadius: "999px" }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory Asset Valuation */}
        <div className="card" style={{ padding: "18px" }}>
          <h4 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "700" }}>Inventory Asset Valuation</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
              <span>Total Inventory Asset Value (At Cost):</span>
              <strong style={{ color: "var(--text-main)" }}>
                {formatCurrency(products.reduce((sum, p) => sum + (Number(p.cost) || 0) * (Number(p.stock) || 0), 0))}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
              <span>Retail Value of Current Stock (At Price):</span>
              <strong style={{ color: "var(--primary)" }}>
                {formatCurrency(products.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0))}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
              <span>Total GST Tax Collected:</span>
              <strong style={{ color: "#2563eb" }}>{formatCurrency(totalTaxCollected)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
