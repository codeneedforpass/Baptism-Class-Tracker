import { fetchAttendanceReport, fetchAttendanceReportFromView } from "./attendanceReport.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const tbody = document.getElementById("reportBody");

function renderRows(rows) {
  if (!rows.length) {
    tbody.innerHTML = "<tr><td colspan='5'>No report data found.</td></tr>";
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const name =
        row.participant_name ||
        `${row.participants?.first_name || ""} ${row.participants?.last_name || ""}`.trim() ||
        "N/A";
      return `
        <tr>
          <td>${name}</td>
          <td>${row.class_name || row.classes?.class_name || "-"}</td>
          <td>${row.class_date || row.classes?.class_date || "-"}</td>
          <td>${row.status || row.attendance_status || "-"}</td>
          <td>${row.marked_at || "-"}</td>
        </tr>
      `;
    })
    .join("");
}

async function init() {
  try {
    await initProtectedPage("reports");
    statusEl.textContent = "Loading SQL report...";
    let rows = [];
    try {
      rows = await fetchAttendanceReportFromView();
    } catch {
      rows = await fetchAttendanceReport();
    }
    renderRows(rows);
    statusEl.textContent = `Report ready (${rows.length} records).`;
  } catch (error) {
    statusEl.textContent = `Failed to load report: ${error.message}`;
  }
}

init();
