import {
  deleteAttendance,
  fetchAllAttendance,
  insertAttendance,
  updateAttendance
} from "./attendance.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const tbody = document.getElementById("attendanceBody");
const attendanceForm = document.getElementById("attendanceForm");
const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");

let currentRows = [];

function renderRows(rows) {
  if (!rows.length) {
    tbody.innerHTML = "<tr><td colspan='5'>No attendance records found.</td></tr>";
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      return `
        <tr>
          <td>${row.participant_id || "-"}</td>
          <td>${row.class_id || "-"}</td>
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

async function loadAttendance() {
  statusEl.textContent = "Loading attendance...";
  const rows = await fetchAllAttendance();
  currentRows = rows;
  renderRows(rows);
  statusEl.textContent = `Loaded ${rows.length} attendance row(s).`;
}

function resetAttendanceForm() {
  attendanceForm.reset();
  document.getElementById("attendanceId").value = "";
  saveAttendanceBtn.textContent = "Save Attendance";
}

function fillAttendanceForm(row) {
  document.getElementById("attendanceId").value = row.attendance_id || "";
  document.getElementById("participantId").value = row.participant_id || "";
  document.getElementById("classId").value = row.class_id || "";
  document.getElementById("attendanceStatus").value = row.attendance_status || "present";
  saveAttendanceBtn.textContent = "Update Attendance";
}

async function init() {
  try {
    await initProtectedPage("attendance");
    await loadAttendance();

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
        await loadAttendance();
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
          await loadAttendance();
        } catch (error) {
          statusEl.textContent = `Delete failed: ${error.message}`;
        }
      }
    });
  } catch (error) {
    statusEl.textContent = `Failed to load attendance: ${error.message}`;
  }
}

init();
