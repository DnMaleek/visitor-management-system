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

async function loadUsers() {
  const users = await api("/admin/users");
  const el = document.getElementById("users");
  const countEl = document.getElementById("userCount");
  if (countEl) countEl.innerText = users.length;

  if (!users.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
      </div>
      <h3>No users yet</h3>
      <p>Create the first user using the form</p>
    </div>`;
    return;
  }

  el.innerHTML = users.map(u => `
    <div class="list-item">
      <div class="list-item-icon ${ROLE_COLORS[u.role] || 'blue'}">${userInitial(u.fullName)}</div>
      <div class="list-item-body">
        <div class="list-item-title">${u.fullName}</div>
        <div class="list-item-sub">${u.email || u.name || ""}</div>
      </div>
      ${userRoleBadge(u.role)}
    </div>
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

  await api("/admin/users", "POST", {
    name, fullName, email, password: "123456", role,
  });

  showToast("User created successfully");
  document.getElementById("uname").value     = "";
  document.getElementById("fullname").value  = "";
  document.getElementById("email").value     = "";
  loadUsers();
}
