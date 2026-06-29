/**
 * profile.js — handles GET/PUT /api/users/profile
 *
 * Depends on:
 *  - api()       from api.js   (auto-unwraps ApiResponse.data)
 *  - apiRaw()    from api.js   (returns the full ApiResponse object)
 *  - showToast() from layout.js
 */

// Keep the original username so we can detect changes
let _originalName = "";

// ── Load & render profile ────────────────────────────────────
async function loadProfile() {
  try {
    const user = await api("/users/profile");

    _originalName = user.name || "";

    // ── Hero card ────────────────────────────────────
    refreshHero(user);

    // ── Pre-fill edit form ───────────────────────────
    document.getElementById("editName").value     = user.name     || "";
    document.getElementById("editFullName").value = user.fullName || "";
    document.getElementById("editEmail").value    = user.email    || "";

  } catch (err) {
    console.error("Failed to load profile:", err);
    showToast("Failed to load profile", "error");
  }
}

// ── Refresh hero card from a user object ─────────────────────
function refreshHero(user) {
  const fullName = user.fullName || user.name || "User";
  const initials = fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  document.getElementById("heroInitial").textContent  = initials;
  document.getElementById("heroFullName").textContent = fullName;
  document.getElementById("heroUsername").textContent = `@${user.name}`;
  document.getElementById("heroBadge").textContent    = (user.role || "").replace(/_/g, " ");
  document.getElementById("heroEmail").textContent    = user.email || "";
}

// ── Show username-change warning banner ───────────────────────
function checkNameChange() {
  const newName = document.getElementById("editName").value.trim();
  const banner  = document.getElementById("usernameWarn");
  banner.style.display = (newName && newName !== _originalName) ? "flex" : "none";
}

// ── Save profile info (name, fullName, email) ─────────────────
async function saveProfileInfo() {
  const name     = document.getElementById("editName").value.trim();
  const fullName = document.getElementById("editFullName").value.trim();
  const email    = document.getElementById("editEmail").value.trim();

  if (!name) {
    showToast("Username cannot be empty", "error");
    return;
  }
  if (!fullName) {
    showToast("Full name cannot be empty", "error");
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  const btn = document.getElementById("btnSaveInfo");
  setLoading(btn, true);

  try {
    const res = await apiRaw("/users/profile", "PUT", { name, fullName, email });

    if (!res.success) {
      showToast(res.message || "Update failed", "error");
      return;
    }

    showToast(res.message || "Profile updated!");

    const user = res.data;
    refreshHero(user);

    // If the username changed, update localStorage and redirect to login
    if (name !== _originalName) {
      localStorage.setItem("username", user.name);
      setTimeout(() => {
        showToast("Redirecting to login…", "success");
        setTimeout(() => {
          localStorage.clear();
          location.href = "/index.html";
        }, 1500);
      }, 800);
    } else {
      _originalName = user.name;
      // Update stored username in case full name display depends on it
      localStorage.setItem("username", user.name);
      // Hide the warning banner
      document.getElementById("usernameWarn").style.display = "none";
    }

  } catch (err) {
    console.error("Failed to save profile info:", err);
    showToast("Failed to save profile", "error");
  } finally {
    setLoading(btn, false);
  }
}

// ── Save new password ────────────────────────────────────────
async function savePassword() {
  const currentPassword = document.getElementById("currentPw").value;
  const newPassword     = document.getElementById("newPw").value;
  const confirmPassword = document.getElementById("confirmPw").value;

  if (!currentPassword) {
    showToast("Please enter your current password", "error");
    return;
  }
  if (!newPassword) {
    showToast("Please enter a new password", "error");
    return;
  }
  if (newPassword.length < 6) {
    showToast("New password must be at least 6 characters", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast("Passwords do not match", "error");
    return;
  }

  const btn = document.getElementById("btnSavePw");
  setLoading(btn, true);

  try {
    const res = await apiRaw("/users/profile", "PUT", { currentPassword, newPassword });

    if (!res.success) {
      showToast(res.message || "Password change failed", "error");
      return;
    }

    showToast("Password changed successfully!");
    document.getElementById("currentPw").value = "";
    document.getElementById("newPw").value      = "";
    document.getElementById("confirmPw").value  = "";
    resetStrength();

  } catch (err) {
    console.error("Failed to change password:", err);
    showToast("Failed to change password", "error");
  } finally {
    setLoading(btn, false);
  }
}

// ── Password strength meter ──────────────────────────────────
function checkStrength(value) {
  const bar   = document.getElementById("pwStrengthBar");
  const fill  = document.getElementById("pwStrengthFill");
  const label = document.getElementById("pwStrengthLabel");

  if (!value) {
    bar.style.display = "none";
    label.textContent = "";
    return;
  }

  bar.style.display = "block";

  let score = 0;
  if (value.length >= 6)           score++;
  if (value.length >= 10)          score++;
  if (/[A-Z]/.test(value))         score++;
  if (/[0-9]/.test(value))         score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { pct: "20%",  bg: "#f43f5e", text: "Very weak", cls: "pw-weak"   },
    { pct: "40%",  bg: "#f43f5e", text: "Weak",       cls: "pw-weak"   },
    { pct: "60%",  bg: "#f59e0b", text: "Fair",       cls: "pw-medium" },
    { pct: "80%",  bg: "#f59e0b", text: "Good",       cls: "pw-medium" },
    { pct: "100%", bg: "#10b981", text: "Strong",     cls: "pw-strong" },
  ];

  const lvl = levels[Math.min(score, 4)];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.bg;
  label.textContent     = lvl.text;
  label.className       = `pw-strength-label ${lvl.cls}`;
}

function resetStrength() {
  document.getElementById("pwStrengthBar").style.display = "none";
  document.getElementById("pwStrengthFill").style.width  = "0%";
  document.getElementById("pwStrengthLabel").textContent = "";
}

// ── Toggle show/hide password ────────────────────────────────
const EYE_OPEN  = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;
const EYE_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>`;

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type    = "text";
    btn.innerHTML = EYE_CLOSE;
  } else {
    input.type    = "password";
    btn.innerHTML = EYE_OPEN;
  }
}

// ── Button loading state ─────────────────────────────────────
function setLoading(btn, on) {
  btn.classList.toggle("loading", on);
  btn.disabled = on;
}
