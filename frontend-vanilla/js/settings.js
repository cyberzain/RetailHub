/**
 * RetailHub - Settings & Configuration Controller
 */

async function initSettings() {
  const settings = await api.getSettings();

  document.getElementById("storeName").value = settings.storeName || "RetailHub Store";
  document.getElementById("gstin").value = settings.gstin || "";
  document.getElementById("storePhone").value = settings.phone || "";
  document.getElementById("storeAddress").value = settings.address || "";
  document.getElementById("receiptFooter").value = settings.receiptFooter || "";
  document.getElementById("currencySymbol").value = settings.currencySymbol || "₹";
  document.getElementById("taxRate").value = settings.taxRate || 18;

  testBackendLink();
}

async function testBackendLink() {
  const statusBox = document.getElementById("connectionStatusBox");
  if (!statusBox) return;

  statusBox.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pinging Express backend at ${API_BASE}...`;

  const status = await api.checkBackend();
  if (status.online) {
    statusBox.innerHTML = `
      <div style="color: var(--success); font-weight: 600;">
        <i class="fa-solid fa-circle-check"></i> Connected to Backend: ${status.message}
      </div>
      <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">
        API endpoints at http://localhost:5000 are reachable. Frontend will sync seamlessly with collaborator endpoints.
      </div>
    `;
  } else {
    statusBox.innerHTML = `
      <div style="color: var(--warning); font-weight: 600;">
        <i class="fa-solid fa-circle-info"></i> Express Server Offline (Mock Mode Active)
      </div>
      <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">
        Your partner has not started http://localhost:5000 yet. Standalone Mock DB is active with complete functionality.
      </div>
    `;
  }
}

async function saveStoreSettings(e) {
  e.preventDefault();

  const newSettings = {
    storeName: document.getElementById("storeName").value.trim(),
    gstin: document.getElementById("gstin").value.trim(),
    phone: document.getElementById("storePhone").value.trim(),
    address: document.getElementById("storeAddress").value.trim(),
    receiptFooter: document.getElementById("receiptFooter").value.trim(),
    currencySymbol: document.getElementById("currencySymbol").value,
    taxRate: Number(document.getElementById("taxRate").value) || 18
  };

  await api.saveSettings(newSettings);
  showToast("Store preferences saved successfully!", "success");
}

function exportFullBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    products: JSON.parse(localStorage.getItem("retailhub_products") || "[]"),
    customers: JSON.parse(localStorage.getItem("retailhub_customers") || "[]"),
    suppliers: JSON.parse(localStorage.getItem("retailhub_suppliers") || "[]"),
    purchases: JSON.parse(localStorage.getItem("retailhub_purchases") || "[]"),
    sales: JSON.parse(localStorage.getItem("retailhub_sales") || "[]"),
    staff: JSON.parse(localStorage.getItem("retailhub_staff") || "[]"),
    settings: JSON.parse(localStorage.getItem("retailhub_settings") || "{}")
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `retailhub-full-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  showToast("Full store backup downloaded!", "success");
}

function resetToSampleData() {
  if (confirm("Reset all store data to clean sample demo dataset? Current custom entries will be refreshed.")) {
    api.resetDemoData();
    showToast("Store sample data refreshed!", "success");
    setTimeout(() => {
      window.location.reload();
    }, 700);
  }
}

document.addEventListener("DOMContentLoaded", initSettings);
