/**
 * RetailHub - Inventory & Stock Movement Ledger Controller
 */

let inventoryItems = [];
let pendingCsvRows = [];

async function loadInventory() {
  inventoryItems = await api.getProducts();
  computeInventorySummary();
  filterInventory();
  await loadStockLedger();
}

function computeInventorySummary() {
  let totalValuation = 0;
  let totalUnits = 0;
  let lowCount = 0;
  let outCount = 0;

  inventoryItems.forEach(item => {
    const stock = Number(item.stock || 0);
    const cost = Number(item.cost || 0);
    const min = Number(item.minStock || 5);

    totalValuation += stock * cost;
    totalUnits += stock;

    if (stock === 0) outCount++;
    else if (stock <= min) lowCount++;
  });

  const valTotal = document.getElementById("val-total");
  if (valTotal) valTotal.textContent = formatCurrency(totalValuation);

  const valUnits = document.getElementById("val-units");
  if (valUnits) valUnits.textContent = totalUnits;

  const valLow = document.getElementById("val-low");
  if (valLow) valLow.textContent = lowCount;

  const valOut = document.getElementById("val-out");
  if (valOut) valOut.textContent = outCount;
}

function filterInventory() {
  const query = (document.getElementById("invSearch")?.value || "").toLowerCase().trim();
  const statusFilter = document.getElementById("invStatusFilter")?.value || "ALL";

  const filtered = inventoryItems.filter(item => {
    const matchQuery =
      item.name.toLowerCase().includes(query) ||
      (item.sku && item.sku.toLowerCase().includes(query)) ||
      (item.barcode && item.barcode.toLowerCase().includes(query));

    const stock = Number(item.stock || 0);
    const min = Number(item.minStock || 5);

    let matchStatus = true;
    if (statusFilter === "LOW") matchStatus = stock > 0 && stock <= min;
    else if (statusFilter === "OUT") matchStatus = stock === 0;
    else if (statusFilter === "OK") matchStatus = stock > min;

    return matchQuery && matchStatus;
  });

  renderInventoryTable(filtered);
}

