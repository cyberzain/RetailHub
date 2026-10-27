import React, { useState, useEffect } from "react";
import { useStore } from "../context/StoreContext";
import { api } from "../services/api";

export default function Inventory() {
  const { products, reloadData, showToast } = useStore();
  const [movements, setMovements] = useState([]);
  const [adjustCandidate, setAdjustCandidate] = useState(null);
  const [newCount, setNewCount] = useState("");
  const [reason, setReason] = useState("Physical Audit Count");

  const loadMovements = async () => {
    const list = await api.getStockMovements();
    setMovements(list || []);
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const openAdjustModal = (p) => {
    setAdjustCandidate(p);
    setNewCount(p.stock.toString());
    setReason("Physical Audit Count");
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustCandidate) return;
    const count = Number(newCount);
    if (isNaN(count) || count < 0) {
      showToast("Stock quantity cannot be negative", "warning");
      return;
    }

    await api.adjustStock(adjustCandidate.id, count, reason);
    await reloadData();
    await loadMovements();
    showToast(`Updated stock for ${adjustCandidate.name} to ${count}`, "success");
    setAdjustCandidate(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Inventory Stock Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Live Inventory Stock Levels</h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Current verified on-hand inventory</span>
          </div>
        </div>

        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "10px 16px" }}>Product</th>
              <th style={{ padding: "10px 16px" }}>Category</th>
              <th style={{ padding: "10px 16px", textAlign: "center" }}>Min Threshold</th>
              <th style={{ padding: "10px 16px", textAlign: "center" }}>Current On-Hand</th>
              <th style={{ padding: "10px 16px", textAlign: "right" }}>Stock Adjustment</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isOutOfStock = Number(p.stock) <= 0;
              const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= Number(p.minStock);

              return (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px", fontWeight: "600" }}>{p.name}</td>
                  <td style={{ padding: "10px 16px" }}>{p.category}</td>
                  <td style={{ padding: "10px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                    {p.minStock} {p.unit}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <span className={`badge ${isOutOfStock ? "badge-danger" : isLowStock ? "badge-warning" : "badge-success"}`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => openAdjustModal(p)}
                    >
                      <i className="fa-solid fa-sliders"></i> Adjust
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stock Movement Audit Ledger */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Stock Movement Audit Ledger</h3>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Immutable audit trail of all inventory events (Sales, POs, Returns, Adjustments)</span>
        </div>

        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "10px 16px" }}>Date</th>
              <th style={{ padding: "10px 16px" }}>Product</th>
              <th style={{ padding: "10px 16px" }}>Type</th>
              <th style={{ padding: "10px 16px", textAlign: "center" }}>Quantity</th>
              <th style={{ padding: "10px 16px" }}>Reference</th>
              <th style={{ padding: "10px 16px" }}>Logged By</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 16px", color: "var(--text-muted)" }}>{m.date}</td>
                <td style={{ padding: "10px 16px", fontWeight: "600" }}>{m.productName}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span className={`badge ${m.type === "IN" ? "badge-success" : m.type === "OUT" ? "badge-danger" : "badge-info"}`}>
                    {m.type}
                  </span>
                </td>
                <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: "700" }}>
                  {m.type === "OUT" ? `-${m.qty}` : `+${m.qty}`}
                </td>
                <td style={{ padding: "10px 16px", color: "var(--text-muted)" }}>{m.reference || "—"}</td>
                <td style={{ padding: "10px 16px" }}>{m.by || "System"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adjustment Modal */}
      {adjustCandidate && (
        <div className="modal-overlay" onClick={() => setAdjustCandidate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h3>Audit Stock Adjustment</h3>
              <button className="modal-close-btn" onClick={() => setAdjustCandidate(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700" }}>{adjustCandidate.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Current Count: {adjustCandidate.stock} {adjustCandidate.unit}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Verified Quantity *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newCount}
                    onChange={(e) => setNewCount(e.target.value)}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Reason *</label>
                  <select
                    className="form-control"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="Physical Audit Count">Physical Audit Count</option>
                    <option value="Damaged / Broken Goods">Damaged / Broken Goods</option>
                    <option value="Supplier Stock Inward">Supplier Stock Inward</option>
                    <option value="Stock Write-off">Stock Write-off</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustCandidate(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
