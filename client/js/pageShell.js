import { logout, requireAuth } from "./auth.js";

export async function initProtectedPage(pageKey) {
  const session = await requireAuth();

  const userEmailEl = document.getElementById("userEmail");
  if (userEmailEl) {
    userEmailEl.textContent = session.user?.email || "Authenticated user";
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logout();
      window.location.href = "./login.html";
    });
  }

  const navLinks = document.querySelectorAll("[data-page]");
  navLinks.forEach((link) => {
    if (link.dataset.page === pageKey) {
      link.classList.add("active");
    }
  });

  return session;
}
