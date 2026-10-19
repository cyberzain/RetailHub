/**
 * RetailHub - Staff & Employee Role Management Controller
 * Strict Role-Based Access Control:
 * - Owners can manage all staff and assign Manager / Salesperson roles.
 * - Managers can view staff, create and deactivate Salesperson accounts.
 * - Salespeople cannot access this module.
 */

let staffMembers = [];

async function loadStaff() {
  staffMembers = await api.getStaff();
  computeStaffKPIs();
  filterStaff();
  configureRoleOptions();
}

function configureRoleOptions() {
  const currentUser = api.getCurrentUser();
  const optManager = document.getElementById("optRoleManager");
  const editRoleGroup = document.getElementById("editRoleGroup");

  // If logged-in user is a Manager (not Owner), they cannot create other Managers
  if (currentUser.role === "Manager") {
    if (optManager) optManager.disabled = true;
    if (editRoleGroup) editRoleGroup.style.display = "none";
  }
}

function computeStaffKPIs() {
  const total = staffMembers.length;
  const onDuty = staffMembers.filter(s => s.status === "Active").length;
  const cashiers = staffMembers.filter(s => s.role === "Salesperson" || s.role === "Cashier").length;
  const managers = staffMembers.filter(s => s.role === "Manager" || s.role === "Owner").length;

  const totalEl = document.getElementById("staffTotalCount");
  if (totalEl) totalEl.textContent = total;

  const dutyEl = document.getElementById("staffOnDutyCount");
  if (dutyEl) dutyEl.textContent = onDuty;

  const cashEl = document.getElementById("staffCashiersCount");
  if (cashEl) cashEl.textContent = cashiers;

  const mgrEl = document.getElementById("staffManagersCount");
  if (mgrEl) mgrEl.textContent = managers;
}

function filterStaff() {
  const query = (document.getElementById("staffSearch")?.value || "").toLowerCase().trim();

  const filtered = staffMembers.filter(s =>
    s.name.toLowerCase().includes(query) ||
    (s.role && s.role.toLowerCase().includes(query)) ||
    (s.email && s.email.toLowerCase().includes(query)) ||
    (s.phone && s.phone.includes(query))
  );

  renderStaffTable(filtered);
}

