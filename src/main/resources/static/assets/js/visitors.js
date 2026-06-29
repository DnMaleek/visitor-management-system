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

function emptyState(icon, title, sub) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <h3>${title}</h3>
    <p>${sub}</p>
  </div>`;
}

const PERSON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>`;

// ── Register visitor ──────────────────────────────────────────
async function registerVisitor() {
  const data = {
    fullName:     document.getElementById("fullName").value.trim(),
    phoneNumber:  document.getElementById("phone").value.trim(),
    departmentId: document.getElementById("department").value.trim(),
    hostId:       document.getElementById("host").value.trim(),
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
  const el = document.getElementById("visitorList");
  const countEl = document.getElementById("pendingCount");
  if (countEl) countEl.innerText = visitors.length;

  if (!visitors.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No pending visitors", "New visit requests will appear here");
    return;
  }

  el.innerHTML = visitors.map(v => `
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
  const visitors = await api("/visitors/today");
  const approved = visitors.filter(v => v.status === "APPROVED");
  const el = document.getElementById("list");
  const countEl = document.getElementById("checkinCount");
  if (countEl) countEl.innerText = approved.length;

  if (!approved.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No visitors to check in", "Approved visitors will appear here");
    return;
  }

  el.innerHTML = approved.map(v => `
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
        ${statusBadge("APPROVED")}
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
  const visitors = await api("/visitors/today");
  const inside = visitors.filter(v => v.status === "CHECKED_IN");
  const el = document.getElementById("list");
  const countEl = document.getElementById("checkoutCount");
  if (countEl) countEl.innerText = inside.length;

  if (!inside.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No visitors inside", "Checked-in visitors will appear here");
    return;
  }

  el.innerHTML = inside.map(v => `
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
        ${statusBadge("CHECKED_IN")}
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
  const id = localStorage.getItem("userId");
  const visitors = await api("/visitors/host/" + id);
  const el = document.getElementById("list");
  const countEl = document.getElementById("visitorCount");
  if (countEl) countEl.innerText = visitors.length;

  if (!visitors.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No visitors yet", "Visitors assigned to you will appear here");
    return;
  }

  el.innerHTML = visitors.map(v => `
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
        ${statusBadge(v.status)}
      </div>
    </div>
  `).join("");
}
