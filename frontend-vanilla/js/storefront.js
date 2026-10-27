/**
 * RetailHub - Online Storefront Engine
 * Features:
 * - Public catalogue browsing, category filters, real-time search
 * - Cart drawer with quantity editing
 * - Online order checkout with payment provider abstraction
 * - Live inventory synchronization with backend POS ledger
 */

let storeProducts = [];
let storeCart = [];
let selectedStoreCategory = "ALL";

async function initStorefront() {
  storeProducts = await api.getProducts();
  renderStoreCatalog();
  updateStoreCartUI();
}

function setStoreCategory(cat) {
  selectedStoreCategory = cat;
  document.querySelectorAll("#storeCategoryPills .category-pill").forEach(pill => {
    const text = pill.textContent.trim().toLowerCase();
    const match = cat === "ALL" ? text === "all categories" : text === cat.toLowerCase();
    pill.classList.toggle("active", match);
  });
  renderStoreCatalog();
}

function filterStoreProducts() {
  renderStoreCatalog();
}

function renderStoreCatalog() {
  const grid = document.getElementById("storeCatalogGrid");
  if (!grid) return;

  const query = (document.getElementById("storeSearch")?.value || "").trim().toLowerCase();

  const filtered = storeProducts.filter(p => {
    const matchCat = selectedStoreCategory === "ALL" || p.category.toLowerCase() === selectedStoreCategory.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query));
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1;" class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <div class="empty-title">No matching products found</div>
        <div class="empty-desc">Check your search query or select another category.</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const stock = Number(p.stock || 0);
    const isOut = stock <= 0;

    return `
      <div class="store-card">
        <div class="pos-item-thumb" style="height: 140px; margin-bottom: 12px; border-radius: var(--radius-md);">
          <i class="fa-solid ${p.icon || 'fa-box'}" style="font-size: 48px;"></i>
          <span style="position: absolute; top: 8px; left: 8px; font-size: 11px; font-weight: 700; background: rgba(15,23,42,0.75); color: #fff; padding: 2px 8px; border-radius: 4px;">
            ${escapeHTML(p.category)}
          </span>
        </div>

        <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 4px;">SKU: ${escapeHTML(p.sku || 'N/A')}</div>
        <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; line-height: 1.3;">
          ${escapeHTML(p.name)}
        </div>

        <div style="font-size: 12px; margin-bottom: 12px;">
          ${isOut ? '<span style="color: var(--danger); font-weight: 700;">Out of Stock</span>' : `<span style="color: var(--success); font-weight: 600;">✓ In Stock (${stock} available)</span>`}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border-light);">
          <div style="font-size: 18px; font-weight: 800; color: var(--primary);">
            ${formatCurrency(p.price)}
          </div>
          <button class="btn btn-primary btn-sm" onclick="addToStoreCart('${p.id}')" ${isOut ? 'disabled' : ''}>
            <i class="fa-solid fa-cart-plus"></i> Add
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function addToStoreCart(productId) {
  const prod = storeProducts.find(p => p.id === productId);
  if (!prod) return;

  const existing = storeCart.find(i => i.id === productId);
  const available = Number(prod.stock || 0);

  if (available <= 0) return showToast("Product is out of stock", "error");

  if (existing) {
    if (existing.qty + 1 > available) {
      return showToast(`Only ${available} units available in stock`, "warning");
    }
    existing.qty += 1;
  } else {
    storeCart.push({
      id: prod.id,
      name: prod.name,
      price: Number(prod.price),
      qty: 1,
      maxStock: available
    });
  }

  updateStoreCartUI();
  showToast(`Added '${prod.name}' to cart!`, "success");
}

function updateStoreCartQty(id, delta) {
  const item = storeCart.find(i => i.id === id);
  if (!item) return;

  const newQty = item.qty + delta;
  if (newQty <= 0) {
    storeCart = storeCart.filter(i => i.id !== id);
  } else if (newQty > item.maxStock) {
    showToast(`Only ${item.maxStock} units available`, "warning");
    return;
  } else {
    item.qty = newQty;
  }

  updateStoreCartUI();
}

function updateStoreCartUI() {
  const badge = document.getElementById("storeCartBadge");
  const list = document.getElementById("storeCartItemsList");
  const totalEl = document.getElementById("storeCartTotal");

  const totalQty = storeCart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = storeCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const grandTotal = Math.round(subtotal * 1.18); // with 18% GST

  if (badge) badge.textContent = totalQty;
  if (totalEl) totalEl.textContent = formatCurrency(grandTotal);

  if (!list) return;

  if (storeCart.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-basket-shopping"></i></div>
        <div class="empty-title">Your cart is empty</div>
        <div class="empty-desc">Explore our catalog and add items to your cart.</div>
      </div>
    `;
    return;
  }

  list.innerHTML = storeCart.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-light);">
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 700; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHTML(item.name)}
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">
          ${formatCurrency(item.price)} each
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; margin: 0 14px;">
        <button class="qty-btn" onclick="updateStoreCartQty('${item.id}', -1)">-</button>
        <span style="font-weight: 700; font-size: 13px;">${item.qty}</span>
        <button class="qty-btn" onclick="updateStoreCartQty('${item.id}', 1)">+</button>
      </div>

      <div style="font-weight: 700; font-size: 14px; min-width: 65px; text-align: right;">
        ${formatCurrency(item.price * item.qty)}
      </div>
    </div>
  `).join("");
}

function proceedToCheckout() {
  if (storeCart.length === 0) return showToast("Your cart is empty!", "warning");

  const subtotal = storeCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const tax = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + tax;

  document.getElementById("checkoutSubtotal").textContent = formatCurrency(subtotal);
  document.getElementById("checkoutTax").textContent = formatCurrency(tax);
  document.getElementById("checkoutGrandTotal").textContent = formatCurrency(grandTotal);

  closeModal("storeCartModal");
  openModal("storeCheckoutModal");
}

async function handleStoreOrderSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("orderCustName")?.value.trim();
  const phone = document.getElementById("orderCustPhone")?.value.trim();
  const address = document.getElementById("orderAddress")?.value.trim();
  const paymentMethod = document.getElementById("orderPaymentMethod")?.value;

  if (!name || !phone || !address) {
    return showToast("Please fill in all required delivery details", "warning");
  }

  const btn = document.getElementById("btnPlaceOrder");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Order...`;

  try {
    const subtotal = storeCart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const tax = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + tax;

    const orderData = {
      customerName: name,
      phone,
      deliveryAddress: address,
      items: storeCart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      subtotal,
      tax,
      total: grandTotal,
      paymentMethod
    };

    const createdOrder = await api.placeStorefrontOrder(orderData);

    // Clear cart
    storeCart = [];
    updateStoreCartUI();

    // Close checkout modal & show success
    closeModal("storeCheckoutModal");
    document.getElementById("successInvoiceId").textContent = `#${createdOrder.id}`;
    openModal("orderSuccessModal");

    // Refresh catalog with new stock counts
    storeProducts = await api.getProducts();
    renderStoreCatalog();
  } catch (err) {
    console.error("Order submit error:", err);
    showToast("Failed to place order. Please try again.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Confirm & Place Order`;
  }
}

document.addEventListener("DOMContentLoaded", initStorefront);
