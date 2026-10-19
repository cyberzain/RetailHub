/**
 * RetailHub - Advanced Production POS Engine
 * Features:
 * - Responsive 25+ product grid with sorting, pagination, category filtering
 * - USB Barcode Scanner hardware listener & keyboard shortcuts (F1-F10)
 * - Frequently Sold Quick-Picks chips
 * - Direct editable quantity inputs, item-level discounts & notes
 * - Customer Khata credit lookup, loyalty points redemption, inline customer registration
 * - Cash tender with live Change Due calculation & quick denomination buttons
 * - Split Payment (Cash + UPI / Card)
 * - Held Carts (multiple paused checkouts)
 * - Dual Invoice Printing: Thermal 80mm Receipt and Standard A4 GST Tax Invoice
 * - Offline queueing with idempotency keys
 */

let posProducts = [];
let cart = [];
let selectedCategory = "ALL";
let currentPaymentMethod = "Cash";
let isCheckingOut = false;
let activeReceiptSale = null;
let currentReceiptFormat = "thermal";
let currentPage = 1;
const pageSize = 12;
let splitDetails = null;

// Barcode hardware scanner buffer variables
let barcodeBuffer = "";
let lastKeyTime = Date.now();

// --- 1. INITIALIZATION ---
async function initPOS() {
  posProducts = await api.getProducts();
  await loadPOSCustomers();
  await updateTodaySalesSummary();
  renderQuickPicks();
  renderPOSGrid();
  selectPaymentMethod("Cash");
  updateHeldCartsCount();
  setupGlobalHardwareScanner();
}

async function updateTodaySalesSummary() {
  const sales = await api.getSales();
  const today = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter(s => s.date === today && s.status !== "Refunded/Returned");

  const totalRev = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCount = todaySales.length;

  const totalEl = document.getElementById("posTodayTotal");
  const countEl = document.getElementById("posTodayCount");
  if (totalEl) totalEl.textContent = formatCurrency(totalRev);
  if (countEl) countEl.textContent = `${totalCount} bills`;
}

// --- 2. QUICK PICKS (FREQUENTLY SOLD) ---
function renderQuickPicks() {
  const container = document.getElementById("posQuickPicks");
  if (!container) return;

  const quickItems = posProducts.filter(p => p.isFrequentlySold || p.isRecentlySold).slice(0, 8);
  if (quickItems.length === 0) {
    container.innerHTML = '<span style="font-size: 11.5px; color: var(--text-subtle);">No quick items configured</span>';
    return;
  }

  container.innerHTML = quickItems.map(p => `
    <div class="pos-quick-chip" onclick="addToCart('${p.id}')" title="Click to add ${escapeHTML(p.name)}">
      <i class="fa-solid ${p.icon || 'fa-tag'}" style="color: var(--primary);"></i>
      <span>${escapeHTML(p.name.length > 20 ? p.name.substring(0, 18) + '...' : p.name)}</span>
      <strong style="color: var(--text-main);">${formatCurrency(p.price)}</strong>
    </div>
  `).join("");
}

// --- 3. CUSTOMER MANAGEMENT, KHATA & LOYALTY ---
async function loadPOSCustomers() {
  const select = document.getElementById("posCustomerSelect");
  if (!select) return;

  const customers = await api.getCustomers();
  const currentVal = select.value;

  select.innerHTML = '<option value="Walk-in Customer">Walk-in Customer (Guest)</option>';
  customers.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.name;
    opt.dataset.id = c.id;
    opt.dataset.credit = c.creditBalance || 0;
    opt.dataset.points = c.points || 0;
    opt.dataset.phone = c.phone || "";
    opt.textContent = `${c.name} (${c.phone || c.email || 'No phone'})`;
    select.appendChild(opt);
  });

  if (currentVal) {
    select.value = currentVal;
  }
  onCustomerChange();
}

function onCustomerChange() {
  const select = document.getElementById("posCustomerSelect");
  if (!select) return;

  const selectedOpt = select.options[select.selectedIndex];
  const infoEl = document.getElementById("custCreditInfo");
  const loyaltyBox = document.getElementById("loyaltyPointsBox");
  const pointsCountEl = document.getElementById("custPointsCount");
  const pointsValEl = document.getElementById("custPointsValue");

  if (!selectedOpt || selectedOpt.value === "Walk-in Customer") {
    if (infoEl) infoEl.textContent = "";
    if (loyaltyBox) loyaltyBox.style.display = "none";
    return;
  }

  const creditDue = Number(selectedOpt.dataset.credit || 0);
  const points = Number(selectedOpt.dataset.points || 0);

  if (infoEl) {
    if (creditDue > 0) {
      infoEl.textContent = `Due Khata: ${formatCurrency(creditDue)}`;
    } else {
      infoEl.textContent = `Khata Clear ✓`;
      infoEl.style.color = "var(--success)";
    }
  }

  if (loyaltyBox && pointsCountEl && pointsValEl) {
    if (points > 0) {
      loyaltyBox.style.display = "flex";
      pointsCountEl.textContent = points;
      pointsValEl.textContent = points; // 1 point = 1 INR
    } else {
      loyaltyBox.style.display = "none";
    }
  }
}

