import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";

export default function Staff() {
  const { showToast } = useStore();
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New staff form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Salesperson");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("0000");
  const [shift, setShift] = useState("Morning (09:00 - 17:00)");

  const loadStaff = async () => {
    const list = await api.getStaff();
    setStaffList(list || []);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    await api.createStaff({
      name,
      email,
      role,
      phone,
      pin,
      shift,
      status: "Active"
    });
    await loadStaff();
    showToast(`Created account for ${name} (${role})`, "success");
    setShowAddModal(false);
    setName("");
    setEmail("");
    setPhone("");
    setPin("0000");
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    await api.toggleStaffStatus(staffId, newStatus);
    await loadStaff();
    showToast(`Staff member status changed to ${newStatus}`, "info");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Staff Management & Shift Roles</h3>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Enforces Role-Based Access Control (Owner, Manager, Salesperson)</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <i className="fa-solid fa-user-plus"></i> Add Staff Member
        </button>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px 16px" }}>Employee Name</th>
              <th style={{ padding: "12px 16px" }}>Role</th>
              <th style={{ padding: "12px 16px" }}>Email & Contact</th>
              <th style={{ padding: "12px 16px" }}>Shift Schedule</th>
              <th style={{ padding: "12px 16px", textAlign: "center" }}>Manager PIN</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", fontWeight: "700" }}>{s.name}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span className={`badge ${s.role === "Owner" ? "badge-success" : s.role === "Manager" ? "badge-info" : "badge-neutral"}`}>
                    {s.role}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div>{s.email}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.phone || "—"}</div>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{s.shift || "Full-Time"}</td>
                <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "monospace", fontWeight: "700" }}>
                  {s.role === "Owner" || s.role === "Manager" ? s.pin || "1234" : "—"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span className={`badge ${s.status === "Active" ? "badge-success" : "badge-danger"}`}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  {s.id !== currentUser?.id && s.role !== "Owner" && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "12px", color: s.status === "Active" ? "#dc2626" : "#059669" }}
                      onClick={() => handleToggleStatus(s.id, s.status)}
                    >
                      {s.status === "Active" ? "Deactivate" : "Activate"}
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
              <h3>Add Staff Account</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="Salesperson">Salesperson</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manager PIN (4 digits)</label>
                    <input type="password" maxLength="4" className="form-control" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="0000" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Shift Timing</label>
                  <select className="form-control" value={shift} onChange={(e) => setShift(e.target.value)}>
                    <option value="Morning (09:00 - 17:00)">Morning (09:00 - 17:00)</option>
                    <option value="Evening (13:00 - 21:00)">Evening (13:00 - 21:00)</option>
                    <option value="Full-Time (09:00 - 21:00)">Full-Time (09:00 - 21:00)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Employee Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
