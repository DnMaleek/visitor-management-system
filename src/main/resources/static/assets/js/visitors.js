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

// ── Host Visitor List Pagination & Search State ────────────────
let hostVisitors = [];
let hostFilteredVisitors = [];
let hostCurrentPage = 1;
const hostPageSize = 5;

function handleHostSearch() {
  const query = document.getElementById("searchHostVisitors").value.trim().toLowerCase();
  hostFilteredVisitors = hostVisitors.filter(v => {
    const name = (v.fullName || "").toLowerCase();
    const phone = (v.phoneNumber || "").toLowerCase();
    const purpose = (v.purpose || "").toLowerCase();
    return name.includes(query) || phone.includes(query) || purpose.includes(query);
  });
  hostCurrentPage = 1;
  renderHostPage();
}

function prevHostPage() {
  if (hostCurrentPage > 1) {
    hostCurrentPage--;
    renderHostPage();
  }
}

function nextHostPage() {
  const totalPages = Math.ceil(hostFilteredVisitors.length / hostPageSize);
  if (hostCurrentPage < totalPages) {
    hostCurrentPage++;
    renderHostPage();
  }
}

function renderHostPage() {
  const pendingEl = document.getElementById("visitorList");
  const listEl = document.getElementById("list");

  const totalCount = hostFilteredVisitors.length;
  const totalPages = Math.ceil(totalCount / hostPageSize) || 1;
  if (hostCurrentPage > totalPages) hostCurrentPage = totalPages;
  if (hostCurrentPage < 1) hostCurrentPage = 1;

  const startIdx = (hostCurrentPage - 1) * hostPageSize;
  const endIdx = Math.min(startIdx + hostPageSize, totalCount);
  const pageList = hostFilteredVisitors.slice(startIdx, endIdx);

  // Update counts
  if (document.getElementById("pendingCount")) {
    document.getElementById("pendingCount").innerText = totalCount;
  }
  if (document.getElementById("visitorCount")) {
    document.getElementById("visitorCount").innerText = totalCount;
  }

  // Update pagination UI
  const pageInfoEl = document.getElementById("hostPageInfo");
  if (pageInfoEl) {
    if (totalCount === 0) {
      pageInfoEl.innerText = "Showing 0 records";
    } else {
      pageInfoEl.innerText = `Showing ${startIdx + 1}-${endIdx} of ${totalCount} records`;
    }
  }

  const prevBtn = document.getElementById("hostPrevBtn");
  if (prevBtn) prevBtn.disabled = (hostCurrentPage === 1);

  const nextBtn = document.getElementById("hostNextBtn");
  if (nextBtn) nextBtn.disabled = (hostCurrentPage === totalPages);

  if (pendingEl) {
    if (!pageList.length) {
      pendingEl.innerHTML = emptyState(PERSON_ICON, "No pending visitors found", "Adjust search query or check back later");
      return;
    }

    pendingEl.innerHTML = pageList.map(v => `
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
  } else if (listEl) {
    if (!pageList.length) {
      listEl.innerHTML = emptyState(PERSON_ICON, "No visitors found", "Adjust search query or check back later");
      return;
    }

    listEl.innerHTML = pageList.map(v => `
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
}

// ── Pending visitors (HOST) ───────────────────────────────────
async function loadPendingVisitors() {
  const visitors = await api("/visitors/my-pending");
  hostVisitors = Array.isArray(visitors) ? visitors : [];
  hostFilteredVisitors = [...hostVisitors];
  hostCurrentPage = 1;
  const s = document.getElementById("searchHostVisitors");
  if (s) s.value = "";
  renderHostPage();
}

// ── Guard Visitor List Pagination & Search State ────────────────
let guardVisitors = [];
let guardFilteredVisitors = [];
let guardCurrentPage = 1;
const guardPageSize = 5;

function handleGuardSearch() {
  const query = document.getElementById("searchGuardVisitors").value.trim().toLowerCase();
  guardFilteredVisitors = guardVisitors.filter(v => {
    const name = (v.fullName || "").toLowerCase();
    const phone = (v.phoneNumber || "").toLowerCase();
    const purpose = (v.purpose || "").toLowerCase();
    const host = (v.host?.fullName || "").toLowerCase();
    return name.includes(query) || phone.includes(query) || purpose.includes(query) || host.includes(query);
  });
  guardCurrentPage = 1;
  renderGuardPage();
}

function prevGuardPage() {
  if (guardCurrentPage > 1) {
    guardCurrentPage--;
    renderGuardPage();
  }
}

function nextGuardPage() {
  const totalPages = Math.ceil(guardFilteredVisitors.length / guardPageSize);
  if (guardCurrentPage < totalPages) {
    guardCurrentPage++;
    renderGuardPage();
  }
}

function renderGuardPage() {
  const el = document.getElementById("list");
  if (!el) return;

  const totalCount = guardFilteredVisitors.length;
  const totalPages = Math.ceil(totalCount / guardPageSize) || 1;
  if (guardCurrentPage > totalPages) guardCurrentPage = totalPages;
  if (guardCurrentPage < 1) guardCurrentPage = 1;

  const startIdx = (guardCurrentPage - 1) * guardPageSize;
  const endIdx = Math.min(startIdx + guardPageSize, totalCount);
  const pageList = guardFilteredVisitors.slice(startIdx, endIdx);

  // Update counts
  if (document.getElementById("checkinCount")) {
    document.getElementById("checkinCount").innerText = totalCount;
  }
  if (document.getElementById("checkoutCount")) {
    document.getElementById("checkoutCount").innerText = totalCount;
  }
  if (document.getElementById("todayCount")) {
    document.getElementById("todayCount").innerText = totalCount;
  }

  // Update pagination UI
  const pageInfoEl = document.getElementById("guardPageInfo");
  if (pageInfoEl) {
    if (totalCount === 0) {
      pageInfoEl.innerText = "Showing 0 records";
    } else {
      pageInfoEl.innerText = `Showing ${startIdx + 1}-${endIdx} of ${totalCount} records`;
    }
  }

  const prevBtn = document.getElementById("guardPrevBtn");
  if (prevBtn) prevBtn.disabled = (guardCurrentPage === 1);

  const nextBtn = document.getElementById("guardNextBtn");
  if (nextBtn) nextBtn.disabled = (guardCurrentPage === totalPages);

  if (!pageList.length) {
    el.innerHTML = emptyState(PERSON_ICON, "No visitors found", "Adjust search query or register new visitor");
    return;
  }

  // Render based on active page type
  if (document.getElementById("checkinCount")) {
    el.innerHTML = pageList.map(v => `
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
  } else if (document.getElementById("checkoutCount")) {
    el.innerHTML = pageList.map(v => `
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
  } else if (document.getElementById("todayCount")) {
    el.innerHTML = pageList.map(v => `
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
}

// ── Check-in list (SECURITY) ──────────────────────────────────
async function loadCheckInVisitors() {
  const visitors = await api("/visitors/my-unchecked-in");
  const rawList = Array.isArray(visitors) ? visitors : [];
  guardVisitors = rawList.filter(v => v.status !== "REJECTED");
  guardFilteredVisitors = [...guardVisitors];
  guardCurrentPage = 1;
  const s = document.getElementById("searchGuardVisitors");
  if (s) s.value = "";
  renderGuardPage();
}

// ── Check-out list (SECURITY) ─────────────────────────────────
async function loadCheckOutVisitors() {
  const visitors = await api("/visitors/my-checked-in");
  const rawList = Array.isArray(visitors) ? visitors : [];
  guardVisitors = rawList.filter(v => v.status !== "PENDING");
  guardFilteredVisitors = [...guardVisitors];
  guardCurrentPage = 1;
  const s = document.getElementById("searchGuardVisitors");
  if (s) s.value = "";
  renderGuardPage();
}

// ── Host's visitor history ────────────────────────────────────
async function loadHostVisitors() {
  const visitors = await api("/visitors/my");
  hostVisitors = Array.isArray(visitors) ? visitors : [];
  hostFilteredVisitors = [...hostVisitors];
  hostCurrentPage = 1;
  const s = document.getElementById("searchHostVisitors");
  if (s) s.value = "";
  renderHostPage();
}

// ── Today's visitors (SECURITY) ───────────────────────────────
async function loadTodayVisitors() {
  const visitors = await api("/visitors/my-today");
  guardVisitors = Array.isArray(visitors) ? visitors : [];
  guardFilteredVisitors = [...guardVisitors];
  guardCurrentPage = 1;
  const s = document.getElementById("searchGuardVisitors");
  if (s) s.value = "";
  renderGuardPage();
}


