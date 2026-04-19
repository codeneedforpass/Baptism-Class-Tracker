import { initProtectedPage } from "./pageShell.js";
import { fetchAllClasses } from "./classes.js";
import { fetchAllParticipants } from "./participants.js";
import { fetchAttendanceByClass, syncAttendanceForClass } from "./attendance.js";

const statusEl = document.getElementById("status");
const classSelect = document.getElementById("sessionClassId");
const tbody = document.getElementById("sessionBody");
const reloadBtn = document.getElementById("reloadSessionBtn");
const saveBtn = document.getElementById("saveSessionBtn");
const markAllPresentBtn = document.getElementById("markAllPresentBtn");
const markAllAbsentBtn = document.getElementById("markAllAbsentBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const sessionSummaryEl = document.getElementById("sessionSummary");

let participants = [];
let currentClassId = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pickLatestAttendance(rowsForParticipant) {
  if (!rowsForParticipant?.length) return null;
  return rowsForParticipant.reduce((best, row) => {
    if (!best) return row;
    const a = best.marked_at || "";
    const b = row.marked_at || "";
    return b > a ? row : best;
  }, null);
}

function countStatusesFromDom() {
  const counts = {
    "": 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0
  };
  const selects = tbody.querySelectorAll("select[data-participant-id]");
  selects.forEach((select) => {
    const key = String(select.value || "");
    if (key in counts) counts[key] += 1;
    else counts[""] += 1;
  });
  return counts;
}

function refreshSessionSummary() {
  if (!sessionSummaryEl) return;

  if (!currentClassId || !tbody.querySelector("select[data-participant-id]")) {
    sessionSummaryEl.textContent = "";
    return;
  }

  const c = countStatusesFromDom();
  const total =
    c[""] + c.present + c.absent + c.late + c.excused;
  sessionSummaryEl.textContent = `Roll call draft (${total}): not recorded ${c[""]}, present ${c.present}, absent ${c.absent}, late ${c.late}, excused ${c.excused}.`;
}

function renderSession(classId, attendanceRows) {
  if (!classId) {
    tbody.innerHTML = "<tr><td colspan='2'>Select a class to load participants.</td></tr>";
    saveBtn.disabled = true;
    if (sessionSummaryEl) sessionSummaryEl.textContent = "";
    return;
  }

  if (!participants.length) {
    tbody.innerHTML = "<tr><td colspan='2'>No participants found.</td></tr>";
    saveBtn.disabled = true;
    if (sessionSummaryEl) sessionSummaryEl.textContent = "";
    return;
  }

  const byParticipant = new Map();
  for (const row of attendanceRows || []) {
    const list = byParticipant.get(row.participant_id) || [];
    list.push(row);
    byParticipant.set(row.participant_id, list);
  }

  tbody.innerHTML = participants
    .map((p) => {
      const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "N/A";
      const latest = pickLatestAttendance(byParticipant.get(p.participant_id));
      const current = latest?.attendance_status || "";
      return `
        <tr>
          <td>${escapeHtml(fullName)}</td>
          <td>
            <select data-participant-id="${escapeHtml(p.participant_id)}">
              <option value="" ${current === "" ? "selected" : ""}>Not recorded</option>
              <option value="present" ${current === "present" ? "selected" : ""}>present</option>
              <option value="absent" ${current === "absent" ? "selected" : ""}>absent</option>
              <option value="late" ${current === "late" ? "selected" : ""}>late</option>
              <option value="excused" ${current === "excused" ? "selected" : ""}>excused</option>
            </select>
          </td>
        </tr>
      `;
    })
    .join("");

  saveBtn.disabled = false;
  refreshSessionSummary();
}

function readStatusesFromDom() {
  const selects = tbody.querySelectorAll("select[data-participant-id]");
  const statuses = {};
  selects.forEach((select) => {
    statuses[select.dataset.participantId] = String(select.value || "");
  });
  return statuses;
}

function setAllSelects(value) {
  const selects = tbody.querySelectorAll("select[data-participant-id]");
  selects.forEach((select) => {
    select.value = value;
  });
  refreshSessionSummary();
}

async function loadClassesIntoSelect() {
  const classes = await fetchAllClasses();
  classSelect.innerHTML = '<option value="">Select a class</option>';
  for (const c of classes || []) {
    const opt = document.createElement("option");
    opt.value = c.class_id;
    const when = c.class_date ? ` (${c.class_date})` : "";
    opt.textContent = `${c.class_name || "Class"}${when}`;
    classSelect.appendChild(opt);
  }
}

async function loadSession() {
  currentClassId = String(classSelect.value || "").trim();
  if (!currentClassId) {
    statusEl.textContent = "Choose a class.";
    renderSession("", []);
    return;
  }

  statusEl.textContent = "Loading session...";
  saveBtn.disabled = true;

  try {
    const attendanceRows = await fetchAttendanceByClass(currentClassId);
    renderSession(currentClassId, attendanceRows);
    statusEl.textContent = `Loaded ${participants.length} participant(s) for this class.`;
  } catch (error) {
    statusEl.textContent = `Failed to load session: ${error.message}`;
    tbody.innerHTML = `<tr><td colspan='2'>${escapeHtml(error.message)}</td></tr>`;
    if (sessionSummaryEl) sessionSummaryEl.textContent = "";
  }
}

async function init() {
  await initProtectedPage("attendance_session");

  statusEl.textContent = "Loading classes...";
  try {
    participants = await fetchAllParticipants();
    await loadClassesIntoSelect();
    statusEl.textContent = "Pick a class to begin.";
  } catch (error) {
    statusEl.textContent = `Failed to initialize: ${error.message}`;
    return;
  }

  classSelect.addEventListener("change", () => {
    loadSession();
  });

  reloadBtn.addEventListener("click", () => {
    loadSession();
  });

  markAllPresentBtn.addEventListener("click", () => {
    if (!currentClassId) return;
    setAllSelects("present");
    statusEl.textContent = "Marked all as present (not saved yet).";
  });

  markAllAbsentBtn.addEventListener("click", () => {
    if (!currentClassId) return;
    setAllSelects("absent");
    statusEl.textContent = "Marked all as absent (not saved yet).";
  });

  clearAllBtn.addEventListener("click", () => {
    if (!currentClassId) return;
    setAllSelects("");
    statusEl.textContent = "Cleared all rows (not saved yet).";
  });

  tbody.addEventListener("change", (event) => {
    const select = event.target.closest("select[data-participant-id]");
    if (!select) return;
    refreshSessionSummary();
  });

  saveBtn.addEventListener("click", async () => {
    if (!currentClassId) return;

    saveBtn.disabled = true;
    statusEl.textContent = "Saving attendance...";

    try {
      const statuses = readStatusesFromDom();
      const result = await syncAttendanceForClass(currentClassId, statuses);
      await loadSession();
      statusEl.textContent = `Saved. Upserted ${result.upserted}, removed ${result.deleted}.`;
    } catch (error) {
      statusEl.textContent = `Save failed: ${error.message}`;
    } finally {
      saveBtn.disabled = !tbody.querySelector("select[data-participant-id]");
    }
  });
}

init();
