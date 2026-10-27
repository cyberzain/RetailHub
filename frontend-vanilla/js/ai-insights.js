/**
 * RetailHub - AI Business Intelligence & Copilot Engine
 * Provides demand forecasting, automated reorder recommendations,
 * slow-moving stock optimizer, and margin guardrail warnings.
 * Strictly adheres to human confirmation before creating financial commitments.
 */

async function initAI() {
  await refreshInsights();
}

async function refreshInsights() {
  const insights = await api.getAIInsights();

  // 1. Top KPI Cards
  const forecastEl = document.getElementById("kpiForecastRev");
  const confidenceEl = document.getElementById("kpiConfidenceBadge");
  const reorderCountEl = document.getElementById("kpiReorderCount");
  const capitalTiedEl = document.getElementById("kpiCapitalTied");
  const slowCountEl = document.getElementById("kpiSlowItemsCount");
  const marginCountEl = document.getElementById("kpiMarginAlertCount");

  if (forecastEl) forecastEl.textContent = formatCurrency(insights.estimatedRevenue);
  if (confidenceEl) confidenceEl.textContent = insights.growthConfidence;
  if (reorderCountEl) reorderCountEl.textContent = `${insights.reorderAlerts.length} Products`;

  const totalCapitalTied = insights.slowMoving.reduce((sum, item) => sum + item.capitalTiedUp, 0);
  if (capitalTiedEl) capitalTiedEl.textContent = formatCurrency(totalCapitalTied);
  if (slowCountEl) slowCountEl.textContent = `${insights.slowMoving.length} slow lines`;
  if (marginCountEl) marginCountEl.textContent = `${insights.lowMarginAlerts.length} Products`;

  // 2. Render Reorder Recommendations List
  renderReorderList(insights.reorderAlerts);

  // 3. Render Slow-Moving Stock
  renderSlowMovingTable(insights.slowMoving);

  // 4. Render Margin Guardrails
  renderMarginTable(insights.lowMarginAlerts);
}

function renderReorderList(alerts) {
  const container = document.getElementById("reorderRecommendationsList");
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" style="color: var(--success);"><i class="fa-solid fa-circle-check"></i></div>
        <div class="empty-title">All stock levels healthy</div>
        <div class="empty-desc">No products are currently near or below safety buffer stock.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 10px; background: var(--surface);">
      <div>
        <div style="font-weight: 700; font-size: 13.5px; color: var(--text-main);">${escapeHTML(a.name)}</div>
        <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
          Category: <strong>${escapeHTML(a.category)}</strong> · Current Stock: <strong style="color: var(--danger);">${a.currentStock}</strong> (Min: ${a.minStock})
        </div>
        <div style="font-size: 11px; color: var(--text-subtle); margin-top: 2px;">
          Suggested Reorder: <strong>${a.suggestedQty} units</strong> (~${formatCurrency(a.estimatedCost)})
        </div>
      </div>

      <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
        <span class="badge ${a.currentStock === 0 ? 'badge-danger' : 'badge-warning'}" style="font-size: 10px;">
          ${a.urgency}
        </span>
        <button type="button" class="btn btn-primary btn-sm" onclick="draftPurchaseOrder('${a.id}', '${escapeHTML(a.name)}', ${a.suggestedQty}, ${a.estimatedCost})">
          <i class="fa-solid fa-file-invoice"></i> Draft PO
        </button>
      </div>
    </div>
  `).join("");
}

// Drafter requires explicit user confirmation
function draftPurchaseOrder(productId, productName, qty, estCost) {
  confirmAction(`Draft purchase order for ${qty} units of "${productName}" (Estimated total: ${formatCurrency(estCost)})?`, async () => {
    const suppliers = await api.getSuppliers();
    const supName = suppliers[0] ? suppliers[0].name : "NextGen Electronics Ltd";

    await api.addPurchase({
      supplier: supName,
      itemsCount: qty,
      total: estCost,
      status: "Ordered",
      notes: `AI Generated replenishment for ${productName}`
    });

    showToast(`Purchase order drafted for ${productName}! View in Purchases module.`, "success");
    await refreshInsights();
  });
}

function renderSlowMovingTable(items) {
  const tbody = document.getElementById("slowMovingTableBody");
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 24px; color: var(--text-muted);">No slow-moving inventory detected. Fast inventory turnover!</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td><strong>${escapeHTML(item.name)}</strong></td>
      <td><span class="badge badge-secondary">${escapeHTML(item.category)}</span></td>
      <td><strong>${item.stock}</strong> pcs</td>
      <td style="color: var(--purple); font-weight: 700;">${formatCurrency(item.capitalTiedUp)}</td>
      <td style="font-size: 11.5px; color: var(--text-muted);">${escapeHTML(item.recommendedAction)}</td>
    </tr>
  `).join("");
}

