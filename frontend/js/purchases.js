/**
 * RetailHub - Purchase Orders Controller
 */

let purchaseOrders = [];

async function loadPurchases() {
  purchaseOrders = await api.getPurchases();
  await loadSuppliersIntoDropdown();
  computePOStats();
  filterPurchases();
}

async function loadSuppliersIntoDropdown() {
  const select = document.getElementById("poSupplierSelect");
  if (!select) return;

  const suppliers = await api.getSuppliers();
  select.innerHTML = suppliers.map(s => `
    <option value="${s.name}">${s.name} (${s.address})</option>
  `).join("");
}

function computePOStats() {
  const totalSpend = purchaseOrders.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const received = purchaseOrders.filter(p => p.status === "Received").length;
  const pending = purchaseOrders.filter(p => p.status === "Pending" || p.status === "Ordered").length;

  const spendEl = document.getElementById("poTotalSpend");
  if (spendEl) spendEl.textContent = formatCurrency(totalSpend);

  const recEl = document.getElementById("poReceivedCount");
  if (recEl) recEl.textContent = received;

  const penEl = document.getElementById("poPendingCount");
  if (penEl) penEl.textContent = pending;

  const totEl = document.getElementById("poTotalCount");
  if (totEl) totEl.textContent = purchaseOrders.length;
}

function filterPurchases() {
  const query = (document.getElementById("poSearch")?.value || "").toLowerCase().trim();
  const status = document.getElementById("poStatusFilter")?.value || "ALL";

  const filtered = purchaseOrders.filter(p => {
    const matchQuery =
      p.id.toLowerCase().includes(query) ||
      p.supplier.toLowerCase().includes(query);

    const matchStatus = status === "ALL" || p.status === status;
    return matchQuery && matchStatus;
  });

  renderPurchasesTable(filtered);
}

function renderPurchasesTable(pos) {
  const tbody = document.getElementById("purchasesTableBody");
  if (!tbody) return;

  if (pos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-cart-flatbed"></i></div>
            <div class="empty-title">No purchase orders found</div>
            <div class="empty-desc">Create purchase orders to restock store inventory from wholesalers.</div>
            <button class="btn btn-primary btn-sm" onclick="openPOModal()">+ Create PO</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = pos.map(p => {
    let badge = `<span class="badge badge-success"><i class="fa-solid fa-check"></i> ${p.status}</span>`;
    if (p.status === "Pending") {
      badge = `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Pending</span>`;
    } else if (p.status === "Ordered") {
      badge = `<span class="badge badge-info"><i class="fa-solid fa-truck"></i> In Transit</span>`;
    }

    return `
      <tr>
        <td><strong>${p.id}</strong></td>
        <td>
          <div style="font-weight: 700;">${p.supplier}</div>
        </td>
        <td>${p.date}</td>
        <td>${p.itemsCount} units</td>
        <td><strong>${formatCurrency(p.total)}</strong></td>
        <td>${badge}</td>
        <td style="text-align: right;">
          ${p.status !== 'Received' ? `
            <button class="btn btn-secondary btn-sm" onclick="markPOReceived('${p.id}')">
              <i class="fa-solid fa-box-open"></i> Mark Received
            </button>
          ` : `
            <span style="font-size: 12px; color: var(--text-muted);">Stock Ingested</span>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

function openPOModal() {
  document.getElementById("poItemsCount").value = "10";
  document.getElementById("poTotalCost").value = "";
  document.getElementById("poInitialStatus").value = "Pending";
  openModal("poModal");
}

async function savePurchaseOrder(e) {
  e.preventDefault();
  const newPO = {
    supplier: document.getElementById("poSupplierSelect").value,
    itemsCount: Number(document.getElementById("poItemsCount").value) || 1,
    total: Number(document.getElementById("poTotalCost").value) || 0,
    status: document.getElementById("poInitialStatus").value
  };

  await api.addPurchase(newPO);
  showToast("Purchase Order created!", "success");
  closeModal("poModal");
  await loadPurchases();
}

function markPOReceived(id) {
  const po = purchaseOrders.find(p => p.id === id);
  if (!po) return;

  openConfirmModal({
    title: "Confirm Inbound Stock Receipt",
    message: `Confirm that all ${po.itemsCount} units for purchase order ${po.id} from ${po.supplier} have been physically received and inspected?`,
    confirmText: "Confirm Receipt",
    onConfirm: async () => {
      await api.receivePurchaseStock(id);
      api.logStockMovement({
        productId: "PO-INBOUND",
        productName: `PO Shipment (${po.supplier})`,
        type: "IN",
        qty: po.itemsCount,
        reference: po.id
      });
      showToast(`Purchase Order ${id} received! Stock movement ledger updated.`, "success");
      await loadPurchases();
    }
  });
}

document.addEventListener("DOMContentLoaded", loadPurchases);
