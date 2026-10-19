/**
 * RetailHub - Products Controller with Pagination, Sorting & Validation
 */

let allProducts = [];
let currentPage = 1;
const pageSize = 8;

async function loadProducts() {
  allProducts = await api.getProducts();
  filterProducts();
}

function calculateMarginPreview() {
  const cost = Number(document.getElementById("prodCost")?.value || 0);
  const price = Number(document.getElementById("prodPrice")?.value || 0);
  const marginPreview = document.getElementById("marginPreview");

  if (price > 0) {
    const margin = (((price - cost) / price) * 100).toFixed(1);
    marginPreview.value = `${margin}%`;
    marginPreview.style.color = margin > 15 ? "var(--success)" : "var(--danger)";
  } else {
    marginPreview.value = "0.0%";
  }
}

function filterProducts() {
  const searchTerm = (document.getElementById("productSearch")?.value || "").toLowerCase().trim();
  const category = document.getElementById("categoryFilter")?.value || "ALL";
  const stockLevel = document.getElementById("stockFilter")?.value || "ALL";
  const sortBy = document.getElementById("sortBy")?.value || "name_asc";

  let filtered = allProducts.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm)) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm));

    const matchCategory = category === "ALL" || p.category === category;

    let matchStock = true;
    const stock = Number(p.stock || 0);
    const min = Number(p.minStock || 5);

    if (stockLevel === "IN_STOCK") matchStock = stock > min;
    else if (stockLevel === "LOW_STOCK") matchStock = stock > 0 && stock <= min;
    else if (stockLevel === "OUT_OF_STOCK") matchStock = stock === 0;

    return matchSearch && matchCategory && matchStock;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "stock_desc") return b.stock - a.stock;
    return 0;
  });

  // Pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

  renderProductsTable(paginatedItems);
  renderPagination(totalItems, totalPages);
}

