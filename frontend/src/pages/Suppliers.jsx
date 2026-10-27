import React, { useState, useEffect } from "react";
import { formatCurrency, api } from "../services/api";
import { useStore } from "../context/StoreContext";

export default function Suppliers() {
  const { showToast } = useStore();
  const [suppliers, setSuppliers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const loadData = async () => {
    const s = await api.getSuppliers();
    setSuppliers(s || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    await api.addSupplier({ name, contactPerson, phone, email, balance: 0 });
    await loadData();
    showToast(`Added supplier ${name}`, "success");
    setShowAddModal(false);
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Suppliers & Vendor Accounts</h3>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Supplier contact details and accounts payable balances</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <i className="fa-solid fa-plus"></i> Add Supplier
        </button>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px 16px" }}>Company Name</th>
              <th style={{ padding: "12px 16px" }}>Contact Person</th>
              <th style={{ padding: "12px 16px" }}>Phone</th>
              <th style={{ padding: "12px 16px" }}>Email</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Payable Balance</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", fontWeight: "700" }}>{s.name}</td>
                <td style={{ padding: "12px 16px" }}>{s.contactPerson || "—"}</td>
                <td style={{ padding: "12px 16px" }}>{s.phone}</td>
                <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{s.email || "—"}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "800", color: s.balance > 0 ? "#b91c1c" : "#059669" }}>
                  {formatCurrency(s.balance)}
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
              <h3>Register New Supplier</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddSupplier}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Company / Supplier Name *</label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input type="text" className="form-control" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
