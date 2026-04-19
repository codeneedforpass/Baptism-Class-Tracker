import { fetchAttendanceReport, fetchAttendanceReportFromView } from "./attendanceReport.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const tbody = document.getElementById("reportBody");
const exportBtn = document.getElementById("exportCsvBtn");

let currentRows = [];

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function rowsToCsv(rows) {
  const header = ["participant", "class", "class_date", "status", "marked_at"];
  const lines = [header.join(",")];

  for (const row of rows) {
    const name =
      row.participant_name ||
      `${row.participants?.first_name || ""} ${row.participants?.last_name || ""}`.trim() ||
      "N/A";
    lines.push(
      [
        csvEscape(name),
        csvEscape(row.class_name || row.classes?.class_name || ""),
        csvEscape(row.class_date || row.classes?.class_date || ""),
        csvEscape(row.status || row.attendance_status || ""),
        csvEscape(row.marked_at || "")
      ].join(",")
    );
  }

  return lines.join("\n");
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

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
    currentRows = rows;
    renderRows(rows);
    statusEl.textContent = `Report ready (${rows.length} records).`;
  } catch (error) {
    statusEl.textContent = `Failed to load report: ${error.message}`;
  }

  exportBtn?.addEventListener("click", () => {
    if (!currentRows.length) {
      statusEl.textContent = "Nothing to export yet.";
      return;
    }

    const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
    downloadTextFile(`attendance-report-${stamp}.csv`, rowsToCsv(currentRows));
    statusEl.textContent = `Exported ${currentRows.length} row(s) to CSV.`;
  });
}

init();
