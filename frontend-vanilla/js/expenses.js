/**
 * RetailHub - Expenses & Cash Register Controller
 */

let expensesList = [];

async function loadExpensesPage() {
  expensesList = await api.getExpenses();
  await loadCashRegister();
  renderExpensesTable();
}

async function loadCashRegister() {
  const reg = await api.getCashRegister();

  document.getElementById("regOpeningCash").textContent = formatCurrency(reg.openingCash);
  document.getElementById("regCashSales").textContent = formatCurrency(reg.cashSales);
  document.getElementById("regCashExpenses").textContent = formatCurrency(reg.cashExpenses);
  document.getElementById("regExpectedCash").textContent = formatCurrency(reg.expectedCash);

  const badge = document.getElementById("regStatusBadge");
  if (reg.isOpen) {
    badge.className = "badge badge-success";
    badge.textContent = "Register: Open";
  } else {
    badge.className = "badge badge-gray";
    badge.textContent = `Closed: Counted ${formatCurrency(reg.countedCash)} (Var: ${formatCurrency(reg.variance)})`;
  }
}

function renderExpensesTable() {
  const tbody = document.getElementById("expensesTableBody");
  if (!tbody) return;

  const total = expensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  document.getElementById("expensesTotalLabel").textContent = `Total Operating Spend: ${formatCurrency(total)}`;

  if (expensesList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 25px;">No operating expenses recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = expensesList.map(e => `
    <tr>
      <td><code>${e.id}</code></td>
      <td><span class="badge badge-gray">${escapeHTML(e.category)}</span></td>
      <td><strong>${escapeHTML(e.title)}</strong></td>
      <td>${e.date}</td>
      <td><span class="badge badge-primary">${escapeHTML(e.paidBy || 'Cash')}</span></td>
      <td><strong style="color: var(--danger);">${formatCurrency(e.amount)}</strong></td>
    </tr>
  `).join("");
}

function openExpenseModal() {
  document.getElementById("expTitle").value = "";
  document.getElementById("expAmount").value = "";
  document.getElementById("expCategory").value = "Utilities";
  document.getElementById("expPaidBy").value = "Cash";
  openModal("expenseModal");
}

async function saveExpense(e) {
  e.preventDefault();
  const title = document.getElementById("expTitle").value.trim();
  const amount = Number(document.getElementById("expAmount").value);
  const category = document.getElementById("expCategory").value;
  const paidBy = document.getElementById("expPaidBy").value;

  await api.addExpense({ title, amount, category, paidBy });
  showToast("Expense recorded successfully!", "success");
  closeModal("expenseModal");
  await loadExpensesPage();
}

async function openCloseRegisterModal() {
  const reg = await api.getCashRegister();
  document.getElementById("modalExpectedCash").value = formatCurrency(reg.expectedCash);
  document.getElementById("countedCashInput").value = reg.expectedCash;
  calculateVariance();
  openModal("closeRegisterModal");
}

async function calculateVariance() {
  const reg = await api.getCashRegister();
  const counted = Number(document.getElementById("countedCashInput").value || 0);
  const variance = counted - reg.expectedCash;

  const varEl = document.getElementById("varianceOutput");
  varEl.value = (variance >= 0 ? "+" : "") + formatCurrency(variance);
  varEl.style.color = variance === 0 ? "var(--success)" : "var(--danger)";
}

async function executeCashClosing(e) {
  e.preventDefault();
  const counted = Number(document.getElementById("countedCashInput").value);
  const notes = document.getElementById("closingNotes").value.trim();

  await api.closeCashRegister(counted, notes);
  showToast("Shift closed and cash drawer reconciled!", "success");
  closeModal("closeRegisterModal");
  await loadCashRegister();
}

document.addEventListener("DOMContentLoaded", loadExpensesPage);
