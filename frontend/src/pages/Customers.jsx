import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { formatCurrency, api } from "../services/api";

export default function Customers() {
  const { customers, reloadData, showToast } = useStore();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [whatsappConfirmCustomer, setWhatsappConfirmCustomer] = useState(null);

  // New customer form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    await api.addCustomer({ name, phone, email });
    await reloadData();
    showToast(`Registered customer ${name}`, "success");
    setShowAddModal(false);
    setName("");
    setPhone("");
    setEmail("");
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      showToast("Please enter a valid payment amount", "warning");
      return;
    }
    await api.recordKhataPayment(paymentCustomer.id, amt);
    await reloadData();
    showToast(`Recorded payment of ${formatCurrency(amt)} for ${paymentCustomer.name}`, "success");
    setPaymentCustomer(null);
    setPayAmount("");
  };

  const handleTriggerWhatsApp = () => {
    if (!whatsappConfirmCustomer) return;
    const cleanPhone = whatsappConfirmCustomer.phone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Dear ${whatsappConfirmCustomer.name}, this is a payment notification from RetailHub regarding your outstanding account balance of ${formatCurrency(whatsappConfirmCustomer.creditBalance)}. Thank you!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
    setWhatsappConfirmCustomer(null);
    showToast("WhatsApp reminder link generated", "info");
  };

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top search & Add Customer */}
      <div className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div className="input-group" style={{ maxWidth: "360px", flex: 1 }}>
          <i className="fa-solid fa-magnifying-glass input-prefix"></i>
          <input
            type="text"
            className="form-control"
            placeholder="Search customers by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <i className="fa-solid fa-user-plus"></i> New Customer
        </button>
      </div>

      {/* Customers Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px 16px" }}>Customer Name</th>
              <th style={{ padding: "12px 16px" }}>Phone & Contact</th>
              <th style={{ padding: "12px 16px", textAlign: "center" }}>Loyalty Points</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Total Spend</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Credit Balance</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: "700" }}>{c.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.visits} store visits</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div>{c.phone}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.email || "—"}</div>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <span className="badge badge-info">{c.points || 0} pts</span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700" }}>
                  {formatCurrency(c.totalSpent)}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  {c.creditBalance > 0 ? (
                    <span style={{ fontWeight: "800", color: "#b91c1c" }}>
                      {formatCurrency(c.creditBalance)}
                    </span>
                  ) : (
                    <span style={{ color: "#059669", fontWeight: "600" }}>Clear ($0)</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                    {c.creditBalance > 0 && (
                      <>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "5px 10px", fontSize: "11.5px" }}
                          onClick={() => {
                            setPaymentCustomer(c);
                            setPayAmount(c.creditBalance.toString());
                          }}
                        >
                          Settle Account
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "5px 10px", fontSize: "11.5px", color: "#16a34a" }}
                          onClick={() => setWhatsappConfirmCustomer(c)}
                          title="Send WhatsApp Reminder"
                        >
                          <i className="fa-brands fa-whatsapp"></i>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Customer</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Payment Modal */}
      {paymentCustomer && (
        <div className="modal-overlay" onClick={() => setPaymentCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3>Settle Customer Credit Balance</h3>
              <button className="modal-close-btn" onClick={() => setPaymentCustomer(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "12px", borderRadius: "10px", background: "#f8fafc" }}>
                  <div style={{ fontWeight: "700" }}>{paymentCustomer.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Phone: {paymentCustomer.phone}</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#b91c1c", marginTop: "4px" }}>
                    Total Outstanding: {formatCurrency(paymentCustomer.creditBalance)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount Paid ($) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    max={paymentCustomer.creditBalance}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPaymentCustomer(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Reminder Confirmation Modal */}
      {whatsappConfirmCustomer && (
        <div className="modal-overlay" onClick={() => setWhatsappConfirmCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h3>Confirm WhatsApp Reminder</h3>
              <button className="modal-close-btn" onClick={() => setWhatsappConfirmCustomer(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: "0 0 12px 0" }}>
                You are about to open WhatsApp to send a polite payment reminder to:
              </p>
              <div style={{ padding: "12px", borderRadius: "10px", background: "#f8fafc", marginBottom: "12px" }}>
                <div style={{ fontWeight: "700" }}>{whatsappConfirmCustomer.name} ({whatsappConfirmCustomer.phone})</div>
                <div style={{ color: "#b91c1c", fontWeight: "800" }}>Outstanding: {formatCurrency(whatsappConfirmCustomer.creditBalance)}</div>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Note: RetailHub never sends unsolicited spam messages. You can preview the message before sending in WhatsApp.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setWhatsappConfirmCustomer(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleTriggerWhatsApp} style={{ background: "#16a34a", borderColor: "#16a34a" }}>
                <i className="fa-brands fa-whatsapp"></i> Open WhatsApp Web
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