function redeemCustomerPoints() {
  const select = document.getElementById("posCustomerSelect");
  const selectedOpt = select.options[select.selectedIndex];
  const points = Number(selectedOpt?.dataset.points || 0);

  if (points <= 0) return showToast("No loyalty points available for this customer", "warning");

  const discountInput = document.getElementById("cartDiscount");
  if (discountInput) {
    const currentDiscount = Number(discountInput.value || 0);
    discountInput.value = currentDiscount + points;
    calculateCartTotals();
    showToast(`Redeemed ${points} loyalty points (Saved ₹${points})!`, "success");
    document.getElementById("loyaltyPointsBox").style.display = "none";
  }
}

async function handleInlineCustomerCreate(e) {
  e.preventDefault();
  const name = document.getElementById("inlineCustName")?.value.trim();
  const phone = document.getElementById("inlineCustPhone")?.value.trim();
  const email = document.getElementById("inlineCustEmail")?.value.trim();
  const creditLimit = Number(document.getElementById("inlineCustCreditLimit")?.value || 10000);

  if (!name) return showToast("Please enter customer name", "warning");

  const newCust = await api.addCustomer({
    name,
    phone,
    email,
    creditLimit,
    creditBalance: 0,
    points: 100 // Welcome reward points
  });

  await loadPOSCustomers();

  // Auto select new customer
  const select = document.getElementById("posCustomerSelect");
  if (select) {
    select.value = newCust.name;
    onCustomerChange();
  }

  closeModal("newCustomerModal");
  showToast(`Customer '${newCust.name}' registered & selected!`, "success");
}

// --- 4. CATALOG BROWSING, SEARCH, SORT & PAGINATION ---
function setCategory(cat) {
  selectedCategory = cat;
  currentPage = 1;
  document.querySelectorAll(".category-pill").forEach(pill => {
    const text = pill.textContent.trim().toLowerCase();
    const match = cat === "ALL" ? text === "all items" : text === cat.toLowerCase();
    pill.classList.toggle("active", match);
  });
  renderPOSGrid();
}

function filterPOSProducts() {
  const searchInput = document.getElementById("posSearch");
  const query = (searchInput?.value || "").trim().toLowerCase();
  const clearBtn = document.getElementById("clearSearchBtn");

  if (clearBtn) {
    clearBtn.style.display = query.length > 0 ? "block" : "none";
  }

  // Instant exact barcode match (from scanner or fast typing)
  if (query.length >= 8) {
    const exactBarcode = posProducts.find(p => p.barcode && p.barcode.toLowerCase() === query);
    if (exactBarcode) {
      addToCart(exactBarcode.id);
      searchInput.value = "";
      if (clearBtn) clearBtn.style.display = "none";
      return;
    }
  }

  currentPage = 1;
  renderPOSGrid();
}

function clearPOSSearch() {
  const searchInput = document.getElementById("posSearch");
  const clearBtn = document.getElementById("clearSearchBtn");
  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }
  if (clearBtn) clearBtn.style.display = "none";
  renderPOSGrid();
}

