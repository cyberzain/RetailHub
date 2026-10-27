/**
 * RetailHub - Categories Controller
 */

let allCategories = [];

async function loadCategories() {
  allCategories = await api.getCategories();
  const products = await api.getProducts();

  // Compute live count of products in each category
  allCategories.forEach(cat => {
    cat.count = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
  });

  filterCategories();
}

function filterCategories() {
  const query = (document.getElementById("catSearch")?.value || "").toLowerCase().trim();

  const filtered = allCategories.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.code.toLowerCase().includes(query)
  );

  renderCategoriesTable(filtered);
}

function renderCategoriesTable(categories) {
  const tbody = document.getElementById("categoriesTableBody");
  if (!tbody) return;

  if (categories.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-tags"></i></div>
            <div class="empty-title">No categories found</div>
            <div class="empty-desc">Create categories to organize your shop inventory.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = categories.map(c => `
    <tr>
      <td>
        <div style="font-weight: 700; font-size: 14px;">${escapeHTML(c.name)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">ID: ${c.id}</div>
      </td>
      <td><code>${escapeHTML(c.code)}</code></td>
      <td>
        <span class="badge badge-info">${c.count || 0} Products</span>
      </td>
      <td>
        <span class="badge badge-success"><i class="fa-solid fa-check"></i> Active</span>
      </td>
      <td style="text-align: right;">
        <a href="products.html" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-eye"></i> View Products
        </a>
      </td>
    </tr>
  `).join("");
}

function openCategoryModal() {
  document.getElementById("catName").value = "";
  document.getElementById("catCode").value = "";
  openModal("categoryModal");
}

async function saveCategory(e) {
  e.preventDefault();
  const name = document.getElementById("catName").value.trim();
  const code = document.getElementById("catCode").value.trim().toUpperCase();

  await api.addCategory({ name, code });
  showToast("Category created!", "success");
  closeModal("categoryModal");
  await loadCategories();
}

document.addEventListener("DOMContentLoaded", loadCategories);
