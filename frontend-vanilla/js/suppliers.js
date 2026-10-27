/**
 * RetailHub - Suppliers Controller
 */

let suppliersList = [];

async function loadSuppliers() {
  suppliersList = await api.getSuppliers();
  const purchases = await api.getPurchases();

  const totalOwed = suppliersList.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
  
  const countEl = document.getElementById("supCount");
  if (countEl) countEl.textContent = suppliersList.length;

  const owedEl = document.getElementById("supTotalOwed");
  if (owedEl) owedEl.textContent = formatCurrency(totalOwed);

  const poCountEl = document.getElementById("supOrdersCount");
  if (poCountEl) poCountEl.textContent = `${purchases.length} Orders`;

  filterSuppliers();
}

function filterSuppliers() {
  const query = (document.getElementById("supplierSearch")?.value || "").toLowerCase().trim();

  const filtered = suppliersList.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.contactPerson.toLowerCase().includes(query) ||
    (s.phone && s.phone.includes(query)) ||
    (s.email && s.email.toLowerCase().includes(query))
  );

  renderSuppliersTable(filtered);
}

function renderSuppliersTable(suppliers) {
  const tbody = document.getElementById("suppliersTableBody");
  if (!tbody) return;

  if (suppliers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-truck-field"></i></div>
            <div class="empty-title">No vendors found</div>
            <div class="empty-desc">Add your wholesale distributors to track orders and payables.</div>
            <button class="btn btn-primary btn-sm" onclick="openSupplierModal()">+ Add Supplier</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = suppliers.map(s => {
    const balance = Number(s.balance || 0);

    return `
      <tr>
        <td>
          <div style="font-weight: 700; font-size: 14px;">${s.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Vendor ID: ${s.id}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${s.contactPerson}</div>
        </td>
        <td>
          <div><i class="fa-solid fa-phone" style="font-size: 11px; color: var(--text-subtle);"></i> ${s.phone}</div>
          <div style="font-size: 12px; color: var(--text-muted);"><i class="fa-solid fa-envelope" style="font-size: 11px; color: var(--text-subtle);"></i> ${s.email || '—'}</div>
        </td>
        <td>${s.address || 'India'}</td>
        <td>
          <strong style="color: ${balance > 0 ? 'var(--danger)' : 'var(--success)'};">
            ${formatCurrency(balance)}
          </strong>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="settleBalance('${s.id}')">
            <i class="fa-solid fa-money-bill-transfer"></i> Settle
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function openSupplierModal() {
  document.getElementById("supName").value = "";
  document.getElementById("supPerson").value = "";
  document.getElementById("supPhone").value = "";
  document.getElementById("supEmail").value = "";
  document.getElementById("supAddress").value = "";
  document.getElementById("supBalance").value = "0";
  openModal("supplierModal");
}

async function saveSupplier(e) {
  e.preventDefault();
  const newSupplier = {
    name: document.getElementById("supName").value.trim(),
    contactPerson: document.getElementById("supPerson").value.trim(),
    phone: document.getElementById("supPhone").value.trim(),
    email: document.getElementById("supEmail").value.trim(),
    address: document.getElementById("supAddress").value.trim(),
    balance: Number(document.getElementById("supBalance").value) || 0
  };

  await api.addSupplier(newSupplier);
  showToast("Supplier registered successfully!", "success");
  closeModal("supplierModal");
  await loadSuppliers();
}

function settleBalance(id) {
  const sup = suppliersList.find(s => s.id === id);
  if (!sup) return;

  if (sup.balance <= 0) {
    return showToast("Supplier has zero outstanding balance!", "info");
  }

  const amt = prompt(`Enter payment amount to settle for ${sup.name}:`, sup.balance);
  if (amt !== null && !isNaN(amt) && Number(amt) > 0) {
    sup.balance = Math.max(0, sup.balance - Number(amt));
    const all = api.getSuppliers();
    const stored = JSON.parse(localStorage.getItem("retailhub_suppliers") || "[]");
    const idx = stored.findIndex(s => s.id === id);
    if (idx !== -1) {
      stored[idx].balance = sup.balance;
      localStorage.setItem("retailhub_suppliers", JSON.stringify(stored));
    }
    showToast(`Payment of ${formatCurrency(amt)} recorded!`, "success");
    loadSuppliers();
  }
}

document.addEventListener("DOMContentLoaded", loadSuppliers);
