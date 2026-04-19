import { fetchDashboardData } from "./dashboard.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");

function setMetric(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "-";
}

async function init() {
  try {
    await initProtectedPage("dashboard");
    const data = await fetchDashboardData();

    setMetric("totalParticipants", data.total_participants);
    setMetric("averageAge", data.average_age);
    setMetric("oldestAge", data.oldest_age);
    setMetric("youngestAge", data.youngest_age);
    setMetric("completedParticipants", data.completed_participants_count);

    statusEl.textContent = "Dashboard loaded.";
  } catch (error) {
    statusEl.textContent = `Failed to load dashboard: ${error.message}`;
  }
}

init();
