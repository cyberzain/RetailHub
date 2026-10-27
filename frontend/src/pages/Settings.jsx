import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useStore } from "../context/StoreContext";

export default function Settings() {
  const { showToast } = useStore();
  const [settings, setSettings] = useState({
    shopName: "",
    shopTagline: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
    invoicePrefix: "INV-",
    receiptFooter: ""
  });

  useEffect(() => {
    const load = async () => {
      const s = await api.getSettings();
      if (s) setSettings(s);
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await api.saveSettings(settings);
    showToast("Store settings saved successfully", "success");
  };

  return (
    <div style={{ maxWidth: "720px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "17px", fontWeight: "700" }}>Store Profile & Tax Configuration</h3>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Store Trade Name *</label>
            <input
              type="text"
              className="form-control"
              value={settings.shopName}
              onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tagline / Business Subtitle</label>
            <input
              type="text"
              className="form-control"
              value={settings.shopTagline}
              onChange={(e) => setSettings({ ...settings, shopTagline: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">GSTIN / Tax ID Number</label>
              <input
                type="text"
                className="form-control"
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Number Prefix</label>
              <input
                type="text"
                className="form-control"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-control"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Official Store Email</label>
              <input
                type="email"
                className="form-control"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Store Physical Address</label>
            <textarea
              className="form-control"
              rows="2"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Receipt Footer Note</label>
            <input
              type="text"
              className="form-control"
              value={settings.receiptFooter}
              onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 24px" }}>
              <i className="fa-solid fa-floppy-disk"></i> Save Store Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
