/**
 * RetailHub - Invoices Controller
 */

let allInvoices = [];

async function loadInvoices() {
  allInvoices = await api.getSales();
  computeInvoiceKPIs();
  filterInvoices();
}

function computeInvoiceKPIs() {
  const totalBilled = allInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const taxCollected = allInvoices.reduce((sum, i) => sum + (Number(i.tax) || 0), 0);
  const paidCount = allInvoices.filter(i => i.status === "Paid").length;

  const billedEl = document.getElementById("invTotalBilled");
  if (billedEl) billedEl.textContent = formatCurrency(totalBilled);

  const taxEl = document.getElementById("invTaxCollected");
  if (taxEl) taxEl.textContent = formatCurrency(taxCollected);

  const paidEl = document.getElementById("invPaidCount");
  if (paidEl) paidEl.textContent = paidCount;
}

function filterInvoices() {
  const query = (document.getElementById("invoiceSearch")?.value || "").toLowerCase().trim();
  const status = document.getElementById("invoiceStatusFilter")?.value || "ALL";

  const filtered = allInvoices.filter(i => {
    const matchQuery =
      i.id.toLowerCase().includes(query) ||
      (i.customer && i.customer.toLowerCase().includes(query));

    const matchStatus = status === "ALL" || i.status === status;
    return matchQuery && matchStatus;
  });

  renderInvoicesTable(filtered);
}

function renderInvoicesTable(invoices) {
  const tbody = document.getElementById("invoicesTableBody");
  if (!tbody) return;

  if (invoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-file-invoice"></i></div>
            <div class="empty-title">No invoices found</div>
            <div class="empty-desc">Create sales from the POS terminal to generate tax invoices.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = invoices.map(i => `
    <tr>
      <td><strong>${i.id}</strong></td>
      <td>
        <div style="font-weight: 600;">${i.customer || "Walk-in Customer"}</div>
      </td>
      <td>${i.date}</td>
      <td>${formatCurrency(i.subtotal)}</td>
      <td><span style="color: var(--text-muted);">${formatCurrency(i.tax)}</span></td>
      <td><strong style="color: var(--primary);">${formatCurrency(i.total)}</strong></td>
      <td>
        <span class="badge badge-success"><i class="fa-solid fa-check"></i> ${i.status}</span>
      </td>
      <td style="text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="showTaxInvoice('${i.id}')">
          <i class="fa-solid fa-file-pdf"></i> View & Print
        </button>
      </td>
    </tr>
  `).join("");
}

function showTaxInvoice(id) {
  const inv = allInvoices.find(i => i.id === id);
  if (!inv) return;

  const content = document.getElementById("taxInvoiceContent");
  if (!content) return;

  const halfTax = Math.round((inv.tax || 0) / 2);

  content.innerHTML = `
    <div style="padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; line-height: 1.5; color: #1e293b;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 14px; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800; color: #059669; margin-bottom: 4px;">TAX INVOICE</h2>
          <p><strong>RetailHub Flagship Store</strong></p>
          <p style="color: #64748b; font-size: 12px;">Shop 14, Commercial Plaza, Bandra West, Mumbai 400050</p>
          <p style="color: #64748b; font-size: 12px;">GSTIN: 27AABCR1234D1ZP | State: Maharashtra (27)</p>
        </div>
        <div style="text-align: right;">
          <p>Invoice #: <strong>${inv.id}</strong></p>
          <p>Date: <strong>${inv.date}</strong></p>
          <p>Payment: <span class="badge badge-success">${inv.paymentMethod}</span></p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 6px;">
        <div>
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Billed To:</div>
          <div style="font-weight: 700; font-size: 14px;">${inv.customer}</div>
          <div style="color: #64748b; font-size: 12px;">Consumer Sale (B2C)</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Cashier / Counter:</div>
          <div style="font-weight: 600;">${inv.cashier || 'Sahil K.'} (Counter #1)</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12.5px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left; border-bottom: 1px solid #cbd5e1;">
            <th style="padding: 8px;">Item Description</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Unit Price</th>
            <th style="padding: 8px; text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(inv.items || []).map(item => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px;">${item.name}</td>
              <td style="padding: 8px; text-align: center;">${item.qty}</td>
              <td style="padding: 8px; text-align: right;">${formatCurrency(item.price)}</td>
              <td style="padding: 8px; text-align: right; font-weight: 600;">${formatCurrency(item.qty * item.price)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
        <div style="width: 250px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Taxable Value:</span>
            <span>${formatCurrency(inv.subtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748b;">
            <span>CGST (9%):</span>
            <span>${formatCurrency(halfTax)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748b;">
            <span>SGST (9%):</span>
            <span>${formatCurrency(halfTax)}</span>
          </div>
          ${inv.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #dc2626;">
              <span>Discount:</span>
              <span>-${formatCurrency(inv.discount)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; border-top: 1px solid #1e293b; padding-top: 6px; margin-top: 6px;">
            <span>Invoice Total:</span>
            <span style="color: #059669;">${formatCurrency(inv.total)}</span>
          </div>
        </div>
      </div>

      <div style="border-top: 1px dashed #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b;">
        <div>
          <p>Declaration: Certified that all particulars are true and correct.</p>
          <p>This is a computer generated invoice and requires no physical signature.</p>
        </div>
        <div style="text-align: center;">
          <div style="font-weight: 600; color: #1e293b;">For RetailHub Store</div>
          <div style="height: 35px;"></div>
          <div>Authorized Signatory</div>
        </div>
      </div>
    </div>
  `;

  openModal("taxInvoiceModal");
}

document.addEventListener("DOMContentLoaded", loadInvoices);
