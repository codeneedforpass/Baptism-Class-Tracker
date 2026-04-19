import { deleteClass, fetchClassesPaged, insertClass, updateClass } from "./classes.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const tbody = document.getElementById("classesBody");
const classForm = document.getElementById("classForm");
const saveClassBtn = document.getElementById("saveClassBtn");
const pageInfoEl = document.getElementById("pageInfo");
const pageSizeEl = document.getElementById("pageSize");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");

let currentRows = [];
let currentPage = 0;
let pageSize = Number(pageSizeEl?.value || 25) || 25;
let totalCount = 0;

function renderRows(rows) {
  if (!rows.length) {
    tbody.innerHTML = "<tr><td colspan='6'>No classes found.</td></tr>";
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${row.class_name || "-"}</td>
        <td>${row.class_date || "-"}</td>
        <td>${row.start_time || "-"}</td>
        <td>${row.end_time || "-"}</td>
        <td>${row.location || "-"}</td>
        <td class="actions">
          <button type="button" data-edit-id="${row.class_id}">Edit</button>
          <button type="button" data-delete-id="${row.class_id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");
}

function updatePaginationUi() {
  if (!pageInfoEl || !prevPageBtn || !nextPageBtn) return;

  const start = totalCount === 0 ? 0 : currentPage * pageSize + 1;
  const end = totalCount === 0 ? 0 : Math.min(totalCount, currentPage * pageSize + currentRows.length);
  pageInfoEl.textContent =
    totalCount === 0 ? "No classes yet." : `Showing ${start}-${end} of ${totalCount}`;

  prevPageBtn.disabled = currentPage <= 0;
  const lastPageIndex = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
  nextPageBtn.disabled = totalCount === 0 || currentPage >= lastPageIndex;
}

async function loadClasses(options = {}) {
  const { resetPage } = options;
  if (resetPage) currentPage = 0;

  const offset = currentPage * pageSize;
  statusEl.textContent = "Loading classes...";
  prevPageBtn && (prevPageBtn.disabled = true);
  nextPageBtn && (nextPageBtn.disabled = true);

  try {
    const { rows, count } = await fetchClassesPaged({ limit: pageSize, offset });
    totalCount = typeof count === "number" ? count : rows.length;
    currentRows = rows;
    renderRows(rows);
    updatePaginationUi();
    statusEl.textContent =
      totalCount === 0
        ? "No classes on this page."
        : `Loaded ${rows.length} class(es) on this page (${totalCount} total).`;
  } catch (error) {
    statusEl.textContent = `Failed to load classes: ${error.message}`;
  }
}

function resetClassForm() {
  classForm.reset();
  document.getElementById("classId").value = "";
  saveClassBtn.textContent = "Save Class";
}

function fillClassForm(row) {
  document.getElementById("classId").value = row.class_id || "";
  document.getElementById("className").value = row.class_name || "";
  document.getElementById("classDate").value = row.class_date || "";
  document.getElementById("startTime").value = row.start_time || "";
  document.getElementById("endTime").value = row.end_time || "";
  document.getElementById("location").value = row.location || "";
  saveClassBtn.textContent = "Update Class";
}

async function init() {
  try {
    await initProtectedPage("classes");
    await loadClasses({ resetPage: true });

    classForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      saveClassBtn.disabled = true;
      const formData = new FormData(classForm);
      const classId = String(formData.get("classId") || "").trim();
      const payload = {
        class_name: String(formData.get("class_name") || "").trim(),
        class_date: String(formData.get("class_date") || "").trim(),
        start_time: String(formData.get("start_time") || "").trim(),
        end_time: String(formData.get("end_time") || "").trim(),
        location: String(formData.get("location") || "").trim()
      };

      try {
        statusEl.textContent = classId ? "Updating class..." : "Creating class...";
        if (classId) {
          await updateClass(classId, payload);
        } else {
          await insertClass(payload);
        }
        resetClassForm();
        await loadClasses({ resetPage: true });
      } catch (error) {
        statusEl.textContent = `Save failed: ${error.message}`;
      } finally {
        saveClassBtn.disabled = false;
      }
    });

    document.getElementById("clearClassBtn").addEventListener("click", () => {
      resetClassForm();
      statusEl.textContent = "Form cleared.";
    });

    tbody.addEventListener("click", async (event) => {
      const editId = event.target.dataset.editId;
      const deleteId = event.target.dataset.deleteId;

      if (editId) {
        const row = currentRows.find((item) => item.class_id === editId);
        if (row) fillClassForm(row);
        return;
      }

      if (deleteId) {
        if (!window.confirm("Delete this class?")) return;
        try {
          statusEl.textContent = "Deleting class...";
          await deleteClass(deleteId);
          await loadClasses({ resetPage: false });
        } catch (error) {
          statusEl.textContent = `Delete failed: ${error.message}`;
        }
      }
    });

    pageSizeEl?.addEventListener("change", async () => {
      pageSize = Number(pageSizeEl.value || 25) || 25;
      await loadClasses({ resetPage: true });
    });

    prevPageBtn?.addEventListener("click", async () => {
      if (currentPage <= 0) return;
      currentPage -= 1;
      await loadClasses();
    });

    nextPageBtn?.addEventListener("click", async () => {
      const lastPageIndex = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
      if (currentPage >= lastPageIndex) return;
      currentPage += 1;
      await loadClasses();
    });
  } catch (error) {
    statusEl.textContent = `Failed to load classes: ${error.message}`;
  }
}

init();
