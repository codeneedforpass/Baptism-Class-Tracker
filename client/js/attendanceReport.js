import { supabase } from "./supabaseClient.js";

export async function fetchAttendanceReport() {
  const { data, error } = await supabase
    .from("attendance")
    .select(`
      attendance_id,
      attendance_status,
      marked_at,
      participants(first_name, last_name),
      classes(class_name, class_date)
    `)
    .order("marked_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchAttendanceReportFromView() {
  const { data, error } = await supabase
    .from("attendance_report")
    .select("*")
    .order("marked_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function displayAttendanceReport(targetElementId) {
  const target = document.getElementById(targetElementId);
  if (!target) {
    throw new Error(`Element with id "${targetElementId}" not found.`);
  }

  const rows = await fetchAttendanceReport();
  if (!rows.length) {
    target.innerHTML = "<tr><td colspan='4'>No attendance records found.</td></tr>";
    return;
  }

  target.innerHTML = rows
    .map((row) => {
      const fullName = `${row.participants?.first_name || ""} ${row.participants?.last_name || ""}`.trim();
      const classLabel = row.classes?.class_name || "Unknown Class";
      const classDate = row.classes?.class_date || "-";
      return `
        <tr>
          <td>${fullName || "Unknown Participant"}</td>
          <td>${classLabel}</td>
          <td>${row.attendance_status}</td>
          <td>${classDate}</td>
        </tr>
      `;
    })
    .join("");
}
