function userRoleBadge(role) {
  const map = {
    ADMIN:          ["badge-checked-in",  "Admin"],
    HOST:           ["badge-approved",    "Host"],
    SECURITY_GUARD: ["badge-pending",     "Security"],
  };
  const [cls, label] = map[role] || ["badge-pending", role];
  return `<span class="badge ${cls}">${label}</span>`;
}

function userInitial(name) {
  return (name || "?").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
}

const ROLE_COLORS = { ADMIN: "blue", HOST: "green", SECURITY_GUARD: "amber" };

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const pageSize = 10;

async function loadUsers() {
  const users = await api("/admin/users");
  allUsers = Array.isArray(users) ? users : [];
  filteredUsers = [...allUsers];
  currentPage = 1;
  const searchEl = document.getElementById("searchInput");
  if (searchEl) searchEl.value = "";
  renderTable();
}

function handleSearch() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  filteredUsers = allUsers.filter(u => 
    (u.fullName || "").toLowerCase().includes(q) ||
    (u.name || "").toLowerCase().includes(q) ||
    (u.email || "").toLowerCase().includes(q) ||
    (u.role || "").toLowerCase().includes(q)
  );
  currentPage = 1;
  renderTable();
}

function prevPage() {
  if (currentPage > 1) { currentPage--; renderTable(); }
}
function nextPage() {
  if (currentPage * pageSize < filteredUsers.length) { currentPage++; renderTable(); }
}

function renderTable() {
  const el = document.getElementById("users");
  const countEl = document.getElementById("userCount");
  if (countEl) countEl.innerText = filteredUsers.length;

  const total = filteredUsers.length;
  const startIdx = (currentPage - 1) * pageSize;
  const list = filteredUsers.slice(startIdx, startIdx + pageSize);

  const pageInfo = document.getElementById("pageInfo");
  if (pageInfo) {
    pageInfo.innerText = total === 0 ? "No records" : `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, total)} of ${total}`;
  }
  const prevBtn = document.getElementById("prevBtn");
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.disabled = currentPage * pageSize >= total;

  if (!list.length) {
    el.innerHTML = `<tr><td colspan="5"><div class="empty-state">
      <div class="empty-state-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
      </div>
      <h3>No users found</h3>
      <p>Try adjusting your search query</p>
    </div></td></tr>`;
    return;
  }

  el.innerHTML = list.map(u => `
    <tr>
      <td>
        <div class="user-cell">
          <div class="table-icon ${ROLE_COLORS[u.role] || 'blue'}">${userInitial(u.fullName)}</div>
          <div class="primary-text">${u.fullName}</div>
        </div>
      </td>
      <td style="color:var(--slate-600); font-size:13px;">${u.name}</td>
      <td style="color:var(--slate-600); font-size:13px;">${u.email || "—"}</td>
      <td>
        ${userRoleBadge(u.role)}
      </td>
      <td>
        <div class="actions-cell">
          <button onclick="deleteUser(${u.id})" class="btn btn-danger" style="display: inline-flex; align-items: center; justify-content: center; padding: 6px; border-radius: 6px;" title="Delete User">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function createUser() {
  const name     = document.getElementById("uname").value.trim();
  const fullName = document.getElementById("fullname").value.trim();
  const email    = document.getElementById("email").value.trim();
  const role     = document.getElementById("role").value;

  if (!name || !fullName) {
    showToast("Username and full name are required", "error");
    return;
  }

  // The password field is omitted, the backend will auto-assign the default password "123456"
  await api("/admin/users", "POST", {
    name, fullName, email, role,
  });

  showToast("User created successfully");
  document.getElementById("uname").value     = "";
  document.getElementById("fullname").value  = "";
  document.getElementById("email").value     = "";
  closeUserModal();
  loadUsers();
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user? This will also unassign them from any visitor records.")) {
    return;
  }

  try {
    await api("/admin/users/" + id, "DELETE");
    showToast("User deleted successfully");
    loadUsers();
  } catch (error) {
    showToast("Failed to delete user", "error");
  }
}

function openUserModal() {
  document.getElementById("userModal").classList.add("active");
}

function closeUserModal() {
  document.getElementById("userModal").classList.remove("active");
}

