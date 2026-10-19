/**
 * RetailHub - Customer CRM & Khata Ledger Controller
 */

let customersList = [];

async function loadCustomers() {
  customersList = await api.getCustomers();
  computeCustomerKPIs();
  filterCustomers();
}

function computeCustomerKPIs() {
  const totalSpend = customersList.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
  const totalPoints = customersList.reduce((sum, c) => sum + (Number(c.points) || 0), 0);
  const totalCredit = customersList.reduce((sum, c) => sum + (Number(c.creditBalance) || 0), 0);

  const countEl = document.getElementById("crmTotalCust");
  if (countEl) countEl.textContent = customersList.length;

  const spendEl = document.getElementById("crmTotalSpend");
  if (spendEl) spendEl.textContent = formatCurrency(totalSpend);

  const pointsEl = document.getElementById("crmTotalPoints");
  if (pointsEl) pointsEl.textContent = `${totalPoints} Pts`;

  const creditEl = document.getElementById("crmTotalCredit");
  if (creditEl) creditEl.textContent = formatCurrency(totalCredit);
}

function filterCustomers() {
  const query = (document.getElementById("custSearch")?.value || "").toLowerCase().trim();
  const creditFilter = document.getElementById("creditFilter")?.value || "ALL";

  const filtered = customersList.filter(c => {
    const matchQuery =
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query));

    let matchCredit = true;
    const balance = Number(c.creditBalance || 0);
    if (creditFilter === "DUE") matchCredit = balance > 0;
    else if (creditFilter === "ZERO") matchCredit = balance === 0;

    return matchQuery && matchCredit;
  });

  renderCustomersTable(filtered);
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById("customersTableBody");
  if (!tbody) return;

  if (customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-users"></i></div>
            <div class="empty-title">No customer profiles found</div>
            <div class="empty-desc">Register customers during billing to reward them with loyalty points.</div>
            <button class="btn btn-primary btn-sm" onclick="openCustomerModal()">+ Add Customer</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customers.map(c => {
    const points = Number(c.points || 0);
    const balance = Number(c.creditBalance || 0);

    let tierBadge = `<span class="badge badge-gray">Bronze</span>`;
    if (points >= 500) tierBadge = `<span class="badge badge-warning"><i class="fa-solid fa-crown"></i> Gold VIP</span>`;
    else if (points >= 200) tierBadge = `<span class="badge badge-primary"><i class="fa-solid fa-star"></i> Silver</span>`;

    return `
      <tr>
        <td>
          <div style="font-weight: 700; font-size: 13.5px;">${escapeHTML(c.name)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${c.id}</div>
        </td>
        <td>
          <div><i class="fa-solid fa-phone" style="font-size: 11px; color: var(--text-subtle);"></i> ${escapeHTML(c.phone)}</div>
          <div style="font-size: 12px; color: var(--text-muted);"><i class="fa-solid fa-envelope" style="font-size: 11px; color: var(--text-subtle);"></i> ${escapeHTML(c.email || '—')}</div>
        </td>
        <td>
          <strong style="color: ${balance > 0 ? 'var(--danger)' : 'var(--success)'}; font-size: 14px;">
            ${formatCurrency(balance)}
          </strong>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${tierBadge}
            <span style="font-weight: 700; font-size: 12px;">${points} pts</span>
          </div>
        </td>
        <td><strong>${formatCurrency(c.totalSpent)}</strong></td>
        <td><span class="badge badge-info">${c.visits || 1} Visits</span></td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            ${balance > 0 ? `
              <button class="btn btn-success btn-sm" onclick="openKhataModal('${c.id}')" title="Record Credit Payment">
                <i class="fa-solid fa-hand-holding-dollar"></i> Settle
              </button>
              <button class="btn btn-secondary btn-sm" onclick="promptWhatsAppReminder('${c.id}')" title="Send WhatsApp Payment Reminder">
                <i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> Remind
              </button>
            ` : `
              <a href="pos.html" class="btn btn-secondary btn-sm" title="New Sale">
                <i class="fa-solid fa-cart-shopping"></i> Bill
              </a>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function openCustomerModal() {
  document.getElementById("custName").value = "";
  document.getElementById("custPhone").value = "";
  document.getElementById("custEmail").value = "";
  document.getElementById("custPoints").value = "100";
  openModal("customerModal");
}

async function saveCustomer(e) {
  e.preventDefault();
  const newCustomer = {
    name: document.getElementById("custName").value.trim(),
    phone: document.getElementById("custPhone").value.trim(),
    email: document.getElementById("custEmail").value.trim(),
    points: Number(document.getElementById("custPoints").value) || 0
  };

  await api.addCustomer(newCustomer);
  showToast("Customer profile created!", "success");
  closeModal("customerModal");
  await loadCustomers();
}

function openKhataModal(id) {
  const cust = customersList.find(c => c.id === id);
  if (!cust) return;

  document.getElementById("khataCustId").value = cust.id;
  document.getElementById("khataCustName").value = cust.name;
  document.getElementById("khataCurrentDue").value = formatCurrency(cust.creditBalance);
  document.getElementById("khataPayAmount").value = cust.creditBalance;
  document.getElementById("khataPayAmount").max = cust.creditBalance;

  openModal("khataPaymentModal");
}

async function saveKhataPayment(e) {
  e.preventDefault();
  const id = document.getElementById("khataCustId").value;
  const amount = Number(document.getElementById("khataPayAmount").value);

  await api.recordKhataPayment(id, amount);
  showToast("Payment recorded against customer Khata ledger!", "success");
  closeModal("khataPaymentModal");
  await loadCustomers();
}

// WhatsApp Reminder Link Integration with user confirmation
function promptWhatsAppReminder(id) {
  const cust = customersList.find(c => c.id === id);
  if (!cust) return;

  const phoneClean = (cust.phone || "").replace(/[^0-9]/g, "");
  if (!phoneClean) {
    return showToast("Customer phone number is invalid or missing country code", "error");
  }

  const msg = `Dear ${cust.name}, this is a gentle payment reminder from RetailHub regarding your outstanding store credit balance of ${formatCurrency(cust.creditBalance)}. Kindly settle at your convenience. Thank you!`;

  openConfirmModal({
    title: "Send WhatsApp Payment Reminder?",
    message: `Would you like to open WhatsApp to send this reminder to ${cust.name} (${cust.phone})?\n\nMessage preview:\n"${msg}"`,
    confirmText: "Open WhatsApp",
    onConfirm: () => {
      const waUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank");
      showToast("WhatsApp reminder opened!", "info");
    }
  });
}

document.addEventListener("DOMContentLoaded", loadCustomers);
