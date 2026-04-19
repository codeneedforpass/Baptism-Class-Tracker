import {
  deleteParticipant,
  fetchParticipantsByFilters,
  insertParticipant,
  updateParticipant
} from "./participants.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const tbody = document.getElementById("participantsBody");
const filterForm = document.getElementById("participantsFilterForm");
const participantForm = document.getElementById("participantForm");
const saveParticipantBtn = document.getElementById("saveParticipantBtn");

let currentRows = [];

function renderRows(rows) {
  if (!rows.length) {
    tbody.innerHTML = "<tr><td colspan='7'>No participants found.</td></tr>";
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim() || "N/A";
      const latestSchedule = Array.isArray(row.baptismschedule) ? row.baptismschedule[0] : row.baptismschedule;
      return `
        <tr>
          <td>${fullName}</td>
          <td>${latestSchedule?.status || "-"}</td>
          <td>${latestSchedule?.baptism_date || "-"}</td>
          <td>${row.phone || "-"}</td>
          <td>${row.email || "-"}</td>
          <td>${row.enrolled_at || "-"}</td>
          <td class="actions">
            <button type="button" data-edit-id="${row.participant_id}">Edit</button>
            <button type="button" data-delete-id="${row.participant_id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function loadParticipants(filters = {}) {
  statusEl.textContent = "Loading participants...";
  try {
    const rows = await fetchParticipantsByFilters(filters);
    currentRows = rows;
    renderRows(rows);
    statusEl.textContent = `Loaded ${rows.length} participant(s).`;
  } catch (error) {
    statusEl.textContent = `Failed to load participants: ${error.message}`;
  }
}

function resetParticipantForm() {
  participantForm.reset();
  document.getElementById("participantId").value = "";
  saveParticipantBtn.textContent = "Save Participant";
}

function fillParticipantForm(participant) {
  document.getElementById("participantId").value = participant.participant_id || "";
  document.getElementById("firstName").value = participant.first_name || "";
  document.getElementById("lastName").value = participant.last_name || "";
  document.getElementById("participantPhone").value = participant.phone || "";
  document.getElementById("participantEmail").value = participant.email || "";
  document.getElementById("dob").value = participant.date_of_birth || "";
  saveParticipantBtn.textContent = "Update Participant";
}

async function init() {
  await initProtectedPage("participants");
  await loadParticipants();

  participantForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveParticipantBtn.disabled = true;

    try {
      const formData = new FormData(participantForm);
      const participantId = String(formData.get("participantId") || "").trim();
      const payload = {
        first_name: String(formData.get("first_name") || "").trim(),
        last_name: String(formData.get("last_name") || "").trim(),
        phone: String(formData.get("phone") || "").trim() || null,
        email: String(formData.get("email") || "").trim() || null,
        date_of_birth: String(formData.get("date_of_birth") || "").trim() || null
      };

      statusEl.textContent = participantId ? "Updating participant..." : "Creating participant...";

      if (participantId) {
        await updateParticipant(participantId, payload);
      } else {
        await insertParticipant(payload);
      }

      resetParticipantForm();
      await loadParticipants();
    } catch (error) {
      statusEl.textContent = `Save failed: ${error.message}`;
    } finally {
      saveParticipantBtn.disabled = false;
    }
  });

  filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(filterForm);
    await loadParticipants({
      name: formData.get("name"),
      status: formData.get("status"),
      baptismDateFrom: formData.get("baptismDateFrom"),
      baptismDateTo: formData.get("baptismDateTo")
    });
  });

  document.getElementById("resetFiltersBtn").addEventListener("click", async () => {
    filterForm.reset();
    await loadParticipants();
  });

  document.getElementById("clearParticipantBtn").addEventListener("click", () => {
    resetParticipantForm();
    statusEl.textContent = "Form cleared.";
  });

  tbody.addEventListener("click", async (event) => {
    const editId = event.target.dataset.editId;
    const deleteId = event.target.dataset.deleteId;

    if (editId) {
      const selected = currentRows.find((item) => item.participant_id === editId);
      if (selected) {
        fillParticipantForm(selected);
        statusEl.textContent = "Editing participant.";
      }
      return;
    }

    if (deleteId) {
      const ok = window.confirm("Delete this participant?");
      if (!ok) return;

      statusEl.textContent = "Deleting participant...";
      try {
        await deleteParticipant(deleteId);
        await loadParticipants();
      } catch (error) {
        statusEl.textContent = `Delete failed: ${error.message}`;
      }
    }
  });
}

init();
