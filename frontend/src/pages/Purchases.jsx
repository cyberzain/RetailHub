import React, { useState, useEffect } from "react";
import { formatCurrency, api } from "../services/api";
import { useStore } from "../context/StoreContext";

export default function Purchases() {
  const { showToast, reloadData } = useStore();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [totalCost, setTotalCost] = useState("");

  const loadData = async () => {
    const [p, s] = await Promise.all([api.getPurchases(), api.getSuppliers()]);
    setPurchases(p || []);
    setSuppliers(s || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReceiveStock = async (poId) => {
    await api.receivePurchaseStock(poId);
    await reloadData();
    await loadData();
    showToast(`Purchase order #${poId} received. Stock levels updated!`, "success");
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!selectedSupplier || !totalCost) return;
    await api.addPurchase({
      supplier: selectedSupplier,
      total: Number(totalCost),
      itemsCount: 10,
      status: "Ordered"
    });
    await loadData();
    showToast("Purchase Order created", "success");
    setShowAddModal(false);
    setSelectedSupplier("");
    setTotalCost("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Purchase Orders (Stock Inward)</h3>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Guarantees inventory updates only upon verified delivery</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <i className="fa-solid fa-plus"></i> New Purchase Order
        </button>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px 16px" }}>PO Number</th>
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Supplier</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Total Cost</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((po) => (
              <tr key={po.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--primary)" }}>#{po.id}</td>
                <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{po.date}</td>
                <td style={{ padding: "12px 16px", fontWeight: "600" }}>{po.supplier}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span className={`badge ${po.status === "Received" ? "badge-success" : po.status === "Ordered" ? "badge-info" : "badge-warning"}`}>
                    {po.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700" }}>{formatCurrency(po.total)}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  {po.status !== "Received" && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: "5px 10px", fontSize: "12px" }}
                      onClick={() => handleReceiveStock(po.id)}
                    >
                      <i className="fa-solid fa-box-open"></i> Receive Stock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h3>Draft Purchase Order</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleCreatePO}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <select
                    className="form-control"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated PO Total ($) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