function renderStaffTable(staff) {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  const currentUser = api.getCurrentUser();

  if (staff.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state" style="padding: 36px 10px;">
            <div class="empty-icon"><i class="fa-solid fa-users"></i></div>
            <div class="empty-title">No staff members found</div>
            <div class="empty-desc">Create salespersons and store manager accounts to manage store operations.</div>
            <button class="btn btn-primary btn-sm" onclick="openAddStaffModal()">+ Add Staff Account</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = staff.map(s => {
    let roleBadge = `<span class="badge badge-success"><i class="fa-solid fa-cash-register"></i> Salesperson</span>`;
    if (s.role === "Owner") {
      roleBadge = `<span class="badge badge-purple"><i class="fa-solid fa-crown"></i> Store Owner</span>`;
    } else if (s.role === "Manager") {
      roleBadge = `<span class="badge badge-primary"><i class="fa-solid fa-user-shield"></i> Store Manager</span>`;
    }

    const isActive = s.status === "Active";
    const isSelf = s.id === currentUser.id;
    const isOwner = s.role === "Owner";
    const canToggle = !isSelf && !isOwner && !(currentUser.role === "Manager" && s.role === "Manager");

    return `
      <tr>
        <td>
          <div style="font-weight: 700; font-size: 14px; color: var(--text-main);">${escapeHTML(s.name)} ${isSelf ? '<span class="badge badge-info" style="font-size: 10px; margin-left: 4px;">You</span>' : ''}</div>
          <div style="font-size: 11px; color: var(--text-muted);">EMP ID: ${s.id} ${s.createdAt ? `· Joined ${s.createdAt}` : ''}</div>
        </td>
        <td>${roleBadge}</td>
        <td>
          <div style="font-size: 12.5px;"><i class="fa-solid fa-phone" style="font-size: 10.5px; color: var(--text-subtle); margin-right: 4px;"></i> ${escapeHTML(s.phone || 'No phone')}</div>
          <div style="font-size: 12px; color: var(--text-muted);"><i class="fa-solid fa-envelope" style="font-size: 10.5px; color: var(--text-subtle); margin-right: 4px;"></i> ${escapeHTML(s.email)}</div>
        </td>
        <td>
          <span style="font-size: 12.5px; font-weight: 500;">
            <i class="fa-regular fa-clock" style="color: var(--text-subtle); margin-right: 4px;"></i>${escapeHTML(s.shift || 'Full Day')}
          </span>
        </td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 11px;">
            <i class="fa-solid ${isActive ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
            ${isActive ? 'Active' : 'Deactivated'}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm" onclick="openEditStaffModal('${s.id}')" title="Edit Staff Details">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openResetStaffPassModal('${s.id}')" title="Reset Staff Password">
            <i class="fa-solid fa-key"></i>
          </button>
          ${canToggle ? `
            <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" onclick="promptToggleStaffStatus('${s.id}')" title="${isActive ? 'Deactivate account' : 'Activate account'}">
              ${isActive ? '<i class="fa-solid fa-ban"></i> Deactivate' : '<i class="fa-solid fa-check"></i> Activate'}
            </button>
          ` : `
            <button class="btn btn-sm btn-secondary" disabled style="opacity: 0.5;" title="Protected account">
              <i class="fa-solid fa-shield"></i>
            </button>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

function openAddStaffModal() {
  document.getElementById("newStaffName").value = "";
  document.getElementById("newStaffRole").value = "Salesperson";
  document.getElementById("newStaffShift").value = "Morning (09:00 - 17:00)";
  document.getElementById("newStaffEmail").value = "";
  document.getElementById("newStaffPhone").value = "";
  document.getElementById("newStaffPassword").value = "admin123";
  configureRoleOptions();
  openModal("addStaffModal");
}

async function saveNewStaff(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSaveStaff");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  const staffData = {
    name: document.getElementById("newStaffName").value.trim(),
    role: document.getElementById("newStaffRole").value,
    shift: document.getElementById("newStaffShift").value,
    email: document.getElementById("newStaffEmail").value.trim().toLowerCase(),
    phone: document.getElementById("newStaffPhone").value.trim(),
    password: document.getElementById("newStaffPassword").value,
    status: "Active"
  };

  try {
    const res = await api.createStaff(staffData);
    if (!res.success) {
      showToast(res.error || "Failed to create staff account", "error");
      btn.disabled = false;
      btn.innerHTML = "Create Account";
      return;
    }

    showToast(`Staff account for ${staffData.name} created successfully!`, "success");
    closeModal("addStaffModal");
    await loadStaff();
  } catch (err) {
    showToast("Server error occurred while adding staff", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Create Account";
  }
}

function openEditStaffModal(id) {
  const staff = staffMembers.find(s => s.id === id);
  if (!staff) return;

  document.getElementById("editStaffId").value = staff.id;
  document.getElementById("editStaffName").value = staff.name;
  document.getElementById("editStaffPhone").value = staff.phone || "";
  document.getElementById("editStaffShift").value = staff.shift || "Morning (09:00 - 17:00)";

  const editRole = document.getElementById("editStaffRole");
  if (editRole) {
    editRole.value = staff.role === "Owner" ? "Manager" : staff.role;
    if (staff.role === "Owner") {
      document.getElementById("editRoleGroup").style.display = "none";
    }
  }

  openModal("editStaffModal");
}

async function saveEditStaff(e) {
  e.preventDefault();
  const id = document.getElementById("editStaffId").value;
  const updates = {
    name: document.getElementById("editStaffName").value.trim(),
    phone: document.getElementById("editStaffPhone").value.trim(),
    shift: document.getElementById("editStaffShift").value
  };

  const editRoleGroup = document.getElementById("editRoleGroup");
  if (editRoleGroup && editRoleGroup.style.display !== "none") {
    updates.role = document.getElementById("editStaffRole").value;
  }

  const res = await api.updateStaff(id, updates);
  if (!res.success) {
    return showToast(res.error || "Failed to update employee details", "error");
  }

  showToast("Employee details updated successfully", "success");
  closeModal("editStaffModal");
  await loadStaff();
}

function promptToggleStaffStatus(id) {
  const staff = staffMembers.find(s => s.id === id);
  if (!staff) return;

  const isDeactivating = staff.status === "Active";
  const title = isDeactivating ? "Deactivate Account" : "Activate Account";
  const message = isDeactivating
    ? `Are you sure you want to deactivate ${staff.name}'s account? They will be immediately blocked from logging in to POS and store terminals.`
    : `Activate account for ${staff.name}? They will regain login access to the store.`;
  const confirmText = isDeactivating ? "Deactivate Account" : "Activate Account";

  openConfirmModal({
    title,
    message,
    confirmText,
    onConfirm: async () => {
      const res = await api.toggleStaffStatus(id);
      if (!res.success) {
        return showToast(res.error || "Could not change account status", "error");
      }
      showToast(res.message || `Account ${isDeactivating ? 'deactivated' : 'activated'}`, "info");
      await loadStaff();
    }
  });
}

function openResetStaffPassModal(id) {
  const staff = staffMembers.find(s => s.id === id);
  if (!staff) return;

  document.getElementById("resetPassStaffId").value = staff.id;
  document.getElementById("resetPassStaffName").textContent = staff.name;
  document.getElementById("staffNewPassword").value = "";
  openModal("resetStaffPassModal");
}

async function saveStaffPassReset(e) {
  e.preventDefault();
  const id = document.getElementById("resetPassStaffId").value;
  const newPassword = document.getElementById("staffNewPassword").value;

  if (newPassword.length < 6) {
    return showToast("Password must be at least 6 characters long", "warning");
  }

  const res = await api.resetStaffPassword(id, newPassword);
  if (!res.success) {
    return showToast(res.error || "Could not reset password", "error");
  }

  showToast("Staff password updated successfully!", "success");
  closeModal("resetStaffPassModal");
}

document.addEventListener("DOMContentLoaded", loadStaff);