function renderProductsTable(products) {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-box-open"></i></div>
            <div class="empty-title">No products found</div>
            <div class="empty-desc">Try clearing filters or add your first inventory item.</div>
            <button class="btn btn-primary btn-sm" onclick="openProductModal()">+ Add Product</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const cost = Number(p.cost || 0);
    const price = Number(p.price || 0);
    const stock = Number(p.stock || 0);
    const minStock = Number(p.minStock || 5);
    const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : 0;

    let stockBadge = `<span class="badge badge-success"><i class="fa-solid fa-check"></i> ${stock} in stock</span>`;
    if (stock === 0) {
      stockBadge = `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Out of stock</span>`;
    } else if (stock <= minStock) {
      stockBadge = `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Low (${stock})</span>`;
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700; font-size: 13.5px;">${escapeHTML(p.name)}</div>
          <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 8px; margin-top: 2px;">
            <span class="badge badge-gray">${escapeHTML(p.category)}</span>
            <span>Unit: ${escapeHTML(p.unit || 'Pcs')}</span>
            <span>ID: ${p.id}</span>
          </div>
        </td>
        <td>
          <div style="font-family: monospace; font-size: 12px;">${escapeHTML(p.sku || 'N/A')}</div>
          <div style="font-size: 11px; color: var(--text-subtle);"><i class="fa-solid fa-barcode"></i> ${escapeHTML(p.barcode || '—')}</div>
        </td>
        <td>${formatCurrency(cost)}</td>
        <td><strong>${formatCurrency(price)}</strong></td>
        <td>
          <div style="font-size: 12.5px; font-weight: 600; color: ${margin > 20 ? 'var(--success)' : 'var(--text-muted)'};">
            ${margin}% Margin
          </div>
          <div style="font-size: 10.5px; color: var(--text-muted);">${p.taxRate || 18}% GST</div>
        </td>
        <td>${stockBadge}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" title="Edit Product" onclick="editProduct('${p.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" title="Delete Product" onclick="confirmDeleteProduct('${p.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderPagination(totalItems, totalPages) {
  const info = document.getElementById("paginationInfo");
  const controls = document.getElementById("paginationControls");
  if (!info || !controls) return;

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  info.textContent = `Showing ${start} to ${end} of ${totalItems} products`;

  let html = `
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
    `;
  }

  html += `
    <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  controls.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  filterProducts();
}

function openProductModal() {
  document.getElementById("modalTitle").textContent = "Add New Product";
  document.getElementById("prodId").value = "";
  document.getElementById("prodName").value = "";
  document.getElementById("prodCategory").value = "Electronics";
  document.getElementById("prodUnit").value = "Pcs";
  document.getElementById("prodSku").value = "";
  document.getElementById("prodCost").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodTax").value = "18";
  document.getElementById("prodStock").value = "10";
  document.getElementById("prodMinStock").value = "5";
  document.getElementById("prodBarcode").value = "";
  document.getElementById("prodVariants").value = "";
  calculateMarginPreview();
  openModal("productModal");
}

function editProduct(id) {
  const p = allProducts.find(item => item.id === id);
  if (!p) return;

  document.getElementById("modalTitle").textContent = "Edit Product Details";
  document.getElementById("prodId").value = p.id;
  document.getElementById("prodName").value = p.name;
  document.getElementById("prodCategory").value = p.category;
  document.getElementById("prodUnit").value = p.unit || "Pcs";
  document.getElementById("prodSku").value = p.sku || "";
  document.getElementById("prodCost").value = p.cost || "";
  document.getElementById("prodPrice").value = p.price;
  document.getElementById("prodTax").value = p.taxRate || 18;
  document.getElementById("prodStock").value = p.stock;
  document.getElementById("prodMinStock").value = p.minStock || 5;
  document.getElementById("prodBarcode").value = p.barcode || "";
  document.getElementById("prodVariants").value = p.variants || "";

  calculateMarginPreview();
  openModal("productModal");
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById("prodId").value;
  const sku = document.getElementById("prodSku").value.trim();
  const barcode = document.getElementById("prodBarcode").value.trim();

  // Duplicate validation
  if (!id) {
    if (sku && allProducts.some(p => p.sku === sku)) {
      return showToast(`Duplicate SKU '${sku}' already exists!`, "error");
    }
  }

  const productData = {
    name: document.getElementById("prodName").value.trim(),
    category: document.getElementById("prodCategory").value,
    unit: document.getElementById("prodUnit").value,
    sku: sku || ("SKU-" + Math.floor(1000 + Math.random() * 9000)),
    cost: Number(document.getElementById("prodCost").value) || 0,
    price: Number(document.getElementById("prodPrice").value) || 0,
    taxRate: Number(document.getElementById("prodTax").value) || 18,
    stock: Number(document.getElementById("prodStock").value) || 0,
    minStock: Number(document.getElementById("prodMinStock").value) || 5,
    barcode: barcode || String(Math.floor(890000000000 + Math.random() * 99999999)),
    variants: document.getElementById("prodVariants").value.trim()
  };

  if (id) {
    await api.updateProduct(id, productData);
    showToast("Product updated successfully!", "success");
  } else {
    await api.addProduct(productData);
    showToast("Product added to catalog!", "success");
  }

  closeModal("productModal");
  await loadProducts();
}

function confirmDeleteProduct(id) {
  openConfirmModal({
    title: "Delete Product",
    message: "Are you sure you want to delete this product from your inventory catalog? This action cannot be undone.",
    confirmText: "Delete Product",
    onConfirm: async () => {
      await api.deleteProduct(id);
      showToast("Product removed", "info");
      await loadProducts();
    }
  });
}

function generateBarcode() {
  const code = "890" + Math.floor(100000000 + Math.random() * 900000000);
  document.getElementById("prodBarcode").value = code;
}

function exportProductsCSV() {
  if (!allProducts.length) return showToast("No products to export", "warning");

  let csv = "ID,Name,Category,Unit,SKU,Barcode,Cost,Price,TaxRate,Stock\n";
  allProducts.forEach(p => {
    csv += `"${p.id}","${p.name}","${p.category}","${p.unit || 'Pcs'}","${p.sku || ''}","${p.barcode || ''}",${p.cost || 0},${p.price || 0},${p.taxRate || 18},${p.stock || 0}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `retailhub-products-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  showToast("Products CSV exported!", "success");
}

document.addEventListener("DOMContentLoaded", loadProducts);