function renderPOSGrid() {
  const grid = document.getElementById("posItemsGrid");
  if (!grid) return;

  const query = (document.getElementById("posSearch")?.value || "").trim().toLowerCase();
  const sortMode = document.getElementById("posSortSelect")?.value || "featured";

  let filtered = posProducts.filter(p => {
    const matchCat = selectedCategory === "ALL" || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.toLowerCase().includes(query));
    return matchCat && matchSearch;
  });

  // Sort logic
  if (sortMode === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortMode === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortMode === "stock-desc") {
    filtered.sort((a, b) => b.stock - a.stock);
  } else if (sortMode === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  currentPage = Math.min(currentPage, totalPages);

  const startIdx = (currentPage - 1) * pageSize;
  const paginatedItems = filtered.slice(startIdx, startIdx + pageSize);

  // Stats bar
  const statsEl = document.getElementById("posProductStats");
  if (statsEl) {
    statsEl.textContent = `Showing ${paginatedItems.length} of ${totalItems} items (Page ${currentPage} of ${totalPages})`;
  }

  // Pagination buttons
  renderPaginationControls(totalPages);

  if (paginatedItems.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1;" class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <div class="empty-title">No products found</div>
        <div class="empty-desc">No matching inventory found for "${escapeHTML(query)}". Try another search or category.</div>
        <button class="btn btn-secondary btn-sm" onclick="clearPOSSearch()">Clear Search</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = paginatedItems.map(p => {
    const stock = Number(p.stock || 0);
    const isOut = stock <= 0;
    const isLow = stock > 0 && stock <= Number(p.minStock || 5);

    let stockBadge = `<span class="badge badge-success">${stock} in stock</span>`;
    if (isOut) {
      stockBadge = `<span class="badge badge-danger">Out of stock</span>`;
    } else if (isLow) {
      stockBadge = `<span class="badge badge-warning">Low: ${stock} left</span>`;
    }

    return `
      <div class="pos-item-card ${isOut ? 'out-of-stock' : ''}" onclick="${isOut ? `showToast('${escapeHTML(p.name)} is currently out of stock', 'warning')` : `addToCart('${p.id}')`}">
        <div class="pos-item-thumb">
          <i class="fa-solid ${p.icon || 'fa-box-open'}"></i>
          <span style="position: absolute; top: 6px; left: 6px; font-size: 10px; font-weight: 700; background: rgba(15,23,42,0.7); color: #fff; padding: 2px 6px; border-radius: 4px;">
            ${escapeHTML(p.category)}
          </span>
        </div>

        <div class="pos-item-code">
          <span>${escapeHTML(p.sku || 'SKU')}</span> · 
          <span style="font-family: monospace;">${escapeHTML(p.barcode || '')}</span>
        </div>

        <div class="pos-item-name" title="${escapeHTML(p.name)}">${escapeHTML(p.name)}</div>
        
        <div class="pos-item-stock">
          ${stockBadge}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <div class="pos-item-price">${formatCurrency(p.price)}</div>
          <button type="button" class="btn btn-primary btn-sm" style="padding: 4px 8px; font-size: 11px;" ${isOut ? 'disabled' : ''}>
            <i class="fa-solid fa-plus"></i> Add
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function renderPaginationControls(totalPages) {
  const container = document.getElementById("posPageButtons");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <button class="btn btn-secondary btn-sm" onclick="changePOSPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `
        <button class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="changePOSPage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span style="padding: 4px 6px; color: var(--text-muted);">...</span>`;
    }
  }

  html += `
    <button class="btn btn-secondary btn-sm" onclick="changePOSPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

function changePOSPage(page) {
  currentPage = page;
  renderPOSGrid();
}

// --- 5. ADVANCED SHOPPING CART ENGINE ---
function addToCart(productId) {
  const product = posProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  const availableStock = Number(product.stock || 0);

  if (availableStock <= 0) {
    return showToast(`'${product.name}' is out of stock!`, "error");
  }

  if (existing) {
    if (existing.qty + 1 > availableStock) {
      return showToast(`Only ${availableStock} units in stock for ${product.name}!`, "warning");
    }
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      qty: 1,
      maxStock: availableStock,
      itemDiscount: 0,
      note: ""
    });
  }

  renderCart();
  showToast(`Added '${product.name}' to cart`, "info");
}

function updateCartQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const newQty = item.qty + delta;
  if (newQty <= 0) {
    cart = cart.filter(i => i.id !== id);
  } else if (newQty > item.maxStock) {
    showToast(`Only ${item.maxStock} units available in stock`, "warning");
    return;
  } else {
    item.qty = newQty;
  }

  renderCart();
}

function setCartQty(id, value) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    cart = cart.filter(i => i.id !== id);
  } else if (num > item.maxStock) {
    showToast(`Max available stock is ${item.maxStock}`, "warning");
    item.qty = item.maxStock;
  } else {
    item.qty = num;
  }

  renderCart();
}

let pendingManagerAction = null;

function requestManagerApproval({ reason, onApproved }) {
  const currentUser = api.getCurrentUser();
  if (currentUser.role === "Owner" || currentUser.role === "Manager") {
    onApproved();
    return;
  }

  pendingManagerAction = onApproved;
  const reasonEl = document.getElementById("managerApprovalReason");
  if (reasonEl) reasonEl.textContent = reason || "Supervisor authorization required for this action.";
  const pinInput = document.getElementById("managerPinInput");
  if (pinInput) pinInput.value = "";
  const errEl = document.getElementById("managerPinError");
  if (errEl) errEl.style.display = "none";

  openModal("managerApprovalModal");
  setTimeout(() => {
    document.getElementById("managerPinInput")?.focus();
  }, 100);
}

async function verifyAndExecuteManagerApproval() {
  const pin = document.getElementById("managerPinInput").value.trim();
  const errEl = document.getElementById("managerPinError");
  const btn = document.getElementById("btnConfirmManagerApproval");

  if (!pin) {
    errEl.textContent = "Please enter Manager PIN";
    errEl.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authorizing...';

  try {
    const res = await api.verifyManagerPin(pin);
    if (!res.authorized) {
      errEl.textContent = res.error || "Invalid Manager PIN. Authorization failed.";
      errEl.style.display = "block";
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Authorize Action';
      return;
    }

    closeModal("managerApprovalModal");
    showToast(`Action authorized by Manager (${res.managerName})`, "success");
    if (typeof pendingManagerAction === "function") {
      const act = pendingManagerAction;
      pendingManagerAction = null;
      act();
    }
  } catch (err) {
    errEl.textContent = "Error verifying PIN";
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Authorize Action';
  }
}

function promptItemDiscount(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const input = prompt(`Enter item discount for "${item.name}" (in ₹):`, item.itemDiscount || "0");
  if (input !== null) {
    const val = Number(input);
    if (!isNaN(val) && val >= 0) {
      const discountVal = Math.min(item.price * item.qty, val);
      const threshold = (item.price * item.qty) * 0.15; // 15% discount threshold

      const applyDiscount = () => {
        item.itemDiscount = discountVal;
        renderCart();
        showToast(`Item discount of ${formatCurrency(discountVal)} applied to ${item.name}`, "success");
      };

      if (discountVal > threshold) {
        requestManagerApproval({
          reason: `Salesperson requested restricted discount of ${formatCurrency(discountVal)} (>15%) on ${item.name}.`,
          onApproved: applyDiscount
        });
      } else {
        applyDiscount();
      }
    } else {
      showToast("Invalid discount amount", "error");
    }
  }
}

function toggleItemNote(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const note = prompt(`Enter note / Serial # for "${item.name}":`, item.note || "");
  if (note !== null) {
    item.note = note.trim();
    renderCart();
    if (item.note) showToast("Item note saved", "info");
  }
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

function confirmClearCart() {
  if (cart.length === 0) return;
  const currentUser = api.getCurrentUser();
  const isSalesperson = currentUser.role === "Salesperson" || currentUser.role === "Cashier";

  const executeClear = () => {
    cart = [];
    document.getElementById("cartDiscount").value = 0;
    renderCart();
    showToast("Cart cleared", "info");
  };

  if (isSalesperson) {
    requestManagerApproval({
      reason: "Clearing active cart items by Salesperson requires Manager Authorization.",
      onApproved: executeClear
    });
  } else {
    if (typeof openConfirmModal === "function") {
      openConfirmModal({
        title: "Clear Cart",
        message: "Are you sure you want to clear all items in this cart?",
        confirmText: "Clear Cart",
        onConfirm: executeClear
      });
    } else {
      executeClear();
    }
  }
}

function renderCart() {
  const list = document.getElementById("cartItemsList");
  const countBadge = document.getElementById("cartCountBadge");
  if (!list) return;

  const totalLines = cart.length;
  const totalUnits = cart.reduce((sum, item) => sum + item.qty, 0);

  if (countBadge) {
    countBadge.textContent = `${totalLines} item${totalLines === 1 ? '' : 's'} · ${totalUnits} unit${totalUnits === 1 ? '' : 's'}`;
  }

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding: 40px 10px;">
        <div class="empty-icon" style="font-size: 32px;"><i class="fa-solid fa-basket-shopping"></i></div>
        <div class="empty-title">Cart is empty</div>
        <div class="empty-desc">Click products or scan barcodes to begin transaction.</div>
      </div>
    `;
    calculateCartTotals();
    return;
  }

  list.innerHTML = cart.map(item => {
    const lineTotal = Math.max(0, (item.price * item.qty) - (item.itemDiscount || 0));

    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-title" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</div>
          <div class="cart-item-unit-price">
            ${formatCurrency(item.price)} each
            ${item.itemDiscount > 0 ? `<span style="color: var(--danger); font-size: 11px;">(-${formatCurrency(item.itemDiscount)})</span>` : ''}
          </div>
          ${item.note ? `<div style="font-size: 11px; color: var(--primary); font-style: italic;"><i class="fa-solid fa-note-sticky"></i> ${escapeHTML(item.note)}</div>` : ''}
          
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <button type="button" onclick="promptItemDiscount('${item.id}')" style="background:none; border:none; color: var(--text-muted); font-size: 11px; cursor: pointer; text-decoration: underline;" title="Line discount">
              <i class="fa-solid fa-percent"></i> Discount
            </button>
            <button type="button" onclick="toggleItemNote('${item.id}')" style="background:none; border:none; color: var(--text-muted); font-size: 11px; cursor: pointer; text-decoration: underline;" title="Item note">
              <i class="fa-solid fa-pen"></i> Note
            </button>
          </div>
        </div>

        <div class="cart-qty-ctrl">
          <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)">-</button>
          <input type="number" min="1" max="${item.maxStock}" class="cart-qty-input" value="${item.qty}" onchange="setCartQty('${item.id}', this.value)">
          <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
        </div>

        <div class="cart-item-total">
          ${formatCurrency(lineTotal)}
        </div>

        <button class="cart-item-del" onclick="removeFromCart('${item.id}')" title="Remove item">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  }).join("");

  calculateCartTotals();
}

function calculateCartTotals() {
  const lineSubtotal = cart.reduce((sum, item) => sum + Math.max(0, (item.price * item.qty) - (item.itemDiscount || 0)), 0);
  const taxRate = 0.18; // 18% standard GST
  const tax = Math.round(lineSubtotal * taxRate);
  const discountInput = Number(document.getElementById("cartDiscount")?.value || 0);
  const discount = Math.min(lineSubtotal + tax, Math.max(0, discountInput));
  const grandTotal = Math.max(0, lineSubtotal + tax - discount);

  const subtotalEl = document.getElementById("cartSubtotal");
  const taxEl = document.getElementById("cartTax");
  const totalEl = document.getElementById("cartGrandTotal");

  if (subtotalEl) subtotalEl.textContent = formatCurrency(lineSubtotal);
  if (taxEl) taxEl.textContent = formatCurrency(tax);
  if (totalEl) totalEl.textContent = formatCurrency(grandTotal);

  calculateChangeDue();

  return { subtotal: lineSubtotal, tax, discount, grandTotal };
}

async function applyCouponCode() {
  const code = (document.getElementById("couponCodeInput")?.value || "").trim();
  if (!code) return showToast("Enter a promo or coupon code", "warning");

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const res = await api.validateCoupon(code, subtotal);

  if (res.valid) {
    document.getElementById("cartDiscount").value = res.discountAmount;
    calculateCartTotals();
    showToast(`Promo ${code} applied! Saved ${formatCurrency(res.discountAmount)}`, "success");
  } else {
    showToast(res.message, "error");
  }
}

// --- 6. PAYMENT MODES & CASH TENDER WITH LIVE CHANGE DUE ---
function selectPaymentMethod(method) {
  currentPaymentMethod = method;
  splitDetails = null;

  const methods = [
    { id: "payMethodCash", name: "Cash" },
    { id: "payMethodCard", name: "Card" },
    { id: "payMethodUPI", name: "UPI" },
    { id: "payMethodCredit", name: "Store Credit (Khata)" },
    { id: "payMethodSplit", name: "Split" }
  ];

  methods.forEach(m => {
    const btn = document.getElementById(m.id);
    if (btn) {
      if (m.name === method) {
        btn.classList.add("btn-primary");
        btn.classList.remove("btn-secondary");
      } else {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-secondary");
      }
    }
  });

  const tenderSec = document.getElementById("cashTenderSection");
  if (tenderSec) {
    tenderSec.style.display = method === "Cash" ? "block" : "none";
  }
}

function calculateChangeDue() {
  const { grandTotal } = calculateCartTotals();
  const tenderInput = document.getElementById("cashTendered");
  const changeDueEl = document.getElementById("changeDueAmount");
  if (!tenderInput || !changeDueEl) return;

  const tendered = Number(tenderInput.value || 0);

  if (tendered === 0) {
    changeDueEl.textContent = "₹0.00";
    changeDueEl.style.color = "var(--text-main)";
    return;
  }

  const change = tendered - grandTotal;
  if (change >= 0) {
    changeDueEl.textContent = formatCurrency(change);
    changeDueEl.style.color = "var(--success)";
  } else {
    changeDueEl.textContent = `Short by ${formatCurrency(Math.abs(change))}`;
    changeDueEl.style.color = "var(--danger)";
  }
}

function setCashTenderExact() {
  const { grandTotal } = calculateCartTotals();
  const tenderInput = document.getElementById("cashTendered");
  if (tenderInput) {
    tenderInput.value = grandTotal;
    calculateChangeDue();
  }
}

function addCashTender(amount) {
  const tenderInput = document.getElementById("cashTendered");
  if (tenderInput) {
    const current = Number(tenderInput.value || 0);
    tenderInput.value = current + amount;
    calculateChangeDue();
  }
}

// Split Payment
function openSplitPaymentModal() {
  if (cart.length === 0) return showToast("Add products to cart before choosing split payment", "warning");

  const { grandTotal } = calculateCartTotals();
  document.getElementById("splitTotalDisplay").textContent = formatCurrency(grandTotal);

  const half = Math.round(grandTotal / 2);
  document.getElementById("splitCashAmount").value = half;
  document.getElementById("splitDigitalAmount").value = grandTotal - half;

  validateSplitAmounts();
  openModal("splitPaymentModal");
}

function validateSplitAmounts() {
  const { grandTotal } = calculateCartTotals();
  const cash = Number(document.getElementById("splitCashAmount")?.value || 0);
  const digital = Number(document.getElementById("splitDigitalAmount")?.value || 0);
  const alertEl = document.getElementById("splitValidationAlert");
  const confirmBtn = document.getElementById("confirmSplitBtn");

  const sum = cash + digital;
  const diff = grandTotal - sum;

  if (diff === 0) {
    alertEl.textContent = "✓ Amounts match total payable perfectly";
    alertEl.style.color = "var(--success)";
    confirmBtn.disabled = false;
    return true;
  } else if (diff > 0) {
    alertEl.textContent = `Unallocated amount: ${formatCurrency(diff)}`;
    alertEl.style.color = "var(--danger)";
    confirmBtn.disabled = true;
    return false;
  } else {
    alertEl.textContent = `Over-allocated by ${formatCurrency(Math.abs(diff))}`;
    alertEl.style.color = "var(--danger)";
    confirmBtn.disabled = true;
    return false;
  }
}

function confirmSplitPayment() {
  if (!validateSplitAmounts()) return;

  const cash = Number(document.getElementById("splitCashAmount").value);
  const digital = Number(document.getElementById("splitDigitalAmount").value);
  const method = document.getElementById("splitDigitalMethod").value;

  splitDetails = {
    cashAmount: cash,
    digitalAmount: digital,
    digitalMethod: method
  };

  currentPaymentMethod = `Split (Cash: ${formatCurrency(cash)} + ${method}: ${formatCurrency(digital)})`;
  closeModal("splitPaymentModal");
  showToast("Split payment configured. Proceeding to bill...", "info");
  checkoutOrder();
}

// --- 7. HELD CARTS (MULTIPLE SAVED CARTS) ---
function holdCurrentCart() {
  if (cart.length === 0) return showToast("Cannot hold an empty cart", "warning");

  const customer = document.getElementById("posCustomerSelect")?.value || "Walk-in";
  api.saveHeldCart({
    customer,
    items: [...cart],
    total: calculateCartTotals().grandTotal
  });

  cart = [];
  renderCart();
  updateHeldCartsCount();
  showToast("Cart placed on hold! You can now serve the next customer.", "info");
}

function updateHeldCartsCount() {
  const countEl = document.getElementById("heldCartsCount");
  if (countEl) countEl.textContent = api.getHeldCarts().length;
}

function openHeldCartsModal() {
  const list = api.getHeldCarts();
  const container = document.getElementById("heldCartsList");

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-pause"></i></div>
        <div class="empty-title">No held carts</div>
        <div class="empty-desc">Hold customer carts whenever checkout needs to be paused.</div>
      </div>
    `;
  } else {
    container.innerHTML = list.map(c => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 8px;">
        <div>
          <div style="font-weight: 700;">${escapeHTML(c.customer)} (${c.items.length} items)</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">${c.savedAt} - <strong>${formatCurrency(c.total)}</strong></div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-primary btn-sm" onclick="restoreHeldCart('${c.id}')"><i class="fa-solid fa-play"></i> Resume</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteHeldCart('${c.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join("");
  }

  openModal("heldCartsModal");
}

function restoreHeldCart(id) {
  const held = api.getHeldCarts().find(c => c.id === id);
  if (!held) return;

  if (cart.length > 0) {
    confirmAction("Current active cart has items. Replace with held cart?", () => {
      cart = [...held.items];
      api.deleteHeldCart(id);
      closeModal("heldCartsModal");
      renderCart();
      updateHeldCartsCount();
      showToast("Held cart restored!", "success");
    });
  } else {
    cart = [...held.items];
    api.deleteHeldCart(id);
    closeModal("heldCartsModal");
    renderCart();
    updateHeldCartsCount();
    showToast("Held cart restored!", "success");
  }
}

function deleteHeldCart(id) {
  api.deleteHeldCart(id);
  openHeldCartsModal();
  updateHeldCartsCount();
}

// --- 8. CHECKOUT & INVOICING ---
async function checkoutOrder() {
  if (isCheckingOut) return;
  if (cart.length === 0) {
    return showToast("Cart is empty! Add products before billing.", "warning");
  }

  // Khata verification
  const customerName = document.getElementById("posCustomerSelect")?.value || "Walk-in Customer";
  if (currentPaymentMethod === "Store Credit (Khata)" && customerName === "Walk-in Customer") {
    return showToast("Store Credit requires selecting a registered customer!", "warning");
  }

  isCheckingOut = true;
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Finalizing Transaction...`;
  }

  try {
    const { subtotal, tax, discount, grandTotal } = calculateCartTotals();

    const saleRecord = {
      customer: customerName,
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        itemDiscount: i.itemDiscount || 0,
        note: i.note || ""
      })),
      subtotal,
      tax,
      discount,
      total: grandTotal,
      paymentMethod: currentPaymentMethod,
      splitDetails,
      cashier: api.getCurrentUser().name,
      cashTendered: currentPaymentMethod === "Cash" ? Number(document.getElementById("cashTendered")?.value || grandTotal) : null
    };

    const createdSale = await api.createSale(saleRecord);
    activeReceiptSale = createdSale;

    // Render receipt & open preview
    renderReceiptModal(createdSale, currentReceiptFormat);
    openModal("receiptModal");

    // Reset Cart state
    cart = [];
    splitDetails = null;
    const discountEl = document.getElementById("cartDiscount");
    const tenderEl = document.getElementById("cashTendered");
    if (discountEl) discountEl.value = 0;
    if (tenderEl) tenderEl.value = "";
    renderCart();

    // Refresh products & stats
    posProducts = await api.getProducts();
    await updateTodaySalesSummary();
    renderPOSGrid();

    const syncStatusText = createdSale.serverConfirmed ? "Synced to server record" : "Queued in offline vault";
    showToast(`Invoice #${createdSale.id} generated! (${syncStatusText})`, "success");
  } catch (err) {
    console.error("Checkout error:", err);
    showToast("Checkout encountered an error: " + (err.message || "Unknown error"), "error");
  } finally {
    isCheckingOut = false;
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = `<i class="fa-solid fa-check-circle"></i> Complete Checkout & Bill [F10]`;
    }
  }
}

// Switch between Thermal 80mm and Professional A4 Tax Invoice
function switchReceiptFormat(format) {
  currentReceiptFormat = format;
  document.getElementById("btnReceiptThermal")?.classList.toggle("active", format === "thermal");
  document.getElementById("btnReceiptA4")?.classList.toggle("active", format === "a4");

  if (activeReceiptSale) {
    renderReceiptModal(activeReceiptSale, format);
  }
}

function renderReceiptModal(sale, format = "thermal") {
  const container = document.getElementById("receiptPrintArea");
  if (!container) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN") + " " + now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
  const serverFlagBadge = sale.serverConfirmed ? 
    '<span style="background: #ecfdf5; color: #059669; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">✓ Verified Server Transaction</span>' : 
    '<span style="background: #fffbeb; color: #d97706; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">⏳ Offline Queue - Local Idempotency Assured</span>';

  if (format === "thermal") {
    // 80mm Compact POS Receipt
    container.innerHTML = `
      <div class="receipt-paper">
        <div class="receipt-header">
          <h3>RetailHub Store</h3>
          <p style="font-size: 11px; margin: 2px 0;">Shop 14, Commercial Plaza, Bandra West, Mumbai - 400050</p>
          <p style="font-size: 11px; margin: 2px 0;">GSTIN: 27AABCR1234D1ZP | Tel: +91 98000 11111</p>
        </div>

        <div class="receipt-line">
          <span>Receipt #: <strong>${sale.id}</strong></span>
          <span>${escapeHTML(sale.paymentMethod)}</span>
        </div>
        <div class="receipt-line">
          <span>Date: ${dateStr}</span>
          <span>Cashier: ${escapeHTML(sale.cashier || 'Cashier')}</span>
        </div>
        <div class="receipt-line" style="margin-bottom: 8px;">
          <span>Customer: <strong>${escapeHTML(sale.customer)}</strong></span>
        </div>

        <div style="text-align: center; margin-bottom: 8px;">
          ${serverFlagBadge}
        </div>

        <div style="border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; padding: 6px 0; margin-bottom: 8px;">
          ${sale.items.map(item => `
            <div class="receipt-line">
              <span style="font-weight: 700;">${escapeHTML(item.name)}</span>
            </div>
            <div class="receipt-line" style="color: #64748b; font-size: 12px; margin-bottom: 4px;">
              <span>${item.qty} x ${formatCurrency(item.price)}</span>
              <span>${formatCurrency(item.qty * item.price)}</span>
            </div>
            ${item.note ? `<div style="font-size: 10px; color: #0284c7; margin-bottom: 2px;">Note: ${escapeHTML(item.note)}</div>` : ''}
          `).join("")}
        </div>

        <div class="receipt-line">
          <span>Subtotal:</span>
          <span>${formatCurrency(sale.subtotal)}</span>
        </div>
        <div class="receipt-line">
          <span>GST Tax (18%):</span>
          <span>${formatCurrency(sale.tax)}</span>
        </div>
        ${sale.discount > 0 ? `
          <div class="receipt-line" style="color: var(--danger);">
            <span>Discount:</span>
            <span>-${formatCurrency(sale.discount)}</span>
          </div>
        ` : ''}
        <div class="receipt-line" style="font-size: 16px; font-weight: 800; border-top: 1px solid #0f172a; padding-top: 6px; margin-top: 6px;">
          <span>Total Paid:</span>
          <span>${formatCurrency(sale.total)}</span>
        </div>

        ${sale.cashTendered ? `
          <div class="receipt-line" style="font-size: 11px; margin-top: 4px; color: #64748b;">
            <span>Cash Tendered:</span>
            <span>${formatCurrency(sale.cashTendered)}</span>
          </div>
          <div class="receipt-line" style="font-size: 11px; color: #64748b;">
            <span>Change Returned:</span>
            <span>${formatCurrency(Math.max(0, sale.cashTendered - sale.total))}</span>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 18px; font-size: 11px; color: #64748b;">
          <p style="margin: 2px 0;">Thank you for shopping at RetailHub!</p>
          <p style="margin: 2px 0;">Goods once sold can be exchanged within 7 days with bill.</p>
          <div style="margin-top: 8px; font-family: monospace; letter-spacing: 2px; font-weight: bold;">*** THANK YOU ***</div>
        </div>
      </div>
    `;
  } else {
    // Professional A4 Tax Invoice Format
    container.innerHTML = `
      <div style="padding: 24px; background: #fff; color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; color: #059669; font-size: 24px; font-weight: 800;">RetailHub Pvt Ltd</h2>
            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Shop 14, Commercial Plaza, Bandra West, Mumbai 400050</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">GSTIN: <strong>27AABCR1234D1ZP</strong> | CIN: U74999MH2024PTC123456</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 800; text-transform: uppercase;">TAX INVOICE</div>
            <div style="font-size: 14px; font-weight: 700; color: #059669;"># ${sale.id}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${dateStr}</div>
          </div>
        </div>

        <!-- Bill To -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12.5px;">
          <div style="background: #f8fafc; padding: 12px; border-radius: 6px; width: 48%;">
            <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Billed To (Customer):</strong>
            <div style="font-weight: 700; font-size: 14px; margin-top: 4px;">${escapeHTML(sale.customer)}</div>
            <div style="color: #64748b; margin-top: 2px;">Place of Supply: Maharashtra (27)</div>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 6px; width: 48%;">
            <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Transaction Details:</strong>
            <div>Payment Mode: <strong>${escapeHTML(sale.paymentMethod)}</strong></div>
            <div>Billed By: <strong>${escapeHTML(sale.cashier || 'Cashier')}</strong></div>
            <div style="margin-top: 4px;">${serverFlagBadge}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px;">
          <thead>
            <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 8px 10px; text-align: left;">#</th>
              <th style="padding: 8px 10px; text-align: left;">Description of Goods</th>
              <th style="padding: 8px 10px; text-align: center;">Qty</th>
              <th style="padding: 8px 10px; text-align: right;">Unit Price</th>
              <th style="padding: 8px 10px; text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map((item, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 10px;">${idx + 1}</td>
                <td style="padding: 8px 10px;">
                  <strong>${escapeHTML(item.name)}</strong>
                  ${item.note ? `<div style="font-size: 11px; color: #64748b;">${escapeHTML(item.note)}</div>` : ''}
                </td>
                <td style="padding: 8px 10px; text-align: center;">${item.qty}</td>
                <td style="padding: 8px 10px; text-align: right;">${formatCurrency(item.price)}</td>
                <td style="padding: 8px 10px; text-align: right; font-weight: 700;">${formatCurrency(item.qty * item.price)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <!-- Totals Breakdown -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
          <div style="width: 280px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Subtotal:</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>CGST (9%):</span>
              <span>${formatCurrency(sale.tax / 2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>SGST (9%):</span>
              <span>${formatCurrency(sale.tax / 2)}</span>
            </div>
            ${sale.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; color: var(--danger);">
                <span>Discount:</span>
                <span>-${formatCurrency(sale.discount)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #0f172a; margin-top: 6px; font-size: 16px; font-weight: 800;">
              <span>Grand Total:</span>
              <span style="color: #059669;">${formatCurrency(sale.total)}</span>
            </div>
          </div>
        </div>

        <!-- Footer / Signature -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 11px; color: #64748b;">
          <div>
            <p style="margin: 0;">1. Goods once sold are subject to store return policy.</p>
            <p style="margin: 0;">2. Disputes subject to Mumbai jurisdiction only.</p>
            <p style="margin: 0;">This is a computer generated invoice requiring no physical stamp.</p>
          </div>
          <div style="text-align: center; width: 180px;">
            <div style="border-bottom: 1px solid #94a3b8; height: 35px; margin-bottom: 4px;"></div>
            <span>Authorized Signatory</span>
          </div>
        </div>
      </div>
    `;
  }
}

// --- 9. HARDWARE BARCODE SCANNER & KEYBOARD SHORTCUTS ---
function setupGlobalHardwareScanner() {
  window.addEventListener("keydown", (e) => {
    // 1. Keyboard shortcuts (F1-F10)
    if (e.key === "F1" || (e.key === "/" && document.activeElement.tagName !== "INPUT")) {
      e.preventDefault();
      const search = document.getElementById("posSearch");
      if (search) search.focus();
      return;
    }

    if (e.key === "F2") {
      e.preventDefault();
      const custSelect = document.getElementById("posCustomerSelect");
      if (custSelect) custSelect.focus();
      return;
    }

    if (e.key === "F4") {
      e.preventDefault();
      const promoInput = document.getElementById("couponCodeInput");
      if (promoInput) promoInput.focus();
      return;
    }

    if (e.key === "F8") {
      e.preventDefault();
      holdCurrentCart();
      return;
    }

    if (e.key === "F9") {
      e.preventDefault();
      selectPaymentMethod("Cash");
      const cashInput = document.getElementById("cashTendered");
      if (cashInput) cashInput.focus();
      return;
    }

    if (e.key === "F10") {
      e.preventDefault();
      checkoutOrder();
      return;
    }

    if (e.key === "Escape") {
      closeModal("receiptModal");
      closeModal("heldCartsModal");
      closeModal("newCustomerModal");
      closeModal("splitPaymentModal");
      closeModal("shortcutsModal");
      return;
    }

    // 2. Hardware Scanner Detection: Scanners emit rapid characters ending with 'Enter'
    const now = Date.now();
    const interval = now - lastKeyTime;
    lastKeyTime = now;

    if (e.key === "Enter") {
      if (barcodeBuffer.length >= 6) {
        e.preventDefault();
        const scannedCode = barcodeBuffer.trim();
        barcodeBuffer = "";

        const foundProduct = posProducts.find(p => p.barcode && p.barcode.toLowerCase() === scannedCode.toLowerCase());
        if (foundProduct) {
          addToCart(foundProduct.id);
          showToast(`Scanner added: ${foundProduct.name}`, "success");
        } else {
          showToast(`Unknown barcode scanned: ${scannedCode}`, "error");
        }
      } else {
        barcodeBuffer = "";
      }
    } else if (e.key.length === 1 && interval < 60) {
      // Rapid sequential keys typed by USB scanner
      barcodeBuffer += e.key;
    } else if (interval > 150) {
      // Human typing speed: reset buffer
      barcodeBuffer = e.key.length === 1 ? e.key : "";
    }
  });
}

// Auto-run on DOM load
document.addEventListener("DOMContentLoaded", initPOS);
