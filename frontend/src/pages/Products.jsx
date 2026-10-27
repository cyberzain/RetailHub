import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { formatCurrency, api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

export default function Products() {
  const { products, reloadData, showToast } = useStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "Electronics",
    price: "",
    cost: "",
    taxRate: 18,
    stock: "",
    minStock: 5,
    barcode: "",
    sku: "",
    unit: "Pcs"
  });

  const categories = ["All", "Electronics", "Audio", "Accessories", "Apparel", "Footwear", "Groceries", "Personal Care"];

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "Electronics",
      price: "",
      cost: "",
      taxRate: 18,
      stock: "",
      minStock: 5,
      barcode: "",
      sku: "",
      unit: "Pcs"
    });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      price: p.price,
      cost: p.cost,
      taxRate: p.taxRate || 18,
      stock: p.stock,
      minStock: p.minStock || 5,
      barcode: p.barcode || "",
      sku: p.sku || "",
      unit: p.unit || "Pcs"
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      showToast("Please provide product name and price", "warning");
      return;
    }

    // Duplicate SKU check if new
    if (!editingProduct && formData.sku) {
      const exists = products.find((p) => p.sku?.toLowerCase() === formData.sku.toLowerCase());
      if (exists) {
        showToast(`SKU '${formData.sku}' is already assigned to ${exists.name}`, "error");
        return;
      }
    }

    const payload = {
      ...formData,
      price: Number(formData.price),
      cost: Number(formData.cost || 0),
      stock: Number(formData.stock || 0),
      minStock: Number(formData.minStock || 5),
      taxRate: Number(formData.taxRate || 18)
    };

    if (editingProduct) {
      await api.updateProduct(editingProduct.id, payload);
      showToast(`Updated product ${payload.name}`, "success");
    } else {
      await api.addProduct(payload);
      showToast(`Added product ${payload.name}`, "success");
    }

    await reloadData();
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    await api.deleteProduct(deleteCandidate.id);
    await reloadData();
    showToast(`Removed product ${deleteCandidate.name}`, "info");
    setDeleteCandidate(null);
  };

  const filtered = products.filter((p) => {
    const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top Filter and Add Bar */}
      <div className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "280px" }}>
          <div className="input-group" style={{ flex: 1 }}>
            <i className="fa-solid fa-magnifying-glass input-prefix"></i>
            <input
              type="text"
              className="form-control"
              placeholder="Search products by Name, SKU, or Barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: "180px", fontWeight: "600" }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="fa-solid fa-plus"></i> Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px 16px" }}>Product Name</th>
              <th style={{ padding: "12px 16px" }}>Category</th>
              <th style={{ padding: "12px 16px" }}>SKU & Barcode</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Cost</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Selling Price</th>
              <th style={{ padding: "12px 16px", textAlign: "center" }}>Stock</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const isOutOfStock = Number(p.stock) <= 0;
              const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= Number(p.minStock);

              return (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: "700", color: "var(--text-main)" }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Unit: {p.unit || "Pcs"}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="badge badge-neutral">{p.category}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "12px" }}>
                    <div>{p.sku || "—"}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{p.barcode || ""}</div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-muted)" }}>
                    {formatCurrency(p.cost)}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "800", color: "var(--primary)" }}>
                    {formatCurrency(p.price)}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span className={`badge ${isOutOfStock ? "badge-danger" : isLowStock ? "badge-warning" : "badge-success"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                      <button
                        onClick={() => openEditModal(p)}
                        className="btn btn-secondary"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                        title="Edit product"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => setDeleteCandidate(p)}
                        className="btn btn-secondary"
                        style={{ padding: "6px 10px", fontSize: "12px", color: "#ef4444" }}
                        title="Delete product"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Add/Edit Product */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Cost Price ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price ($) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Initial Stock Qty</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Threshold</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. SONY-XM5"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Barcode Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="e.g. 890123456791"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteCandidate && (
        <ConfirmModal
          title="Delete Product?"
          message={`Are you sure you want to remove '${deleteCandidate.name}'? This cannot be undone.`}
          confirmText="Yes, Delete Product"
          confirmType="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      )}
    </div>
  );
}
