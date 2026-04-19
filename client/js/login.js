import { supabase } from "./supabaseClient.js";
import { getCurrentSession, onAuthChange } from "./auth.js";

const form = document.getElementById("loginForm");
const statusEl = document.getElementById("loginStatus");
const submitBtn = form.querySelector("button[type='submit']");

async function redirectIfAuthenticated() {
  const session = await getCurrentSession();
  if (session) {
    window.location.href = "./index.html";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "Logging in...";
  submitBtn.disabled = true;

  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    statusEl.textContent = error.message;
    submitBtn.disabled = false;
    return;
  }

  statusEl.textContent = "Login successful. Redirecting...";
  window.location.href = "./index.html";
});

onAuthChange((event) => {
  if (event === "SIGNED_IN") {
    window.location.href = "./index.html";
  }
});

redirectIfAuthenticated();
