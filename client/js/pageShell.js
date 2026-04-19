import { logout, requireAuth } from "./auth.js";

function initMobileDrawer() {
  const shell = document.querySelector(".app-shell");
  const sidebar = document.querySelector(".app-sidebar");
  const topbar = document.querySelector(".app-main .topbar") || document.querySelector(".topbar");
  if (!shell || !sidebar || !topbar || topbar.querySelector(".nav-toggle")) return;

  const nav = sidebar.querySelector(".sidebar-nav");
  const navId = nav?.id || "sidebar-nav";
  if (nav && !nav.id) nav.id = navId;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "nav-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", navId);
  toggle.setAttribute("aria-label", "Open navigation menu");
  const icon = document.createElement("span");
  icon.className = "nav-toggle-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
  toggle.append(icon);

  const backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  backdrop.tabIndex = -1;
  document.body.append(backdrop);

  const isOpen = () => document.body.classList.contains("nav-drawer-open");

  const setOpen = (open) => {
    document.body.classList.toggle("nav-drawer-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    document.body.style.overflow = open ? "hidden" : "";
  };

  topbar.insertBefore(toggle, topbar.firstChild);

  toggle.addEventListener("click", () => setOpen(!isOpen()));
  backdrop.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) setOpen(false);
  });

  sidebar.querySelectorAll("a.nav-link").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  const mq = window.matchMedia("(max-width: 980px)");
  const onViewport = () => {
    if (!mq.matches) setOpen(false);
  };
  mq.addEventListener("change", onViewport);
}

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

  initMobileDrawer();

  return session;
}
