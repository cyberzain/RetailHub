import React, { useState, useEffect } from "react";
import { formatCurrency, api } from "../services/api";
import { useStore } from "../context/StoreContext";

export default function Expenses() {
  const { showToast } = useStore();
  const [expenses, setExpenses] = useState([]);
  const [cashRegister, setCashRegister] = useState(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);

  // New expense form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Utilities");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("Cash");

  // Close register state
  const [countedCash, setCountedCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const loadData = async () => {
    const [e, r] = await Promise.all([api.getExpenses(), api.getCashRegister()]);
    setExpenses(e || []);
    setCashRegister(r);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;
    await api.addExpense({
      title,
      category,
      amount: Number(amount),
      paidBy
    });
    await loadData();
    showToast(`Recorded expense ${title}`, "success");
    setShowAddExpenseModal(false);
    setTitle("");
    setAmount("");
  };

  const handleCloseRegister = async (e) => {
    e.preventDefault();
    const counted = Number(countedCash);
    if (isNaN(counted)) return;

    const closed = await api.closeCashRegister(counted, closingNotes);
    setCashRegister(closed);
    showToast(`Register closed. Variance: ${formatCurrency(closed.variance)}`, "info");
    setShowCloseRegisterModal(false);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Cash Register Shift Reconciliation Card */}
      {cashRegister && (
        <div className="card" style={{ padding: "18px", borderLeft: `4px solid ${cashRegister.isOpen ? "#059669" : "#64748b"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Cash Register & Till Shift</h3>
                <span className={`badge ${cashRegister.isOpen ? "badge-success" : "badge-neutral"}`}>
                  {cashRegister.isOpen ? "Shift Open" : "Shift Closed"}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Opened at {cashRegister.openedAt} with Float of {formatCurrency(cashRegister.openingCash)}
              </span>
            </div>

            {cashRegister.isOpen && (
              <button
                className="btn btn-secondary"
                style={{ fontSize: "12.5px" }}
                onClick={() => {
                  setCountedCash(cashRegister.expectedCash.toString());
                  setShowCloseRegisterModal(true);
                }}
              >
                <i className="fa-solid fa-lock"></i> Close Shift & Reconcile
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginTop: "10px" }}>
            <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Opening Cash</div>
              <div style={{ fontSize: "16px", fontWeight: "800" }}>{formatCurrency(cashRegister.openingCash)}</div>
            </div>
            <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cash Sales</div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#059669" }}>+{formatCurrency(cashRegister.cashSales)}</div>
            </div>
            <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cash Expenses</div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#dc2626" }}>-{formatCurrency(cashRegister.cashExpenses)}</div>
            </div>
            <div style={{ padding: "10px", background: "#ecfdf5", borderRadius: "8px" }}>
              <div style={{ fontSize: "11px", color: "#065f46", fontWeight: "700" }}>Expected Cash in Drawer</div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#065f46" }}>{formatCurrency(cashRegister.expectedCash)}</div>
            </div>
            {!cashRegister.isOpen && (
              <div style={{ padding: "10px", background: cashRegister.variance === 0 ? "#f0fdf4" : "#fef2f2", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Counted Variance</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: cashRegister.variance === 0 ? "#059669" : "#dc2626" }}>
                  {formatCurrency(cashRegister.variance)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Store Operating Expenses</h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total logged: {formatCurrency(totalExpenses)}</span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddExpenseModal(true)}>
            <i className="fa-solid fa-plus"></i> Record Expense
          </button>
        </div>

        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px 16px" }}>Expense Title</th>
              <th style={{ padding: "12px 16px" }}>Category</th>
              <th style={{ padding: "12px 16px" }}>Date</th>
              <th style={{ padding: "12px 16px" }}>Paid Via</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", fontWeight: "700" }}>{exp.title}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span className="badge badge-neutral">{exp.category}</span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{exp.date}</td>
                <td style={{ padding: "12px 16px" }}>{exp.paidBy}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "800", color: "#dc2626" }}>
                  {formatCurrency(exp.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Expense */}
      {showAddExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowAddExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h3>Record Store Expense</h3>
              <button className="modal-close-btn" onClick={() => setShowAddExpenseModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Expense Title *</label>
                  <input type="text" className="form-control" placeholder="e.g. Electricity bill" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Utilities">Utilities</option>
                    <option value="Rent">Rent</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($) *</label>
                  <input type="number" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Paid By</label>
                  <select className="form-control" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                    <option value="Cash">Cash (from Till)</option>
                    <option value="Bank">Bank Transfer / ACH Wire</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Digital Wallet">Digital Wallet (PayPal / Apple Pay)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Shift Reconciliation */}
      {showCloseRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowCloseRegisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h3>Close Register & Shift Reconciliation</h3>
              <button className="modal-close-btn" onClick={() => setShowCloseRegisterModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleCloseRegister}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", fontSize: "13px" }}>
                  <div>Expected Drawer Cash: <strong>{formatCurrency(cashRegister.expectedCash)}</strong></div>
                </div>
                <div className="form-group">
                  <label className="form-label">Physical Cash Counted in Drawer ($) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    required
                    style={{ fontSize: "16px", fontWeight: "700" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Closing Notes / Discrepancy Reason</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="e.g. Balanced, or $50 short due to denomination change"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCloseRegisterModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm & Close Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
