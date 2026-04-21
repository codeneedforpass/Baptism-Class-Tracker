import {
  deleteAttendance,
  fetchAttendanceByFilters,
  insertAttendance,
  updateAttendance
} from "./attendance.js";
import { fetchAllClasses } from "./classes.js";
import { fetchAllParticipants } from "./participants.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const tbody = document.getElementById("attendanceBody");
const attendanceForm = document.getElementById("attendanceForm");
const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
const participantSelect = document.getElementById("participantId");
const classSelect = document.getElementById("classId");
const attendanceFilterForm = document.getElementById("attendanceFilterForm");
const filterParticipantSelect = document.getElementById("filterParticipantId");
const filterClassSelect = document.getElementById("filterClassId");
const pageInfoEl = document.getElementById("pageInfo");
const pageSizeEl = document.getElementById("pageSize");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");

let currentRows = [];
let participantsMap = new Map();
let classesMap = new Map();
let currentPage = 0;
let pageSize = Number(pageSizeEl?.value || 25) || 25;
let totalCount = 0;
let listFilters = {};

function formatParticipantLabel(row) {
  const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim();
  return fullName ? `${fullName} (${row.participant_id})` : row.participant_id;
}

function formatClassLabel(row) {
  const className = row.class_name || "Unnamed Class";
  return `${className} (${row.class_date || "No date"})`;
}

async function loadFormOptions() {
  const [participants, classes] = await Promise.all([fetchAllParticipants(), fetchAllClasses()]);

  participantsMap = new Map(participants.map((row) => [row.participant_id, row]));
  classesMap = new Map(classes.map((row) => [row.class_id, row]));

  participantSelect.innerHTML = [
    "<option value=''>Select participant</option>",
    ...participants.map((row) => `<option value="${row.participant_id}">${formatParticipantLabel(row)}</option>`)
  ].join("");

  filterParticipantSelect.innerHTML = [
    "<option value=''>All participants</option>",
    ...participants.map((row) => `<option value="${row.participant_id}">${formatParticipantLabel(row)}</option>`)
  ].join("");

  classSelect.innerHTML = [
    "<option value=''>Select class</option>",
    ...classes.map((row) => `<option value="${row.class_id}">${formatClassLabel(row)}</option>`)
  ].join("");

  filterClassSelect.innerHTML = [
    "<option value=''>All classes</option>",
    ...classes.map((row) => `<option value="${row.class_id}">${formatClassLabel(row)}</option>`)
  ].join("");

  if (listFilters.participantId) filterParticipantSelect.value = listFilters.participantId;
  if (listFilters.classId) filterClassSelect.value = listFilters.classId;
}