function renderInventoryTable(items) {
  const tbody = document.getElementById("inventoryTableBody");
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-warehouse"></i></div>
            <div class="empty-title">No inventory records matching</div>
            <div class="empty-desc">Check your search criteria or filter settings.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const stock = Number(item.stock || 0);
    const min = Number(item.minStock || 5);
    const cost = Number(item.cost || 0);
    const valuation = stock * cost;

    let badge = `<span class="badge badge-success"><i class="fa-solid fa-check"></i> In Stock</span>`;
    if (stock === 0) {
      badge = `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Depleted</span>`;
    } else if (stock <= min) {
      badge = `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Reorder Now</span>`;
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700;">${escapeHTML(item.name)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(item.category)}</div>
        </td>
        <td>
          <code>${escapeHTML(item.sku || 'N/A')}</code>
          <div style="font-size: 11px; color: var(--text-subtle);"><i class="fa-solid fa-barcode"></i> ${escapeHTML(item.barcode || '—')}</div>
        </td>
        <td>
          <span style="font-size: 15px; font-weight: 800; color: ${stock <= min ? 'var(--danger)' : 'var(--text-main)'};">
            ${stock}
          </span>
        </td>
        <td>${min}</td>
        <td><strong>${formatCurrency(valuation)}</strong></td>
        <td>${badge}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="openAdjustModal('${item.id}')">
            <i class="fa-solid fa-sliders"></i> Adjust Qty
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

async function loadStockLedger() {
  const tbody = document.getElementById("ledgerTableBody");
  if (!tbody) return;

  const movements = await api.getStockMovements();
  if (movements.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 25px;">No stock movement records yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = movements.map(m => `
    <tr>
      <td>${m.date}</td>
      <td><code>${m.id}</code></td>
      <td><strong>${escapeHTML(m.productName)}</strong></td>
      <td>
        <span class="badge ${m.type === 'IN' ? 'badge-success' : 'badge-danger'}">
          <i class="fa-solid fa-arrow-${m.type === 'IN' ? 'down' : 'up'}"></i> ${m.type === 'IN' ? 'Stock In (+)' : 'Stock Out (-)'}
        </span>
      </td>
      <td><strong>${m.qty}</strong></td>
      <td><span style="color: var(--text-muted); font-size: 12.5px;">${escapeHTML(m.reference)}</span></td>
      <td><span class="badge badge-gray">${escapeHTML(m.by || 'Staff')}</span></td>
    </tr>
  `).join("");
}

function switchInvTab(tab) {
  document.getElementById("tabContentStock").style.display = tab === "stock" ? "block" : "none";
  document.getElementById("tabContentLedger").style.display = tab === "ledger" ? "block" : "none";
  document.getElementById("tabContentBatch").style.display = tab === "batch" ? "block" : "none";

  ["stock", "ledger", "batch"].forEach(t => {
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === tab) {
        btn.classList.add("btn-primary");
        btn.classList.remove("btn-secondary");
      } else {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-secondary");
      }
    }
  });
}

function openAdjustModal(id) {
  const item = inventoryItems.find(p => p.id === id);
  if (!item) return;

  document.getElementById("adjustProdId").value = item.id;
  document.getElementById("adjustProdName").value = item.name;
  document.getElementById("adjustCurrentStock").value = item.stock;
  document.getElementById("adjustNewStock").value = item.stock;

  openModal("adjustModal");
}

async function saveStockAdjustment(e) {
  e.preventDefault();
  const id = document.getElementById("adjustProdId").value;
  const newStock = Number(document.getElementById("adjustNewStock").value);
  const reason = document.getElementById("adjustReason").value;

  if (isNaN(newStock) || newStock < 0) {
    return showToast("Please enter a valid stock quantity", "error");
  }

  await api.adjustStock(id, newStock, reason);
  showToast(`Inventory updated & recorded to ledger!`, "success");
  closeModal("adjustModal");
  await loadInventory();
}

// CSV Export
function exportInventoryCSV() {
  if (!inventoryItems.length) return showToast("No items to export", "warning");

  let csv = "ID,Name,Category,SKU,Barcode,Cost,Price,Stock,MinStock,Valuation\n";
  inventoryItems.forEach(p => {
    const cost = Number(p.cost || 0);
    const stock = Number(p.stock || 0);
    csv += `"${p.id}","${p.name}","${p.category}","${p.sku || ''}","${p.barcode || ''}",${cost},${p.price || 0},${stock},${p.minStock || 5},${cost * stock}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `retailhub-inventory-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  showToast("Inventory CSV exported successfully!", "success");
}

// CSV Import & Validation Preview
function handleCSVFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    parseAndValidateCSV(text);
  };
  reader.readAsText(file);
  e.target.value = ""; // Reset
}

function parseAndValidateCSV(text) {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length < 2) return showToast("CSV file is empty or missing headers", "error");

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  
  pendingCsvRows = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 2) continue;

    const row = {
      name: cols[1] || cols[0] || "",
      category: cols[2] || "General",
      cost: Number(cols[5]) || 0,
      price: Number(cols[6]) || 0,
      stock: Number(cols[7]) || 10,
      sku: cols[3] || ("SKU-" + Math.floor(1000 + Math.random() * 9000)),
      barcode: cols[4] || String(Math.floor(890000000000 + Math.random() * 99999999))
    };

    let isValid = row.name.length > 0 && row.price > 0 && !isNaN(row.stock);
    row.isValid = isValid;
    row.reason = isValid ? "Valid item" : "Missing name or invalid price/stock";

    if (isValid) validCount++;
    else invalidCount++;

    pendingCsvRows.push(row);
  }

  // Render preview table in modal
  const tbody = document.getElementById("csvPreviewTbody");
  tbody.innerHTML = pendingCsvRows.map(r => `
    <tr>
      <td>${escapeHTML(r.name)}</td>
      <td>${escapeHTML(r.category)}</td>
      <td>${formatCurrency(r.cost)}</td>
      <td>${formatCurrency(r.price)}</td>
      <td>${r.stock}</td>
      <td>
        <span class="badge ${r.isValid ? 'badge-success' : 'badge-danger'}">
          ${r.isValid ? '<i class="fa-solid fa-check"></i> Ready' : '<i class="fa-solid fa-xmark"></i> ' + r.reason}
        </span>
      </td>
    </tr>
  `).join("");

  document.getElementById("csvValidationSummary").innerHTML = `
    Found <strong>${pendingCsvRows.length}</strong> items: 
    <span style="color: var(--success); font-weight: 700;">${validCount} valid</span>, 
    <span style="color: var(--danger); font-weight: 700;">${invalidCount} invalid</span>.
  `;

  openModal("csvPreviewModal");
}

async function applyCsvImport() {
  const validItems = pendingCsvRows.filter(r => r.isValid);
  if (validItems.length === 0) return showToast("No valid items to import", "warning");

  for (const item of validItems) {
    await api.addProduct({
      name: item.name,
      category: item.category,
      cost: item.cost,
      price: item.price,
      stock: item.stock,
      sku: item.sku,
      barcode: item.barcode,
      minStock: 5
    });
  }

  showToast(`Imported ${validItems.length} products to inventory!`, "success");
  closeModal("csvPreviewModal");
  await loadInventory();
}

document.addEventListener("DOMContentLoaded", loadInventory);
