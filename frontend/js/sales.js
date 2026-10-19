/**
 * RetailHub - Sales History Controller
 */

let salesRecords = [];

async function loadSales() {
  salesRecords = await api.getSales();
  computeSalesStats();
  filterSales();
}

function computeSalesStats() {
  const totalRev = salesRecords.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const count = salesRecords.length;
  const aov = count > 0 ? Math.round(totalRev / count) : 0;
  
  const digitalSales = salesRecords.filter(s => s.paymentMethod === "UPI" || s.paymentMethod === "Card").length;
  const digitalShare = count > 0 ? Math.round((digitalSales / count) * 100) : 0;

  const totalRevEl = document.getElementById("salesTotalRevenue");
  if (totalRevEl) totalRevEl.textContent = formatCurrency(totalRev);

  const countEl = document.getElementById("salesInvoiceCount");
  if (countEl) countEl.textContent = count;

  const aovEl = document.getElementById("salesAOV");
  if (aovEl) aovEl.textContent = formatCurrency(aov);

  const shareEl = document.getElementById("salesDigitalShare");
  if (shareEl) shareEl.textContent = `${digitalShare}%`;
}

function filterSales() {
  const query = (document.getElementById("salesSearch")?.value || "").toLowerCase().trim();
  const payType = document.getElementById("salesPayFilter")?.value || "ALL";

  const filtered = salesRecords.filter(s => {
    const matchQuery =
      s.id.toLowerCase().includes(query) ||
      (s.customer && s.customer.toLowerCase().includes(query));

    const matchPay = payType === "ALL" || s.paymentMethod === payType;
    return matchQuery && matchPay;
  });

  renderSalesTable(filtered);
}

function renderSalesTable(sales) {
  const tbody = document.getElementById("salesTableBody");
  if (!tbody) return;

  if (sales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-receipt"></i></div>
            <div class="empty-title">No transactions found</div>
            <div class="empty-desc">No sales matching your filter criteria.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = sales.map(s => {
    const itemsPreview = (s.items || []).map(i => `${i.qty}x ${i.name}`).join(", ");

    return `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>
          <div style="font-weight: 600;">${s.customer || "Walk-in"}</div>
        </td>
        <td>
          <div>${s.date}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${s.cashier || 'Cashier'}</div>
        </td>
        <td style="max-width: 250px;">
          <div style="font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsPreview}">
            ${itemsPreview || '—'}
          </div>
        </td>
        <td>
          <span class="badge ${s.paymentMethod === 'UPI' ? 'badge-primary' : s.paymentMethod === 'Card' ? 'badge-info' : 'badge-gray'}">
            ${s.paymentMethod}
          </span>
        </td>
        <td><strong>${formatCurrency(s.total)}</strong></td>
        <td>
          <span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> ${s.status}</span>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="viewSaleDetail('${s.id}')">
            <i class="fa-solid fa-eye"></i> View
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function viewSaleDetail(id) {
  const sale = salesRecords.find(s => s.id === id);
  if (!sale) return;

  const content = document.getElementById("saleReceiptContent");
  if (!content) return;

  content.innerHTML = `
    <div class="receipt-paper">
      <div class="receipt-header">
        <h3>RetailHub Store</h3>
        <p style="font-size: 11px;">Shop 14, Commercial Plaza, Bandra West, Mumbai</p>
        <p style="font-size: 11px;">GSTIN: 27AABCR1234D1ZP</p>
      </div>

      <div class="receipt-line">
        <span>Invoice #: <strong>${sale.id}</strong></span>
        <span>Payment: ${sale.paymentMethod}</span>
      </div>
      <div class="receipt-line">
        <span>Date: ${sale.date}</span>
        <span>Cashier: ${sale.cashier || 'Sahil K.'}</span>
      </div>
      <div class="receipt-line" style="margin-bottom: 12px;">
        <span>Customer: <strong>${sale.customer}</strong></span>
      </div>

      <div style="border-top: 1px dashed #94a3b8; border-bottom: 1px dashed #94a3b8; padding: 6px 0; margin-bottom: 8px;">
        ${(sale.items || []).map(item => `
          <div class="receipt-line">
            <span style="font-weight: 600;">${item.name}</span>
          </div>
          <div class="receipt-line" style="color: #475569; font-size: 12px; margin-bottom: 4px;">
            <span>${item.qty} x ${formatCurrency(item.price)}</span>
            <span>${formatCurrency(item.qty * item.price)}</span>
          </div>
        `).join("")}
      </div>

      <div class="receipt-line">
        <span>Subtotal:</span>
        <span>${formatCurrency(sale.subtotal)}</span>
      </div>
      <div class="receipt-line">
        <span>GST (18%):</span>
        <span>${formatCurrency(sale.tax)}</span>
      </div>
      ${sale.discount > 0 ? `
        <div class="receipt-line" style="color: #dc2626;">
          <span>Discount:</span>
          <span>-${formatCurrency(sale.discount)}</span>
        </div>
      ` : ''}
      <div class="receipt-line" style="font-size: 16px; font-weight: 800; border-top: 1px solid #1e293b; padding-top: 6px; margin-top: 6px;">
        <span>Total Paid:</span>
        <span>${formatCurrency(sale.total)}</span>
      </div>
    </div>
  `;

  openModal("saleDetailModal");
}

function exportSalesCSV() {
  if (!salesRecords.length) return showToast("No sales to export", "warning");

  let csv = "Invoice ID,Customer,Date,Payment Method,Subtotal,Tax,Discount,Total,Status\n";
  salesRecords.forEach(s => {
    csv += `"${s.id}","${s.customer}","${s.date}","${s.paymentMethod}",${s.subtotal || 0},${s.tax || 0},${s.discount || 0},${s.total || 0},"${s.status}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `retailhub-sales-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  showToast("Sales CSV exported!", "success");
}

document.addEventListener("DOMContentLoaded", loadSales);