function renderRows(rows) {
  if (!rows.length) {
    tbody.innerHTML = "<tr><td colspan='5'>No attendance records found.</td></tr>";
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const participant = participantsMap.get(row.participant_id);
      const classInfo = classesMap.get(row.class_id);
      return `
        <tr>
          <td>${participant ? formatParticipantLabel(participant) : row.participant_id || "-"}</td>
          <td>${classInfo ? formatClassLabel(classInfo) : row.class_id || "-"}</td>
          <td>${row.attendance_status || "-"}</td>
          <td>${row.marked_at || "-"}</td>
          <td class="actions">
            <button type="button" data-edit-id="${row.attendance_id}">Edit</button>
            <button type="button" data-delete-id="${row.attendance_id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function updatePaginationUi() {
  if (!pageInfoEl || !prevPageBtn || !nextPageBtn) return;

  const start = totalCount === 0 ? 0 : currentPage * pageSize + 1;
  const end = totalCount === 0 ? 0 : Math.min(totalCount, currentPage * pageSize + currentRows.length);
  pageInfoEl.textContent =
    totalCount === 0 ? "No attendance rows yet." : `Showing ${start}-${end} of ${totalCount}`;

  prevPageBtn.disabled = currentPage <= 0;
  const lastPageIndex = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
  nextPageBtn.disabled = totalCount === 0 || currentPage >= lastPageIndex;
}

async function loadAttendanceTable(options = {}) {
  const { resetPage, filtersOverride } = options;
  if (resetPage) currentPage = 0;

  const filters = filtersOverride || listFilters;
  const offset = currentPage * pageSize;
  statusEl.textContent = "Loading attendance...";
  prevPageBtn && (prevPageBtn.disabled = true);
  nextPageBtn && (nextPageBtn.disabled = true);

  try {
    const { rows, count } = await fetchAttendanceByFilters({
      participantId: filters.participantId,
      classId: filters.classId,
      status: filters.status,
      markedFrom: filters.markedFrom,
      markedTo: filters.markedTo,
      limit: pageSize,
      offset
    });
    totalCount = typeof count === "number" ? count : rows.length;
    currentRows = rows;
    renderRows(rows);
    updatePaginationUi();
    statusEl.textContent =
      totalCount === 0
        ? "No attendance rows on this page."
        : `Loaded ${rows.length} row(s) on this page (${totalCount} total).`;
  } catch (error) {
    statusEl.textContent = `Failed to load attendance: ${error.message}`;
  }
}

function readFiltersFromForm() {
  const formData = new FormData(attendanceFilterForm);
  return {
    participantId: String(formData.get("participant_id") || "").trim(),
    classId: String(formData.get("class_id") || "").trim(),
    status: String(formData.get("attendance_status") || "").trim(),
    markedFrom: String(formData.get("marked_from") || "").trim(),
    markedTo: String(formData.get("marked_to") || "").trim()
  };
}

async function loadAttendance(options = {}) {
  const resetPage = options.resetPage ?? true;
  await loadFormOptions();
  await loadAttendanceTable({ resetPage });
}

function resetAttendanceForm() {
  attendanceForm.reset();
  document.getElementById("attendanceId").value = "";
  saveAttendanceBtn.textContent = "Save Attendance";
}

function fillAttendanceForm(row) {
  document.getElementById("attendanceId").value = row.attendance_id || "";
  participantSelect.value = row.participant_id || "";
  classSelect.value = row.class_id || "";
  document.getElementById("attendanceStatus").value = row.attendance_status || "present";
  saveAttendanceBtn.textContent = "Update Attendance";
}

async function init() {
  try {
    await initProtectedPage("attendance");
    await loadAttendance({ resetPage: true });
    listFilters = readFiltersFromForm();

    attendanceForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      saveAttendanceBtn.disabled = true;
      const formData = new FormData(attendanceForm);
      const attendanceId = String(formData.get("attendanceId") || "").trim();
      const payload = {
        participant_id: String(formData.get("participant_id") || "").trim(),
        class_id: String(formData.get("class_id") || "").trim(),
        attendance_status: String(formData.get("attendance_status") || "").trim()
      };

      try {
        statusEl.textContent = attendanceId ? "Updating attendance..." : "Creating attendance...";
        if (attendanceId) {
          await updateAttendance(attendanceId, payload);
        } else {
          await insertAttendance(payload);
        }
        resetAttendanceForm();
        await loadAttendance({ resetPage: true });
      } catch (error) {
        statusEl.textContent = `Save failed: ${error.message}`;
      } finally {
        saveAttendanceBtn.disabled = false;
      }
    });

    document.getElementById("clearAttendanceBtn").addEventListener("click", () => {
      resetAttendanceForm();
      statusEl.textContent = "Form cleared.";
    });

    attendanceFilterForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      listFilters = readFiltersFromForm();
      await loadAttendanceTable({ resetPage: true });
    });

    document.getElementById("resetAttendanceFiltersBtn").addEventListener("click", async () => {
      attendanceFilterForm.reset();
      listFilters = readFiltersFromForm();
      await loadAttendanceTable({ resetPage: true });
    });

    tbody.addEventListener("click", async (event) => {
      const editId = event.target.dataset.editId;
      const deleteId = event.target.dataset.deleteId;

      if (editId) {
        const row = currentRows.find((item) => item.attendance_id === editId);
        if (row) fillAttendanceForm(row);
        return;
      }

      if (deleteId) {
        if (!window.confirm("Delete this attendance row?")) return;
        try {
          statusEl.textContent = "Deleting attendance...";
          await deleteAttendance(deleteId);
          await loadAttendance({ resetPage: false });
        } catch (error) {
          statusEl.textContent = `Delete failed: ${error.message}`;
        }
      }
    });

    pageSizeEl?.addEventListener("change", async () => {
      pageSize = Number(pageSizeEl.value || 25) || 25;
      await loadAttendanceTable({ resetPage: true });
    });

    prevPageBtn?.addEventListener("click", async () => {
      if (currentPage <= 0) return;
      currentPage -= 1;
      await loadAttendanceTable();
    });

    nextPageBtn?.addEventListener("click", async () => {
      const lastPageIndex = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
      if (currentPage >= lastPageIndex) return;
      currentPage += 1;
      await loadAttendanceTable();
    });
  } catch (error) {
    statusEl.textContent = `Failed to load attendance: ${error.message}`;
  }
}

init();