function renderMarginTable(alerts) {
  const tbody = document.getElementById("marginAlertsTableBody");
  if (!tbody) return;

  if (alerts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 24px; color: var(--text-muted);">All catalog items meet healthy gross margin criteria (> 18%).</td></tr>';
    return;
  }

  tbody.innerHTML = alerts.map(a => `
    <tr>
      <td><strong>${escapeHTML(a.name)}</strong></td>
      <td>${formatCurrency(a.cost)}</td>
      <td>${formatCurrency(a.price)}</td>
      <td>
        <span class="badge badge-danger">${a.marginPct}%</span>
      </td>
      <td style="font-size: 11.5px; color: var(--text-muted);">${escapeHTML(a.suggestion)}</td>
    </tr>
  `).join("");
}

// --- AI CHAT ASSISTANT ---
function sendQuickPrompt(promptText) {
  const input = document.getElementById("aiUserInput");
  if (input) {
    input.value = promptText;
    handleAIChatSubmit(new Event("submit"));
  }
}

async function handleAIChatSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("aiUserInput");
  const prompt = (input?.value || "").trim();
  if (!prompt) return;

  const chatBox = document.getElementById("aiChatBox");
  input.value = "";

  // Append user message
  const userMsgHtml = `
    <div style="display: flex; gap: 10px; align-items: flex-start; justify-content: flex-end;">
      <div style="background: var(--primary); color: #fff; padding: 10px 14px; border-radius: var(--radius-md); font-size: 13px; line-height: 1.4; max-width: 80%;">
        ${escapeHTML(prompt)}
      </div>
      <div style="width: 32px; height: 32px; border-radius: 50%; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">
        ZK
      </div>
    </div>
  `;
  chatBox.insertAdjacentHTML("beforeend", userMsgHtml);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Typing indicator
  const typingId = "typing-" + Date.now();
  chatBox.insertAdjacentHTML("beforeend", `
    <div id="${typingId}" style="display: flex; gap: 10px; align-items: center;">
      <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px;">
        <i class="fa-solid fa-robot"></i>
      </div>
      <div style="font-size: 12px; color: var(--text-muted); font-style: italic;">
        <i class="fa-solid fa-spinner fa-spin"></i> Analyzing store data...
      </div>
    </div>
  `);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Query AI
  const response = await api.queryAIAssistant(prompt);

  // Remove typing indicator
  document.getElementById(typingId)?.remove();

  // Format response (convert markdown **bold** and *italic*)
  let formattedReply = escapeHTML(response.reply);
  formattedReply = formattedReply.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formattedReply = formattedReply.replace(/\*(.*?)\*/g, "<em>$1</em>");

  const botMsgHtml = `
    <div style="display: flex; gap: 10px; align-items: flex-start;">
      <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">
        <i class="fa-solid fa-robot"></i>
      </div>
      <div style="background: var(--surface-alt); border: 1px solid var(--border); padding: 12px 16px; border-radius: var(--radius-md); font-size: 13px; line-height: 1.5; color: var(--text-main); max-width: 85%;">
        ${formattedReply}
      </div>
    </div>
  `;
  chatBox.insertAdjacentHTML("beforeend", botMsgHtml);
  chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", initAI);
