import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../context/StoreContext";
import { formatCurrency, api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

export default function POS() {
  const {
    products,
    customers,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    applyItemDiscount,
    applyItemNote,
    subtotal,
    tax,
    totalDiscount,
    grandTotal,
    totalItemCount,
    totalUnitCount,
    heldCarts,
    holdCurrentSale,
    resumeHeldSale,
    deleteHeldSale,
    selectedCustomer,
    setSelectedCustomer,
    completeSale,
    showToast,
    reloadData
  } = useStore();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);

  // Checkout modal state
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashTendered, setCashTendered] = useState("");
  const [splitCash, setSplitCash] = useState(0);
  const [splitDigital, setSplitDigital] = useState(0);

  // New customer form state
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");

  const searchInputRef = useRef(null);

  // Barcode USB Scanner Hardware Listener (< 50ms buffer)
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 60) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          const match = products.find(
            (p) =>
              p.barcode === buffer ||
              p.sku?.toLowerCase() === buffer.toLowerCase()
          );
          if (match) {
            addToCart(match);
            showToast(`Scanned: ${match.name}`, "success");
          } else {
            showToast(`Barcode not recognized: ${buffer}`, "warning");
          }
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }

      // Keyboard shortcuts
      if (e.key === "F1" || e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F8") {
        e.preventDefault();
        holdCurrentSale();
      } else if (e.key === "F10") {
        e.preventDefault();
        if (cart.length > 0) openCheckout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, cart]);

  const categories = ["All", "Electronics", "Audio", "Accessories", "Apparel", "Footwear", "Groceries", "Personal Care"];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.includes(q);
    return matchesCat && matchesSearch;
  });

  const openCheckout = () => {
    if (cart.length === 0) {
      showToast("Cart is empty", "warning");
      return;
    }
    setCashTendered(grandTotal.toString());
    setSplitCash(Math.round(grandTotal / 2));
    setSplitDigital(grandTotal - Math.round(grandTotal / 2));
    setShowCheckoutModal(true);
  };

  const changeDue = Math.max(0, (Number(cashTendered) || 0) - grandTotal);

  const handleFinishCheckout = async () => {
    const details = {
      cashTendered: Number(cashTendered) || grandTotal,
      changeDue: changeDue,
      splitCash: paymentMethod === "Split" ? splitCash : 0,
      splitDigital: paymentMethod === "Split" ? splitDigital : 0
    };

    const sale = await completeSale(paymentMethod, details);
    if (sale) {
      setLastCompletedSale(sale);
      setShowCheckoutModal(false);
      setShowReceiptModal(true);
    }
  };

  const handleAddNewCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) {
      showToast("Name and phone are required", "warning");
      return;
    }
    const c = await api.addCustomer({
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail
    });
    await reloadData();
    setSelectedCustomer(c);
    setShowCustomerModal(false);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustEmail("");
    showToast(`Added customer ${c.name}`, "success");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "20px", height: "calc(100vh - 85px)", boxSizing: "border-box" }}>
      {/* LEFT: Product catalog & search */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", overflowY: "hidden" }}>
        {/* Search bar & Category chips */}
        <div className="card" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div className="input-group" style={{ flex: 1 }}>
              <i className="fa-solid fa-barcode input-prefix" style={{ color: "var(--primary)" }}></i>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control"
                placeholder="Scan Barcode or Search product name, SKU... (F1)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setShowHeldModal(true)}
              style={{ position: "relative", whiteSpace: "nowrap" }}
            >
              <i className="fa-solid fa-pause"></i>
              Held Carts
              {heldCarts.length > 0 && (
                <span style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "#ffffff", borderRadius: "999px", padding: "2px 6px", fontSize: "10px", fontWeight: "700" }}>
                  {heldCarts.length}
                </span>
              )}
            </button>
          </div>

          {/* Category Chips */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: selectedCategory === cat ? "var(--primary)" : "var(--border)",
                  background: selectedCategory === cat ? "var(--primary)" : "#ffffff",
                  color: selectedCategory === cat ? "#ffffff" : "var(--text-main)",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", alignContent: "start", paddingRight: "4px" }}>
          {filteredProducts.map((p) => {
            const inCart = cart.find((i) => i.id === p.id);
            const isOutOfStock = Number(p.stock) <= 0;
            const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= Number(p.minStock);

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className="card"
                style={{
                  padding: "14px",
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  opacity: isOutOfStock ? 0.6 : 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: inCart ? "2px solid var(--primary)" : "1px solid var(--border)",
                  position: "relative",
                  transition: "transform 0.15s, box-shadow 0.15s"
                }}
              >
                {inCart && (
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "var(--primary)",
                      color: "#ffffff",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}
                  >
                    {inCart.qty}
                  </span>
                )}

                <div>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontSize: "16px", marginBottom: "8px" }}>
                    <i className={`fa-solid ${p.icon || "fa-box"}`}></i>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", lineHeight: 1.3, marginBottom: "4px" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    SKU: {p.sku || p.id}
                  </div>
                </div>

                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "14.5px", fontWeight: "800", color: "var(--primary)" }}>
                    {formatCurrency(p.price)}
                  </div>
                  <span className={`badge ${isOutOfStock ? "badge-danger" : isLowStock ? "badge-warning" : "badge-neutral"}`} style={{ fontSize: "10px" }}>
                    {isOutOfStock ? "Out of Stock" : `${p.stock} in stock`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout Summary */}
      <div className="card" style={{ display: "flex", flexDirection: "column", padding: "16px", height: "100%", boxSizing: "border-box" }}>
        {/* Customer Select Header */}
        <div style={{ paddingBottom: "12px", borderBottom: "1px solid var(--border)", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Customer (F2)
            </span>
            <button
              onClick={() => setShowCustomerModal(true)}
              style={{ border: "none", background: "transparent", color: "var(--primary)", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <i className="fa-solid fa-user-plus"></i> New Customer
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              className="form-control"
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              style={{ fontSize: "13px", fontWeight: "600" }}
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div style={{ marginTop: "8px", padding: "8px", borderRadius: "8px", background: "#f8fafc", fontSize: "11.5px", display: "flex", justifyContent: "space-between" }}>
              <span>Loyalty Points: <strong>{selectedCustomer.points || 0} pts</strong></span>
              <span style={{ color: selectedCustomer.creditBalance > 0 ? "#b91c1c" : "inherit" }}>
                Account Due: <strong>{formatCurrency(selectedCustomer.creditBalance)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Cart items list */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", margin: "auto", color: "var(--text-muted)" }}>
              <i className="fa-solid fa-basket-shopping" style={{ fontSize: "36px", marginBottom: "10px", opacity: 0.4 }}></i>
              <div style={{ fontSize: "14px", fontWeight: "600" }}>Cart is empty</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>Scan barcodes or click products to add</div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "#fdfdfd"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "6px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", maxWidth: "230px" }}>
                    {item.name}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", padding: "2px" }}
                    title="Remove item"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {/* Quantity control */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      onClick={() => updateCartQty(item.id, item.qty - 1)}
                      style={{ width: "24px", height: "24px", borderRadius: "6px", border: "1px solid var(--border)", background: "#ffffff", cursor: "pointer", fontWeight: "bold" }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateCartQty(item.id, e.target.value)}
                      style={{ width: "42px", height: "24px", textAlign: "center", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}
                      min="1"
                    />
                    <button
                      onClick={() => updateCartQty(item.id, item.qty + 1)}
                      style={{ width: "24px", height: "24px", borderRadius: "6px", border: "1px solid var(--border)", background: "#ffffff", cursor: "pointer", fontWeight: "bold" }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: "800", color: "var(--text-main)" }}>
                      {formatCurrency(item.price * item.qty - (item.discount || 0))}
                    </div>
                    {item.discount > 0 && (
                      <div style={{ fontSize: "11px", color: "#059669" }}>
                        - {formatCurrency(item.discount)} off
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout Actions */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "4px" }}>
            <span>Subtotal ({totalItemCount} items, {totalUnitCount} units)</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "4px" }}>
            <span>GST Tax (18% included)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          {totalDiscount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#059669", marginBottom: "4px" }}>
              <span>Total Discount</span>
              <span>- {formatCurrency(totalDiscount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "800", color: "var(--text-main)", margin: "8px 0 12px" }}>
            <span>Grand Total</span>
            <span style={{ color: "var(--primary)" }}>{formatCurrency(grandTotal)}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-secondary"
              disabled={cart.length === 0}
              style={{ fontSize: "12px", padding: "8px" }}
            >
              <i className="fa-solid fa-rotate-left"></i> Clear Cart
            </button>
            <button
              onClick={() => holdCurrentSale()}
              className="btn btn-secondary"
              disabled={cart.length === 0}
              style={{ fontSize: "12px", padding: "8px" }}
            >
              <i className="fa-solid fa-pause"></i> Hold (F8)
            </button>
          </div>

          <button
            onClick={openCheckout}
            className="btn btn-primary"
            disabled={cart.length === 0}
            style={{ width: "100%", padding: "14px", fontSize: "15px", fontWeight: "800", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <i className="fa-solid fa-bolt"></i> Pay & Checkout (F10)
          </button>
        </div>
      </div>

      {/* MODAL: Clear cart confirm */}
      {showClearConfirm && (
        <ConfirmModal
          title="Clear Shopping Cart?"
          message="Are you sure you want to remove all line items from the active cart?"
          confirmText="Yes, Clear Cart"
          confirmType="danger"
          onConfirm={() => {
            clearCart();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {/* MODAL: Held Carts */}
      {showHeldModal && (
        <div className="modal-overlay" onClick={() => setShowHeldModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Saved / Held Carts ({heldCarts.length})</h3>
              <button className="modal-close-btn" onClick={() => setShowHeldModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              {heldCarts.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)" }}>No held carts at this moment.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {heldCarts.map((h) => (
                    <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid var(--border)", borderRadius: "10px" }}>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "14px" }}>{h.customer}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          Saved at {h.savedAt} • {h.items?.length || 0} items
                        </div>
                        <div style={{ fontWeight: "800", color: "var(--primary)", marginTop: "4px" }}>
                          {formatCurrency(h.total)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          onClick={() => {
                            resumeHeldSale(h.id);
                            setShowHeldModal(false);
                          }}
                        >
                          Resume
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", fontSize: "12px", color: "#ef4444" }}
                          onClick={() => deleteHeldSale(h.id)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Customer */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Customer</h3>
              <button className="modal-close-btn" onClick={() => setShowCustomerModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddNewCustomer}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Customer Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ramesh Patel"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="ramesh@example.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustomerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Checkout & Payment Mode */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <h3>Complete Checkout & Billing</h3>
              <button className="modal-close-btn" onClick={() => setShowCheckoutModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: "center", padding: "12px", background: "#f8fafc", borderRadius: "12px", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Total Amount Due</div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--primary)" }}>{formatCurrency(grandTotal)}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Customer: <strong>{selectedCustomer?.name || "Walk-in Customer"}</strong>
                </div>
              </div>

              {/* Payment Methods */}
              <div style={{ marginBottom: "16px" }}>
                <label className="form-label" style={{ fontWeight: "700", marginBottom: "8px" }}>Select Payment Mode</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {["Cash", "Card", "Digital Wallet", "Store Credit", "Split"].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      style={{
                        padding: "10px 8px",
                        borderRadius: "10px",
                        border: "1.5px solid",
                        borderColor: paymentMethod === pm ? "var(--primary)" : "var(--border)",
                        background: paymentMethod === pm ? "#ecfdf5" : "#ffffff",
                        color: paymentMethod === pm ? "#065f46" : "var(--text-main)",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash tender & change due calculator */}
              {paymentMethod === "Cash" && (
                <div style={{ padding: "14px", borderRadius: "12px", background: "#f1f5f9", marginBottom: "16px" }}>
                  <label className="form-label" style={{ fontWeight: "700", fontSize: "13px" }}>Cash Received (Tendered)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    style={{ fontSize: "18px", fontWeight: "800" }}
                  />

                  {/* Quick cash denomination chips */}
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="badge badge-neutral"
                      onClick={() => setCashTendered(grandTotal.toFixed(2))}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      Exact (${grandTotal.toFixed(2)})
                    </button>
                    <button
                      type="button"
                      className="badge badge-neutral"
                      onClick={() => setCashTendered((Math.ceil(grandTotal / 50) * 50 || 50).toString())}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      Round $50
                    </button>
                    <button
                      type="button"
                      className="badge badge-neutral"
                      onClick={() => setCashTendered((Number(cashTendered || 0) + 20).toString())}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      +$20
                    </button>
                    <button
                      type="button"
                      className="badge badge-neutral"
                      onClick={() => setCashTendered((Number(cashTendered || 0) + 50).toString())}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      +$50
                    </button>
                    <button
                      type="button"
                      className="badge badge-neutral"
                      onClick={() => setCashTendered((Number(cashTendered || 0) + 100).toString())}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      +$100
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #cbd5e1", fontSize: "15px", fontWeight: "800" }}>
                    <span>Change Due to Return:</span>
                    <span style={{ color: changeDue > 0 ? "var(--primary)" : "var(--text-main)" }}>
                      {formatCurrency(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Split payment inputs */}
              {paymentMethod === "Split" && (
                <div style={{ padding: "14px", borderRadius: "12px", background: "#f1f5f9", marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="form-label">Cash Portion ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={splitCash}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setSplitCash(val);
                        setSplitDigital(Math.max(0, grandTotal - val));
                      }}
                    />
                  </div>
                  <div>
                    <label className="form-label">Digital/Card Portion ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={splitDigital}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setSplitDigital(val);
                        setSplitCash(Math.max(0, grandTotal - val));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleFinishCheckout} style={{ padding: "10px 24px", fontSize: "14px" }}>
                Confirm & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Printable Receipt & Invoice */}
      {showReceiptModal && lastCompletedSale && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="modal-header no-print">
              <h3>Sale Invoice Receipt</h3>
              <button className="modal-close-btn" onClick={() => setShowReceiptModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body printable-receipt" style={{ fontFamily: "monospace", fontSize: "13px", lineHeight: "1.4" }}>
              <div style={{ textAlign: "center", marginBottom: "14px" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "900" }}>RETAILHUB STORE</h2>
                <div>Suite 104, West Commerce Blvd, New York, NY 10001</div>
                <div>Tax ID / EIN: US-TAX-88990123</div>
                <div style={{ marginTop: "6px", fontSize: "11px", color: "#666" }}>
                  Invoice: #{lastCompletedSale.id} • {lastCompletedSale.date} {lastCompletedSale.time}
                </div>
              </div>

              <div style={{ borderTop: "1px dashed #999", borderBottom: "1px dashed #999", padding: "8px 0", margin: "10px 0" }}>
                {lastCompletedSale.items?.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>{it.qty}x {it.name}</span>
                    <span>{formatCurrency(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(lastCompletedSale.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>GST (18%):</span>
                <span>{formatCurrency(lastCompletedSale.tax)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", borderTop: "1px solid #333", marginTop: "6px", paddingTop: "6px" }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(lastCompletedSale.total)}</span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "12px" }}>
                Payment Mode: {lastCompletedSale.paymentMethod}
              </div>
              <div style={{ textAlign: "center", marginTop: "16px", fontSize: "11px", color: "#666" }}>
                Thank you for shopping with RetailHub!
              </div>
            </div>
            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
