/**
 * RetailHub - Global App Controller & Shell Helpers
 * Theme, notifications, profile menu, confirmations, and navigation
 */

// Safe HTML Escape to prevent XSS
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Currency Formatter
function formatCurrency(amount) {
  const settings = JSON.parse(localStorage.getItem("rh_settings") || "{}");
  const symbol = settings.currencySymbol || "₹";
  return symbol + " " + Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

// Toast notification system
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info"
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || 'fa-circle-info'}"></i>
    <div style="flex: 1;">${escapeHTML(message)}</div>
    <i class="fa-solid fa-xmark" style="cursor: pointer; opacity: 0.6;" onclick="this.parentElement.remove()"></i>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Reusable Confirmation Dialog
function openConfirmModal({ title = "Confirm Action", message = "Are you sure you want to proceed?", confirmText = "Confirm", onConfirm }) {
  let modal = document.getElementById("globalConfirmModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "globalConfirmModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title" id="confirmModalTitle">Confirm Action</h3>
          <button class="modal-close" onclick="closeModal('globalConfirmModal')"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" id="confirmModalBody" style="font-size: 14px; color: var(--text-muted); line-height: 1.5;">
          Are you sure?
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('globalConfirmModal')">Cancel</button>
          <button type="button" class="btn btn-primary" id="confirmModalBtn">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById("confirmModalTitle").textContent = title;
  document.getElementById("confirmModalBody").textContent = message;
  const btn = document.getElementById("confirmModalBtn");
  btn.textContent = confirmText;
  
  btn.onclick = () => {
    closeModal("globalConfirmModal");
    if (typeof onConfirm === "function") onConfirm();
  };

  openModal("globalConfirmModal");
}

// Modal open/close
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

// Global Theme Management (Light / Dark)
function initTheme() {
  const savedTheme = localStorage.getItem("retailhub_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("retailhub_theme", newTheme);
  updateThemeIcon(newTheme);
  showToast(`Switched to ${newTheme} mode`, "info");
}

function updateThemeIcon(theme) {
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.innerHTML = theme === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    btn.title = `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`;
  }
}

// Global Notifications Drawer
function toggleNotifications() {
  const panel = document.getElementById("notificationsPanel");
  if (panel) {
    panel.classList.toggle("active");
  }
}

function markAllNotificationsRead() {
  const dot = document.querySelector(".notif-badge-dot");
  if (dot) dot.style.display = "none";
  document.querySelectorAll(".notif-item.unread").forEach(i => i.classList.remove("unread"));
  showToast("All notifications marked as read", "info");
}

// Global Profile Menu
// Role & Route Access Definitions
const PUBLIC_PAGES = [
  "login.html",
  "signup.html",
  "forgot-password.html",
  "reset-password.html",
  "storefront.html"
];

const MANAGER_ONLY_PAGES = [
  "index.html",
  "reports.html",
  "staff.html",
  "expenses.html",
  "settings.html",
  "purchases.html",
  "suppliers.html",
  "branches.html",
  "ai-insights.html",
  "inventory.html"
];

function checkPageAuth() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  // Check if current page is public
  if (PUBLIC_PAGES.includes(currentPath)) {
    if (currentPath === "login.html" || currentPath === "signup.html") {
      const user = (typeof api !== "undefined") ? api.getCurrentUser() : null;
      const token = (typeof api !== "undefined") ? api.getToken() : null;
      if (token && user && user.status !== "Inactive") {
        const isSalesperson = user.role === "Salesperson" || user.role === "Cashier";
        window.location.replace(isSalesperson ? "pos.html" : "index.html");
      }
    }
    return;
  }

  // Protected page check
  if (typeof api === "undefined") return;

  const token = api.getToken();
  const user = api.getCurrentUser();

  if (!token || !user) {
    window.location.replace(`login.html?redirect=${encodeURIComponent(currentPath)}`);
    return;
  }

  if (user.status === "Inactive") {
    api.logout();
    window.location.replace("login.html?error=deactivated");
    return;
  }

  // Role check: If Salesperson visits Manager-only page
  const isSalesperson = user.role === "Salesperson" || user.role === "Cashier";
  if (isSalesperson && MANAGER_ONLY_PAGES.includes(currentPath)) {
    window.location.replace("pos.html?denied=1");
    return;
  }

  // Display access denied toast if redirected from a restricted page
  const params = new URLSearchParams(window.location.search);
  if (params.get("denied") || params.get("access_denied")) {
    setTimeout(() => {
      showToast("Access Restricted: That module is restricted to Store Managers and Owners.", "warning");
    }, 400);
  }
}

