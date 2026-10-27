import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { formatCurrency, api } from "../services/api";

export default function Sales() {
  const { sales, reloadData, showToast } = useStore();

  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnCandidate, setReturnCandidate] = useState(null);
  const [returnReason, setReturnReason] = useState("Customer Return");

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!returnCandidate) return;

    const res = await api.processReturn(
      returnCandidate.id,
      returnCandidate.items || [],
      returnCandidate.total,
      returnReason
    );

    if (res.success) {
      showToast(`Processed refund for #${returnCandidate.id}. Items restocked.`, "success");
      await reloadData();
      setReturnCandidate(null);
    } else {
      showToast(res.message || "Could not process return", "error");
    }
  };

  const filtered = sales.filter(
    (s) =>
      s.id?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Search Header */}
      <div className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="input-group" style={{ maxWidth: "360px", flex: 1 }}>
          <i className="fa-solid fa-magnifying-glass input-prefix"></i>
          <input
            type="text"
            className="form-control"
            placeholder="Search by invoice number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px 16px" }}>Invoice #</th>
              <th style={{ padding: "12px 16px" }}>Date & Time</th>
              <th style={{ padding: "12px 16px" }}>Customer</th>
              <th style={{ padding: "12px 16px" }}>Payment Method</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Total</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--primary)" }}>
                  #{s.id}
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>
                  {s.date} {s.time || ""}
                </td>
                <td style={{ padding: "12px 16px", fontWeight: "600" }}>{s.customer}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span className="badge badge-neutral">{s.paymentMethod}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span className={`badge ${s.status === "Paid" ? "badge-success" : "badge-warning"}`}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "800" }}>
                  {formatCurrency(s.total)}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                      onClick={() => setSelectedSale(s)}
                      title="View Receipt"
                    >
                      <i className="fa-solid fa-receipt"></i>
                    </button>
                    {s.status === "Paid" && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "12px", color: "#b91c1c" }}
                        onClick={() => setReturnCandidate(s)}
                        title="Return / Refund"
                      >
                        <i className="fa-solid fa-arrow-rotate-left"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Receipt Modal */}
      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="modal-header no-print">
              <h3>Invoice #{selectedSale.id}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedSale(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body printable-receipt" style={{ fontFamily: "monospace", fontSize: "13px" }}>
              <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <div style={{ fontWeight: "800", fontSize: "16px" }}>RETAILHUB STORE</div>
                <div>Suite 104, West Commerce Blvd, New York, NY 10001</div>
                <div>Date: {selectedSale.date} | Cashier: {selectedSale.cashier || "Staff"}</div>
              </div>

              <div style={{ borderTop: "1px dashed #666", borderBottom: "1px dashed #666", padding: "8px 0", margin: "10px 0" }}>
                {selectedSale.items?.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span>{it.qty}x {it.name}</span>
                    <span>{formatCurrency(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>GST (18%):</span>
                <span>{formatCurrency(selectedSale.tax)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "800", borderTop: "1px solid #000", marginTop: "6px", paddingTop: "6px" }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(selectedSale.total)}</span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "12px" }}>
                Method: {selectedSale.paymentMethod} • Status: {selectedSale.status}
              </div>
            </div>
            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setSelectedSale(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return & Refund Modal */}
      {returnCandidate && (
        <div className="modal-overlay" onClick={() => setReturnCandidate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h3>Process Return & Refund</h3>
              <button className="modal-close-btn" onClick={() => setReturnCandidate(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleProcessReturn}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                  Processing this return will issue a refund of <strong>{formatCurrency(returnCandidate.total)}</strong> to {returnCandidate.customer} and automatically restock all line items into inventory.
                </p>

                <div className="form-group">
                  <label className="form-label">Return Reason *</label>
                  <select
                    className="form-control"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  >
                    <option value="Customer Return">Customer Return (Change of mind)</option>
                    <option value="Defective / Damaged Item">Defective / Damaged Item</option>
                    <option value="Wrong Item Dispatched">Wrong Item Dispatched</option>
                    <option value="Billing Error">Billing Error</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReturnCandidate(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626" }}>
                  Confirm Return & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
