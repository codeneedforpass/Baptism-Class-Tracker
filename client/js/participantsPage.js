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
const pageInfoEl = document.getElementById("pageInfo");
const pageSizeEl = document.getElementById("pageSize");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const nameInput = document.getElementById("name");

let currentRows = [];
let currentPage = 0;
let pageSize = Number(pageSizeEl?.value || 25) || 25;
let totalCount = 0;
let listFilters = {};
let nameSearchTimer = null;

function getLatestBaptismSchedule(row) {
  const schedules = row.baptism_schedule;
  if (!schedules) return null;
  const list = Array.isArray(schedules) ? schedules : [schedules];
  if (!list.length) return null;

  return list.reduce((best, current) => {
    if (!best) return current;
    const bestKey = `${best.baptism_date || ""} ${best.baptism_time || ""}`;
    const curKey = `${current.baptism_date || ""} ${current.baptism_time || ""}`;
    return curKey > bestKey ? current : best;
  }, null);
}

function renderRows(rows) {
  if (!rows.length) {
    tbody.innerHTML = "<tr><td colspan='7'>No participants found.</td></tr>";
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim() || "N/A";
      const latestSchedule = getLatestBaptismSchedule(row);
      const statusLabel = latestSchedule?.status || "Not scheduled";
      const dateLabel = latestSchedule?.baptism_date || "TBD";
      return `
        <tr>
          <td>${fullName}</td>
          <td>${statusLabel}</td>
          <td>${dateLabel}</td>
          <td>${row.phone || "-"}</td>
          <td>${row.email || "-"}</td>
          <td>${row.enrolled_at || "-"}</td>
          <td class="actions">
            <button type="button" data-view-id="${row.participant_id}">Profile</button>
            <button type="button" data-edit-id="${row.participant_id}">Edit</button>
            <button type="button" data-delete-id="${row.participant_id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function readFiltersFromForm() {
  const formData = new FormData(filterForm);
  return {
    name: formData.get("name"),
    status: formData.get("status"),
    baptismDateFrom: formData.get("baptismDateFrom"),
    baptismDateTo: formData.get("baptismDateTo")
  };
}

function updatePaginationUi() {
  if (!pageInfoEl || !prevPageBtn || !nextPageBtn) return;

  const start = totalCount === 0 ? 0 : currentPage * pageSize + 1;
  const end = totalCount === 0 ? 0 : Math.min(totalCount, currentPage * pageSize + currentRows.length);
  pageInfoEl.textContent =
    totalCount === 0 ? "No participants match these filters." : `Showing ${start}-${end} of ${totalCount}`;

  prevPageBtn.disabled = currentPage <= 0;
  const lastPageIndex = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
  nextPageBtn.disabled = totalCount === 0 || currentPage >= lastPageIndex;
}

async function loadParticipants(options = {}) {
  const { resetPage, filtersOverride } = options;
  if (resetPage) currentPage = 0;

  const filters = filtersOverride || listFilters;
  const offset = currentPage * pageSize;

  statusEl.textContent = "Loading participants...";
  prevPageBtn && (prevPageBtn.disabled = true);
  nextPageBtn && (nextPageBtn.disabled = true);

  try {
    const { rows, count } = await fetchParticipantsByFilters({
      ...filters,
      limit: pageSize,
      offset
    });

    totalCount = typeof count === "number" ? count : rows.length;
    currentRows = rows;
    renderRows(rows);
    updatePaginationUi();
    statusEl.textContent =
      totalCount === 0
        ? "No participants found for this page."
        : `Loaded ${rows.length} participant(s) on this page (${totalCount} total).`;
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
  listFilters = readFiltersFromForm();
  await loadParticipants({ resetPage: true });

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
      await loadParticipants({ resetPage: true });
    } catch (error) {
      statusEl.textContent = `Save failed: ${error.message}`;
    } finally {
      saveParticipantBtn.disabled = false;
    }
  });

  filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    listFilters = readFiltersFromForm();
    await loadParticipants({ resetPage: true });
  });

  document.getElementById("resetFiltersBtn").addEventListener("click", async () => {
    filterForm.reset();
    listFilters = readFiltersFromForm();
    await loadParticipants({ resetPage: true });
  });

  document.getElementById("clearParticipantBtn").addEventListener("click", () => {
    resetParticipantForm();
    statusEl.textContent = "Form cleared.";
  });

  tbody.addEventListener("click", async (event) => {
    const viewId = event.target.dataset.viewId;
    const editId = event.target.dataset.editId;
    const deleteId = event.target.dataset.deleteId;

    if (viewId) {
      window.location.href = `./participant.html?id=${encodeURIComponent(viewId)}`;
      return;
    }

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
        await loadParticipants({ resetPage: false });
      } catch (error) {
        statusEl.textContent = `Delete failed: ${error.message}`;
      }
    }
  });

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      if (nameSearchTimer) window.clearTimeout(nameSearchTimer);
      nameSearchTimer = window.setTimeout(async () => {
        listFilters = readFiltersFromForm();
        await loadParticipants({ resetPage: true });
      }, 300);
    });
  }

  pageSizeEl?.addEventListener("change", async () => {
    pageSize = Number(pageSizeEl.value || 25) || 25;
    await loadParticipants({ resetPage: true });
  });

  prevPageBtn?.addEventListener("click", async () => {
    if (currentPage <= 0) return;
    currentPage -= 1;
    await loadParticipants();
  });

  nextPageBtn?.addEventListener("click", async () => {
    const lastPageIndex = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
    if (currentPage >= lastPageIndex) return;
    currentPage += 1;
    await loadParticipants();
  });
}

init();