// Immediate execution of route protection
checkPageAuth();

function applyRoleBasedUI() {
  if (typeof api === "undefined") return;
  const user = api.getCurrentUser();
  if (!user) return;

  const isSalesperson = user.role === "Salesperson" || user.role === "Cashier";

  if (isSalesperson) {
    // Hide navigation links to manager-only pages
    document.querySelectorAll(".nav-link").forEach(link => {
      const href = link.getAttribute("href");
      if (href && MANAGER_ONLY_PAGES.includes(href)) {
        link.style.display = "none";
      }
    });

    // Hide entire sidebar sections that contain only restricted options
    document.querySelectorAll(".nav-section-title").forEach(title => {
      const text = title.textContent.trim().toLowerCase();
      if (text.includes("management") || text.includes("finance") || text.includes("store")) {
        title.style.display = "none";
      }
    });

    // Hide any confidential profit, cost, or margin elements
    document.querySelectorAll(".cogs-restricted, [data-role='manager-only']").forEach(el => {
      el.style.display = "none";
    });
  }
}

// Global Profile Menu & User Info Initializer
function initUserProfile() {
  if (typeof api === "undefined") return;
  const user = api.getCurrentUser();
  if (!user) return;

  const initials = user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "RH";

  // Update badge elements in topbar
  document.querySelectorAll(".user-avatar").forEach(el => el.textContent = initials);
  document.querySelectorAll(".user-name").forEach(el => el.textContent = user.name || "User");
  document.querySelectorAll(".user-role").forEach(el => {
    let displayRole = user.role;
    if (user.role === "Owner") displayRole = "Store Owner";
    else if (user.role === "Manager") displayRole = "Store Manager";
    else if (user.role === "Cashier" || user.role === "Salesperson") displayRole = "Salesperson";
    el.textContent = displayRole;
  });

  // Attach global user menu dropdown if user-badge exists
  const badges = document.querySelectorAll(".user-badge");
  badges.forEach(badge => {
    if (!badge.closest(".user-menu-wrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "user-menu-wrapper";
      wrapper.style.position = "relative";
      badge.parentNode.insertBefore(wrapper, badge);
      wrapper.appendChild(badge);

      const menu = document.createElement("div");
      menu.className = "dropdown-menu";
      menu.style.width = "250px";
      menu.innerHTML = `
        <div class="dropdown-header" style="display: flex; gap: 10px; align-items: center;">
          <div class="user-avatar" style="width: 38px; height: 38px; font-size: 14px; flex-shrink: 0;">${initials}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 13.5px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(user.name)}</div>
            <div style="font-size: 11.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(user.email || '')}</div>
            <div style="margin-top: 4px;">
              <span class="badge ${user.role === 'Owner' ? 'badge-purple' : (user.role === 'Manager' ? 'badge-primary' : 'badge-success')}" style="font-size: 10px; padding: 2px 7px;">
                ${user.role === 'Owner' ? '<i class="fa-solid fa-crown"></i> Store Owner' : (user.role === 'Manager' ? '<i class="fa-solid fa-user-shield"></i> Store Manager' : '<i class="fa-solid fa-cash-register"></i> Salesperson')}
              </span>
            </div>
          </div>
        </div>
        <div class="dropdown-divider"></div>
        ${user.role === 'Owner' || user.role === 'Manager' ? `
          <a href="index.html" class="dropdown-item">
            <i class="fa-solid fa-chart-pie"></i> Executive Dashboard
          </a>
          <a href="staff.html" class="dropdown-item">
            <i class="fa-solid fa-users-gear"></i> Manage Staff & Roles
          </a>
          <a href="settings.html" class="dropdown-item">
            <i class="fa-solid fa-gear"></i> Store Settings
          </a>
        ` : `
          <a href="pos.html" class="dropdown-item">
            <i class="fa-solid fa-cash-register"></i> POS Terminal
          </a>
          <a href="sales.html" class="dropdown-item">
            <i class="fa-solid fa-receipt"></i> My Sales History
          </a>
        `}
        <div class="dropdown-divider"></div>
        <a href="javascript:void(0)" onclick="handleLogout()" class="dropdown-item" style="color: var(--danger);">
          <i class="fa-solid fa-arrow-right-from-bracket" style="color: var(--danger);"></i> Sign Out
        </a>
      `;
      wrapper.appendChild(menu);

      badge.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle("active");
      };
    }
  });
}

