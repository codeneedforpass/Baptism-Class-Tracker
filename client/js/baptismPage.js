import {
  deleteBaptismSchedule,
  fetchAllBaptismSchedules,
  insertBaptismSchedule,
  updateBaptismSchedule
} from "./baptismSchedule.js";
import { fetchAllParticipants } from "./participants.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const tbody = document.getElementById("baptismBody");
const baptismForm = document.getElementById("baptismForm");
const saveBaptismBtn = document.getElementById("saveBaptismBtn");
const participantSelect = document.getElementById("scheduleParticipantId");

let currentRows = [];
let participantsMap = new Map();

function formatParticipantLabel(row) {
  const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim();
  return fullName ? `${fullName} (${row.participant_id})` : row.participant_id;
}

async function loadParticipantOptions() {
  const participants = await fetchAllParticipants();
  participantsMap = new Map(participants.map((row) => [row.participant_id, row]));
  participantSelect.innerHTML = [
    "<option value=''>Select participant</option>",
    ...participants.map((row) => `<option value="${row.participant_id}">${formatParticipantLabel(row)}</option>`)
  ].join("");
}

function renderRows(rows) {
  if (!rows.length) {
    tbody.innerHTML = "<tr><td colspan='6'>No baptism schedules found.</td></tr>";
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${
          participantsMap.get(row.participant_id)
            ? formatParticipantLabel(participantsMap.get(row.participant_id))
            : row.participant_id || "-"
        }</td>
        <td>${row.baptism_date || "-"}</td>
        <td>${row.baptism_time || "-"}</td>
        <td>${row.location || "-"}</td>
        <td>${row.status || "-"}</td>
        <td class="actions">
          <button type="button" data-edit-id="${row.schedule_id}">Edit</button>
          <button type="button" data-delete-id="${row.schedule_id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");
}

async function loadSchedules() {
  statusEl.textContent = "Loading schedules...";
  await loadParticipantOptions();
  const rows = await fetchAllBaptismSchedules();
  currentRows = rows;
  renderRows(rows);
  statusEl.textContent = `Loaded ${rows.length} schedule row(s).`;
}

function resetBaptismForm() {
  baptismForm.reset();
  document.getElementById("scheduleId").value = "";
  saveBaptismBtn.textContent = "Save Schedule";
}

function fillBaptismForm(row) {
  document.getElementById("scheduleId").value = row.schedule_id || "";
  participantSelect.value = row.participant_id || "";
  document.getElementById("baptismDate").value = row.baptism_date || "";
  document.getElementById("baptismTime").value = row.baptism_time || "";
  document.getElementById("baptismLocation").value = row.location || "";
  document.getElementById("baptismStatus").value = row.status || "scheduled";
  saveBaptismBtn.textContent = "Update Schedule";
}

async function init() {
  try {
    await initProtectedPage("baptism");
    await loadSchedules();

    baptismForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      saveBaptismBtn.disabled = true;
      const formData = new FormData(baptismForm);
      const scheduleId = String(formData.get("scheduleId") || "").trim();
      const payload = {
        participant_id: String(formData.get("participant_id") || "").trim(),
        baptism_date: String(formData.get("baptism_date") || "").trim(),
        baptism_time: String(formData.get("baptism_time") || "").trim(),
        location: String(formData.get("location") || "").trim(),
        status: String(formData.get("status") || "").trim()
      };

      try {
        statusEl.textContent = scheduleId ? "Updating schedule..." : "Creating schedule...";
        if (scheduleId) {
          await updateBaptismSchedule(scheduleId, payload);
        } else {
          await insertBaptismSchedule(payload);
        }
        resetBaptismForm();
        await loadSchedules();
      } catch (error) {
        statusEl.textContent = `Save failed: ${error.message}`;
      } finally {
        saveBaptismBtn.disabled = false;
      }
    });

    document.getElementById("clearBaptismBtn").addEventListener("click", () => {
      resetBaptismForm();
      statusEl.textContent = "Form cleared.";
    });

    tbody.addEventListener("click", async (event) => {
      const editId = event.target.dataset.editId;
      const deleteId = event.target.dataset.deleteId;
      if (editId) {
        const row = currentRows.find((item) => item.schedule_id === editId);
        if (row) fillBaptismForm(row);
        return;
      }

      if (deleteId) {
        if (!window.confirm("Delete this schedule?")) return;
        try {
          statusEl.textContent = "Deleting schedule...";
          await deleteBaptismSchedule(deleteId);
          await loadSchedules();
        } catch (error) {
          statusEl.textContent = `Delete failed: ${error.message}`;
        }
      }
    });
  } catch (error) {
    statusEl.textContent = `Failed to load schedules: ${error.message}`;
  }
}

init();
