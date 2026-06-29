// ── helpers ───────────────────────────────────────────────────
function visitorInitial(name) {
  return (name || "?").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
}

function statusBadge(status) {
  const map = {
    PENDING:     ["badge-pending",    "Pending"],
    APPROVED:    ["badge-approved",   "Approved"],
    CHECKED_IN:  ["badge-checked-in", "Checked In"],
    CHECKED_OUT: ["badge-checked-out","Checked Out"],
    REJECTED:    ["badge-rejected",   "Rejected"],
  };
  const [cls, label] = map[status] || ["badge-pending", status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// Derive a visual badge from status + boolean flags
function visitorStatusBadge(v) {
  if (v.checkedOut) return `<span class="badge badge-checked-out">Checked Out</span>`;
  if (v.checkedIn)  return `<span class="badge badge-checked-in">Checked In</span>`;
  return statusBadge(v.status);
}

function emptyState(icon, title, sub) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <h3>${title}</h3>
    <p>${sub}</p>
  </div>`;
}

const PERSON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>`;

// ── Register visitor ──────────────────────────────────────────
async function loadHostOptions() {
  const select = document.getElementById("host");
  if (!select) return;

  try {
    const hosts = await api("/admin/users/hosts");
    const list = Array.isArray(hosts) ? hosts : [];

    if (!list.length) {
      select.innerHTML = '<option value="">No hosts found</option>';
      return;
    }

    select.innerHTML =
      '<option value="">Select a host…</option>' +
      list.map(h => `<option value="${h.id}">${h.fullName}</option>`).join("");
  } catch (e) {
    select.innerHTML = '<option value="">Failed to load hosts</option>';
  }
}

async function registerVisitor() {
  const data = {
    fullName:     document.getElementById("fullName").value.trim(),
    phoneNumber:  document.getElementById("phone").value.trim(),
    hostId:       document.getElementById("host").value,
    purpose:      document.getElementById("purpose").value.trim(),
  };

  if (!data.fullName || !data.phoneNumber) {
    showToast("Please fill in at least the name and phone number", "error");
    return;
  }

  const result = await api("/visitors", "POST", data);
  if (result) {
    showToast("Visitor registered successfully");
    document.getElementById("visitorForm").querySelectorAll("input, textarea").forEach(el => el.value = "");
    // Reset select back to placeholder
    const sel = document.getElementById("host");
    if (sel) sel.selectedIndex = 0;
  }
}

// ── Approve / reject / check-in / check-out ───────────────────
async function approveVisitor(id) {
  await api(`/visitors/${id}/approve`, "PUT");
  showToast("Visitor approved");
  loadPendingVisitors();
}

async function rejectVisitor(id) {
  await api(`/visitors/${id}/reject`, "PUT");
  showToast("Visitor rejected", "error");
  loadPendingVisitors();
}

async function checkIn(id) {
  await api(`/visitors/${id}/check-in`, "PUT");
  showToast("Visitor checked in");
  loadCheckInVisitors();
}

async function checkOut(id) {
  await api(`/visitors/${id}/check-out`, "PUT");
  showToast("Visitor checked out");
  loadCheckOutVisitors();
}

// ── Pending visitors (HOST) ───────────────────────────────────
async function loadPendingVisitors() {
  const visitors = await api("/visitors/pending");
  const list = Array.isArray(visitors) ? visitors : [];
  const el = document.getElementById("visitorList");
  const countEl = document.getElementById("pendingCount");
  if (countEl) countEl.innerText = list.length;

  if (!list.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No pending visitors", "New visit requests will appear here");
    return;
  }

  el.innerHTML = list.map(v => `
    <div class="visitor-item">
      <div class="visitor-avatar">${visitorInitial(v.fullName)}</div>
      <div class="visitor-info">
        <div class="visitor-name">${v.fullName}</div>
        <div class="visitor-meta">
          <span>${v.purpose || "No purpose stated"}</span>
          ${v.phoneNumber ? `<span class="visitor-meta-dot"></span><span>${v.phoneNumber}</span>` : ""}
        </div>
      </div>
      <div class="visitor-actions">
        ${statusBadge("PENDING")}
        <button onclick="approveVisitor(${v.id})" class="btn btn-success">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
          Approve
        </button>
        <button onclick="rejectVisitor(${v.id})" class="btn btn-danger">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          Reject
        </button>
      </div>
    </div>
  `).join("");
}

// ── Check-in list (SECURITY) ──────────────────────────────────
async function loadCheckInVisitors() {
  const visitors = await api("/visitors/unchecked-in");
  const rawList = Array.isArray(visitors) ? visitors : [];
  // Rejected visitors only show in Today's Visitors, not here
  const list = rawList.filter(v => v.status !== "REJECTED");
  const el = document.getElementById("list");
  const countEl = document.getElementById("checkinCount");
  if (countEl) countEl.innerText = list.length;

  if (!list.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No visitors to check in", "Unchecked-in visitors will appear here");
    return;
  }

  el.innerHTML = list.map(v => `
    <div class="visitor-item">
      <div class="visitor-avatar">${visitorInitial(v.fullName)}</div>
      <div class="visitor-info">
        <div class="visitor-name">${v.fullName}</div>
        <div class="visitor-meta">
          <span>${v.purpose || "Visit"}</span>
          ${v.phoneNumber ? `<span class="visitor-meta-dot"></span><span>${v.phoneNumber}</span>` : ""}
          ${v.host ? `<span class="visitor-meta-dot"></span><span>Host: ${v.host.fullName}</span>` : ""}
        </div>
      </div>
      <div class="visitor-actions">
        <button onclick="checkIn(${v.id})" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-6a2.25 2.25 0 01-2.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25"/></svg>
          Check In
        </button>
      </div>
    </div>
  `).join("");
}

// ── Check-out list (SECURITY) ─────────────────────────────────
async function loadCheckOutVisitors() {
  const visitors = await api("/visitors/checked-in");
  const list = Array.isArray(visitors) ? visitors : [];
  const el = document.getElementById("list");
  const countEl = document.getElementById("checkoutCount");
  if (countEl) countEl.innerText = list.length;

  if (!list.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No visitors inside", "Checked-in visitors will appear here");
    return;
  }

  el.innerHTML = list.map(v => `
    <div class="visitor-item">
      <div class="visitor-avatar">${visitorInitial(v.fullName)}</div>
      <div class="visitor-info">
        <div class="visitor-name">${v.fullName}</div>
        <div class="visitor-meta">
          <span>${v.purpose || "Visit"}</span>
          ${v.phoneNumber ? `<span class="visitor-meta-dot"></span><span>${v.phoneNumber}</span>` : ""}
          ${v.host ? `<span class="visitor-meta-dot"></span><span>Host: ${v.host.fullName}</span>` : ""}
        </div>
      </div>
      <div class="visitor-actions">
        ${statusBadge(v.status)}
        <button onclick="checkOut(${v.id})" class="btn btn-danger">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
          Check Out
        </button>
      </div>
    </div>
  `).join("");
}

// ── Host's visitor history ────────────────────────────────────
async function loadHostVisitors() {
  const visitors = await api("/visitors/my");
  const list = Array.isArray(visitors) ? visitors : [];
  const el = document.getElementById("list");
  const countEl = document.getElementById("visitorCount");
  if (countEl) countEl.innerText = list.length;

  if (!list.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No visitor history yet", "Approved or rejected visitors assigned to you will appear here");
    return;
  }

  el.innerHTML = list.map(v => `
    <div class="visitor-item">
      <div class="visitor-avatar">${visitorInitial(v.fullName)}</div>
      <div class="visitor-info">
        <div class="visitor-name">${v.fullName}</div>
        <div class="visitor-meta">
          <span>${v.purpose || "Visit"}</span>
          ${v.phoneNumber ? `<span class="visitor-meta-dot"></span><span>${v.phoneNumber}</span>` : ""}
        </div>
      </div>
      <div class="visitor-actions">
        ${visitorStatusBadge(v)}
      </div>
    </div>
  `).join("");
}

// ── Today's visitors (SECURITY) ───────────────────────────────
async function loadTodayVisitors() {
  const visitors = await api("/visitors/today");
  const list = Array.isArray(visitors) ? visitors : [];
  const el = document.getElementById("list");
  const countEl = document.getElementById("todayCount");
  if (countEl) countEl.innerText = list.length;

  if (!list.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No visitors today", "No visitors have been recorded yet today");
    return;
  }

  el.innerHTML = list.map(v => `
    <div class="visitor-item">
      <div class="visitor-avatar">${visitorInitial(v.fullName)}</div>
      <div class="visitor-info">
        <div class="visitor-name">${v.fullName}</div>
        <div class="visitor-meta">
          <span>${v.purpose || "Visit"}</span>
          ${v.phoneNumber ? `<span class="visitor-meta-dot"></span><span>${v.phoneNumber}</span>` : ""}
          ${v.host ? `<span class="visitor-meta-dot"></span><span>Host: ${v.host.fullName}</span>` : ""}
        </div>
      </div>
      <div class="visitor-actions">
        ${visitorStatusBadge(v)}
      </div>
    </div>
  `).join("");
}

