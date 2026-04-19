import { requireAuth, logout, onAuthChange } from "./auth.js";

const statusEl = document.getElementById("status");
const logoutBtn = document.getElementById("logoutBtn");

async function initProtectedPage() {
  try {
    const session = await requireAuth();
    statusEl.textContent = `Logged in as ${session.user.email}`;
  } catch (err) {
    statusEl.textContent = `Auth error: ${err.message}`;
  }
}

logoutBtn.addEventListener("click", async () => {
  try {
    await logout();
  } catch (err) {
    statusEl.textContent = `Logout failed: ${err.message}`;
  }
});

onAuthChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "./login.html";
  }
});

initProtectedPage();
