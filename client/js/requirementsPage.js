import { fetchAllParticipants } from "./participants.js";
import {
  deleteRequirement,
  fetchAllRequirements,
  insertRequirement,
  updateRequirement
} from "./requirements.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const tbody = document.getElementById("requirementsBody");
const requirementForm = document.getElementById("requirementForm");
const saveRequirementBtn = document.getElementById("saveRequirementBtn");
const participantSelect = document.getElementById("reqParticipantId");

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
    tbody.innerHTML = "<tr><td colspan='6'>No requirements found.</td></tr>";
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const participant = participantsMap.get(row.participant_id);
      const participantLabel = participant
        ? formatParticipantLabel(participant)
        : row.participant_id || "-";
      return `
        <tr>
          <td>${participantLabel}</td>
          <td>${row.requirement_name || "-"}</td>
          <td>${row.requirement_status || "-"}</td>
          <td>${row.verified_at || "-"}</td>
          <td>${row.notes || "-"}</td>
          <td class="actions">
            <button type="button" data-edit-id="${row.requirement_id}">Edit</button>
            <button type="button" data-delete-id="${row.requirement_id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function loadRequirements() {
  statusEl.textContent = "Loading requirements...";
  await loadParticipantOptions();
  const rows = await fetchAllRequirements();
  currentRows = rows;
  renderRows(rows);
  statusEl.textContent = `Loaded ${rows.length} requirement(s).`;
}

function resetRequirementForm() {
  requirementForm.reset();
  document.getElementById("requirementId").value = "";
  saveRequirementBtn.textContent = "Save Requirement";
}

function fillRequirementForm(row) {
  document.getElementById("requirementId").value = row.requirement_id || "";
  participantSelect.value = row.participant_id || "";
  document.getElementById("requirementName").value = row.requirement_name || "";
  document.getElementById("requirementStatus").value = row.requirement_status || "pending";
  document.getElementById("requirementNotes").value = row.notes || "";
  saveRequirementBtn.textContent = "Update Requirement";
}

async function init() {
  try {
    await initProtectedPage("requirements");
    await loadRequirements();

    requirementForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      saveRequirementBtn.disabled = true;
      const formData = new FormData(requirementForm);
      const requirementId = String(formData.get("requirementId") || "").trim();
      const status = String(formData.get("requirement_status") || "").trim();
      const previous = requirementId
        ? currentRows.find((item) => item.requirement_id === requirementId)
        : null;

      let verifiedAt = null;
      if (status === "completed" || status === "waived") {
        verifiedAt = previous?.verified_at || new Date().toISOString();
      }

      const payload = {
        participant_id: String(formData.get("participant_id") || "").trim(),
        requirement_name: String(formData.get("requirement_name") || "").trim(),
        requirement_status: status,
        notes: String(formData.get("notes") || "").trim() || null,
        verified_at: verifiedAt
      };

      try {
        statusEl.textContent = requirementId ? "Updating requirement..." : "Creating requirement...";
        if (requirementId) {
          await updateRequirement(requirementId, payload);
        } else {
          await insertRequirement(payload);
        }
        resetRequirementForm();
        await loadRequirements();
      } catch (error) {
        statusEl.textContent = `Save failed: ${error.message}`;
      } finally {
        saveRequirementBtn.disabled = false;
      }
    });

    document.getElementById("clearRequirementBtn").addEventListener("click", () => {
      resetRequirementForm();
      statusEl.textContent = "Form cleared.";
    });

    tbody.addEventListener("click", async (event) => {
      const editId = event.target.dataset.editId;
      const deleteId = event.target.dataset.deleteId;

      if (editId) {
        const row = currentRows.find((item) => item.requirement_id === editId);
        if (row) fillRequirementForm(row);
        return;
      }

      if (deleteId) {
        if (!window.confirm("Delete this requirement?")) return;
        try {
          statusEl.textContent = "Deleting requirement...";
          await deleteRequirement(deleteId);
          await loadRequirements();
        } catch (error) {
          statusEl.textContent = `Delete failed: ${error.message}`;
        }
      }
    });
  } catch (error) {
    statusEl.textContent = `Failed to load requirements: ${error.message}`;
  }
}

init();
