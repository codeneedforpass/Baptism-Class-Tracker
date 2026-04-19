import { deleteClass, fetchAllClasses, insertClass, updateClass } from "./classes.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const tbody = document.getElementById("classesBody");
const classForm = document.getElementById("classForm");
const saveClassBtn = document.getElementById("saveClassBtn");

let currentRows = [];

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

async function loadClasses() {
  statusEl.textContent = "Loading classes...";
  const rows = await fetchAllClasses();
  currentRows = rows;
  renderRows(rows);
  statusEl.textContent = `Loaded ${rows.length} class(es).`;
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
    await loadClasses();

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
        await loadClasses();
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
          await loadClasses();
        } catch (error) {
          statusEl.textContent = `Delete failed: ${error.message}`;
        }
      }
    });
  } catch (error) {
    statusEl.textContent = `Failed to load classes: ${error.message}`;
  }
}

init();
