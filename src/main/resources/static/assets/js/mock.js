/**
 * mock.js — drop this in to run the frontend without a backend.
 * It overrides: api(), requireAuth(), requireRole(), login()
 * and seeds localStorage so the sidebar/navbar render correctly.
 *
 * To switch roles, change MOCK_ROLE below to:
 *   "ADMIN" | "HOST" | "SECURITY_GUARD"
 */

const MOCK_ROLE = "ADMIN"; // ← change this to preview different roles

// ── Seed auth state so guards & layout work ──────────────────
localStorage.setItem("token",    "mock-token-123");
localStorage.setItem("role",     MOCK_ROLE);
localStorage.setItem("username", MOCK_ROLE === "ADMIN" ? "admin" : MOCK_ROLE === "HOST" ? "jane.host" : "guard.john");
localStorage.setItem("userId",   "1");

// ── Fake data store ──────────────────────────────────────────
const MOCK_DATA = {
  dashboard: {
    totalVisitors: 142,
    pendingVisitors: 8,
    approvedVisitors: 31,
    checkedVisitors: 17,
  },

  visitors: [
    { id: 1, fullName: "Alice Mwangi",   purpose: "Business Meeting",   status: "PENDING",    hostId: 2 },
    { id: 2, fullName: "Bob Kamau",      purpose: "Job Interview",      status: "APPROVED",   hostId: 2 },
    { id: 3, fullName: "Carol Odhiambo", purpose: "Document Delivery",  status: "CHECKED_IN", hostId: 3 },
    { id: 4, fullName: "David Otieno",   purpose: "Site Inspection",    status: "PENDING",    hostId: 2 },
    { id: 5, fullName: "Eva Njoroge",    purpose: "Training Session",   status: "CHECKED_OUT",hostId: 3 },
    { id: 6, fullName: "Frank Mutua",    purpose: "Client Visit",       status: "APPROVED",   hostId: 2 },
  ],

  users: [
    { id: 1, fullName: "System Admin",   name: "admin",      email: "admin@company.com",      role: "ADMIN" },
    { id: 2, fullName: "Jane Host",      name: "jane.host",  email: "jane@company.com",        role: "HOST" },
    { id: 3, fullName: "John Guard",     name: "guard.john", email: "john.guard@company.com",  role: "SECURITY_GUARD" },
    { id: 4, fullName: "Mary Supervisor",name: "mary.s",     email: "mary@company.com",        role: "HOST" },
  ],

  departments: [
    { id: 1, name: "Human Resources",    description: "HR & Recruitment" },
    { id: 2, name: "Engineering",        description: "Software & Infrastructure" },
    { id: 3, name: "Finance",            description: "Accounts & Budgeting" },
    { id: 4, name: "Sales & Marketing",  description: "Business Development" },
  ],
};

// ── Route mock API responses ─────────────────────────────────
async function api(endpoint, method = "GET", body = null) {
  // Simulate a tiny network delay so it feels real
  await new Promise(r => setTimeout(r, 180));

  console.log(`[MOCK API] ${method} ${endpoint}`, body || "");

  // POST actions — mutate the mock store and return success
  if (method === "POST") {
    if (endpoint === "/visitors") {
      const v = { id: Date.now(), ...body, status: "PENDING" };
      MOCK_DATA.visitors.push(v);
      return { success: true, data: v };
    }
    if (endpoint === "/admin/users") {
      const u = { id: Date.now(), ...body };
      MOCK_DATA.users.push(u);
      return { success: true, data: u };
    }
    if (endpoint === "/admin/departments") {
      const d = { id: Date.now(), ...body };
      MOCK_DATA.departments.push(d);
      return { success: true, data: d };
    }
  }

  // PUT actions
  if (method === "PUT") {
    const idMatch = endpoint.match(/\/visitors\/(\d+)\/(approve|reject|check-in|check-out)/);
    if (idMatch) {
      const [, id, action] = idMatch;
      const v = MOCK_DATA.visitors.find(v => v.id === +id);
      if (v) {
        v.status = action === "approve" ? "APPROVED"
                 : action === "reject"  ? "REJECTED"
                 : action === "check-in" ? "CHECKED_IN"
                 : "CHECKED_OUT";
      }
      return { success: true };
    }
  }

  // GET routes
  if (endpoint === "/admin/dashboard") return MOCK_DATA.dashboard;
  if (endpoint === "/admin/users")     return MOCK_DATA.users;
  if (endpoint === "/admin/departments") return MOCK_DATA.departments;
  if (endpoint === "/visitors/pending")  return MOCK_DATA.visitors.filter(v => v.status === "PENDING");
  if (endpoint === "/visitors/today")    return MOCK_DATA.visitors.filter(v => ["APPROVED","CHECKED_IN"].includes(v.status));
  if (endpoint.startsWith("/visitors/host/")) return MOCK_DATA.visitors.filter(v => v.hostId === 2);

  // Fallback
  console.warn("[MOCK API] Unhandled endpoint:", endpoint);
  return [];
}

// ── Bypass auth guards ───────────────────────────────────────
function requireAuth() { /* skipped in mock mode */ }
function requireRole() { /* skipped in mock mode */ }

// ── Mock login — auto-redirects based on MOCK_ROLE ───────────
async function login() {
  redirectUser(MOCK_ROLE);
}

// ── Handy role-switcher banner ───────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const bar = document.createElement("div");
  bar.style.cssText = `
    position:fixed; bottom:0; left:0; right:0; z-index:9999;
    background:#1e293b; color:#94a3b8;
    font-family:monospace; font-size:12px;
    display:flex; align-items:center; gap:12px; padding:8px 16px;
    border-top:1px solid #334155;
  `;
  bar.innerHTML = `
    <span style="color:#f59e0b;font-weight:bold;">⚡ MOCK MODE</span>
    <span>Role:</span>
    <select id="mockRoleSwitch" style="background:#0f172a;color:#e2e8f0;border:1px solid #475569;border-radius:4px;padding:2px 6px;font-family:monospace;font-size:12px;">
      <option value="ADMIN"          ${MOCK_ROLE==="ADMIN"?"selected":""}>ADMIN</option>
      <option value="HOST"           ${MOCK_ROLE==="HOST"?"selected":""}>HOST</option>
      <option value="SECURITY_GUARD" ${MOCK_ROLE==="SECURITY_GUARD"?"selected":""}>SECURITY_GUARD</option>
    </select>
    <button id="mockApplyRole" style="background:#3b82f6;color:#fff;border:none;border-radius:4px;padding:3px 10px;cursor:pointer;font-family:monospace;font-size:12px;">Apply & Reload</button>
    <span style="margin-left:auto;color:#475569;">No backend required</span>
  `;
  document.body.appendChild(bar);

  document.getElementById("mockApplyRole").addEventListener("click", () => {
    const chosen = document.getElementById("mockRoleSwitch").value;
    localStorage.setItem("role", chosen);
    localStorage.setItem("username", chosen === "ADMIN" ? "admin" : chosen === "HOST" ? "jane.host" : "guard.john");
    // Redirect to the right landing page for that role
    const dest = chosen === "ADMIN" ? "/pages/admin/dashboard.html"
               : chosen === "HOST"  ? "/pages/host/pending.html"
               : "/pages/security/register.html";
    location.href = dest;
  });
});
