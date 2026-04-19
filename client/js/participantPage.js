import { fetchAttendanceByParticipant } from "./attendance.js";
import { fetchBaptismSchedulesByParticipant } from "./baptismSchedule.js";
import { fetchParticipantById } from "./participants.js";
import { fetchRequirementsByParticipant } from "./requirements.js";
import { initProtectedPage } from "./pageShell.js";

const statusEl = document.getElementById("status");
const profileTitle = document.getElementById("profileTitle");
const profileContact = document.getElementById("profileContact");
const profileDob = document.getElementById("profileDob");
const profileEnrolled = document.getElementById("profileEnrolled");
const baptismBody = document.getElementById("profileBaptismBody");
const attendanceBody = document.getElementById("profileAttendanceBody");
const requirementsBody = document.getElementById("profileRequirementsBody");

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function renderTablePlaceholder(tbody, colspan, message) {
  tbody.innerHTML = `<tr><td colspan="${colspan}">${message}</td></tr>`;
}

async function init() {
  try {
    await initProtectedPage("participants");
    const participantId = getQueryParam("id");
    if (!participantId) {
      statusEl.textContent = "Missing participant id in URL.";
      return;
    }

    statusEl.textContent = "Loading profile...";

    const [participant, schedules, attendance, requirements] = await Promise.all([
      fetchParticipantById(participantId),
      fetchBaptismSchedulesByParticipant(participantId),
      fetchAttendanceByParticipant(participantId),
      fetchRequirementsByParticipant(participantId)
    ]);

    const fullName = `${participant.first_name || ""} ${participant.last_name || ""}`.trim() || "Participant";
    profileTitle.textContent = fullName;
    profileContact.textContent = [participant.phone, participant.email].filter(Boolean).join(" · ") || "—";
    profileDob.textContent = participant.date_of_birth || "—";
    profileEnrolled.textContent = participant.enrolled_at || "—";

    if (!schedules.length) {
      renderTablePlaceholder(baptismBody, 4, "No baptism schedule yet.");
    } else {
      baptismBody.innerHTML = schedules
        .map(
          (row) => `
          <tr>
            <td>${row.baptism_date || "-"}</td>
            <td>${row.baptism_time || "-"}</td>
            <td>${row.location || "-"}</td>
            <td>${row.status || "-"}</td>
          </tr>
        `
        )
        .join("");
    }

    if (!attendance.length) {
      renderTablePlaceholder(attendanceBody, 3, "No attendance records yet.");
    } else {
      attendanceBody.innerHTML = attendance
        .map(
          (row) => `
          <tr>
            <td>${row.class_id || "-"}</td>
            <td>${row.attendance_status || "-"}</td>
            <td>${row.marked_at || "-"}</td>
          </tr>
        `
        )
        .join("");
    }

    if (!requirements.length) {
      renderTablePlaceholder(requirementsBody, 4, "No requirements yet.");
    } else {
      requirementsBody.innerHTML = requirements
        .map(
          (row) => `
          <tr>
            <td>${row.requirement_name || "-"}</td>
            <td>${row.requirement_status || "-"}</td>
            <td>${row.verified_at || "-"}</td>
            <td>${row.notes || "-"}</td>
          </tr>
        `
        )
        .join("");
    }

    statusEl.textContent = "Profile loaded.";
  } catch (error) {
    statusEl.textContent = `Failed to load profile: ${error.message}`;
  }
}

init();
