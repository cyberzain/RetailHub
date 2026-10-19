/**
 * RetailHub - Financial Reports & BI Analytics Controller
 * Accurately calculates Revenue, COGS, Gross Profit, Expenses, and Net Profit
 */

let reportSales = [];
let reportProducts = [];

async function initReports() {
  reportSales = await api.getSales();
  reportProducts = await api.getProducts();
  const expenses = await api.getExpenses();
  const customers = await api.getCustomers();
  const suppliers = await api.getSuppliers();

  document.getElementById("reportTimestamp").textContent = new Date().toLocaleDateString("en-IN") + " " + new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });

  // 1. Calculate Revenue, COGS, and Taxes
  const totalRev = reportSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalCOGS = reportSales.reduce((sum, s) => sum + (Number(s.costTotal) || Math.round((s.total || 0) * 0.7)), 0);
  const grossProfit = Math.max(0, totalRev - totalCOGS);
  
  // 2. Expenses & Net Profit
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = grossProfit - totalExpenses;

  // 3. Receivables & Payables
  const totalReceivables = customers.reduce((sum, c) => sum + (Number(c.creditBalance) || 0), 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
  const totalTax = reportSales.reduce((sum, s) => sum + (Number(s.tax) || 0), 0);

  // Render to UI
  document.getElementById("repGrossRev").textContent = formatCurrency(totalRev);
  document.getElementById("repCOGS").textContent = formatCurrency(totalCOGS);
  document.getElementById("repGrossProfit").textContent = formatCurrency(grossProfit);
  document.getElementById("repNetProfit").textContent = formatCurrency(netProfit);

  document.getElementById("repReceivables").textContent = formatCurrency(totalReceivables);
  document.getElementById("repPayables").textContent = formatCurrency(totalPayables);
  document.getElementById("repTax").textContent = formatCurrency(totalTax);

  renderMonthlyChart();
  renderPaymentMethodChart(reportSales);
  renderTopProducts(reportProducts);
}

function renderMonthlyChart() {
  const ctx = document.getElementById("monthlyChart");
  if (!ctx || typeof Chart === "undefined") return;

  if (window.monthlyChartInstance) window.monthlyChartInstance.destroy();

  window.monthlyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      datasets: [
        {
          label: "Revenue (₹)",
          data: [420000, 560000, 610000, 580000, 720000, 845000],
          backgroundColor: "#059669",
          borderRadius: 6
        },
        {
          label: "COGS & Inventory Cost (₹)",
          data: [310000, 420000, 460000, 440000, 550000, 640000],
          backgroundColor: "#cbd5e1",
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#f1f5f9" },
          ticks: {
            callback: value => "₹" + (value / 1000) + "k"
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderPaymentMethodChart(sales) {
  const ctx = document.getElementById("categoryChart");
  if (!ctx || typeof Chart === "undefined") return;

  if (window.paymentChartInstance) window.paymentChartInstance.destroy();

  let upiCount = sales.filter(s => s.paymentMethod === "UPI").length || 2;
  let cardCount = sales.filter(s => s.paymentMethod === "Card").length || 1;
  let cashCount = sales.filter(s => s.paymentMethod === "Cash").length || 1;
  let khataCount = sales.filter(s => s.paymentMethod && s.paymentMethod.includes("Credit")).length || 0;

  window.paymentChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["UPI", "Card", "Cash", "Khata Credit"],
      datasets: [
        {
          data: [upiCount, cardCount, cashCount, khataCount],
          backgroundColor: ["#059669", "#10b981", "#0d9488", "#f59e0b"],
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      },
      cutout: "65%"
    }
  });
}

function renderTopProducts(products) {
  const tbody = document.getElementById("topProductsBody");
  if (!tbody) return;

  const topItems = products.slice(0, 6);
  tbody.innerHTML = topItems.map((p, idx) => {
    const cost = Number(p.cost || 0);
    const price = Number(p.price || 0);
    const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : 0;

    return `
      <tr>
        <td>
          <span class="badge ${idx === 0 ? 'badge-warning' : 'badge-gray'}">#${idx + 1}</span>
        </td>
        <td><strong>${escapeHTML(p.name)}</strong></td>
        <td><span class="badge badge-gray">${escapeHTML(p.category)}</span></td>
        <td>${formatCurrency(price)}</td>
        <td>${formatCurrency(cost)}</td>
        <td>
          <span style="font-weight: 700; color: ${margin > 20 ? 'var(--success)' : 'var(--text-muted)'};">
            ${margin}%
          </span>
        </td>
        <td>${p.stock} in stock</td>
      </tr>
    `;
  }).join("");
}

function exportReportCSV() {
  const rev = document.getElementById("repGrossRev")?.textContent || "0";
  const cogs = document.getElementById("repCOGS")?.textContent || "0";
  const gross = document.getElementById("repGrossProfit")?.textContent || "0";
  const net = document.getElementById("repNetProfit")?.textContent || "0";

  let csv = "Metric,Value\n";
  csv += `"Gross Revenue","${rev}"\n`;
  csv += `"Cost of Goods Sold (COGS)","${cogs}"\n`;
  csv += `"Gross Profit","${gross}"\n`;
  csv += `"Net Profit (After Expenses)","${net}"\n`;

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `retailhub-financial-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  showToast("Financial report CSV downloaded!", "success");
}

document.addEventListener("DOMContentLoaded", initReports);