// Global user profile toggle helper
function toggleUserMenu() {
  const menu = document.querySelector(".user-menu-wrapper .dropdown-menu");
  if (menu) menu.classList.toggle("active");
}

// Handle User Logout with confirmation dialog
function handleLogout() {
  openConfirmModal({
    title: "Sign Out",
    message: "Are you sure you want to sign out of your RetailHub session?",
    confirmText: "Sign Out",
    onConfirm: async () => {
      await api.logout();
      showToast("Signed out successfully", "info");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 400);
    }
  });
}

// Initialize Shell On Load
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  checkPageAuth();
  applyRoleBasedUI();
  initUserProfile();

  // Mobile drawer toggle
  const mobileToggle = document.querySelector(".mobile-menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      if (backdrop) backdrop.classList.toggle("active");
    });
  }

  if (backdrop && sidebar) {
    backdrop.addEventListener("click", () => {
      sidebar.classList.remove("open");
      backdrop.classList.remove("active");
    });
  }

  // Active navigation link highlighting
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Check backend server status
  const statusPill = document.getElementById("backend-status-text");
  const statusDot = document.getElementById("backend-dot");

  if (statusPill && statusDot && typeof api !== "undefined") {
    const status = await api.checkBackend();
    if (status.online) {
      statusPill.textContent = "API: Connected";
      statusDot.className = "backend-dot connected";
    } else {
      statusPill.textContent = "Mode: Mock Engine";
      statusDot.className = "backend-dot";
      statusDot.title = "Backend is offline or developing. Working in standalone mock engine.";
    }
  }

  // Offline detection & banner
  const offlineBanner = document.getElementById("offlineBanner");
  function checkOfflineState() {
    if (!navigator.onLine) {
      if (offlineBanner) offlineBanner.classList.add("active");
      showToast("You are offline. Sales will queue locally and sync automatically.", "warning");
    } else {
      if (offlineBanner) offlineBanner.classList.remove("active");
      // Attempt auto sync
      if (typeof api !== "undefined") {
        api.syncOfflineSales().then(res => {
          if (res.synced > 0) {
            showToast(`Synced ${res.synced} offline transaction(s) to server!`, "success");
          }
        });
      }
    }
  }

  window.addEventListener("online", checkOfflineState);
  window.addEventListener("offline", checkOfflineState);
  if (!navigator.onLine) checkOfflineState();

  // Close dropdowns on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu-wrapper")) {
      document.querySelectorAll(".user-menu-wrapper .dropdown-menu.active").forEach(m => m.classList.remove("active"));
    }
    if (!e.target.closest(".notifications-wrapper")) {
      const nPanel = document.getElementById("notificationsPanel");
      if (nPanel) nPanel.classList.remove("active");
    }
  });

  // Close modals on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
    }
  });
});
