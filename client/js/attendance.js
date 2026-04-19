import { supabase } from "./supabaseClient.js";

/**
 * Fetch all attendance rows ordered by marked timestamp.
 */
export async function fetchAllAttendance() {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .order("marked_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Insert one attendance record.
 * @param {Object} attendancePayload
 */
export async function insertAttendance(attendancePayload) {
  const { data, error } = await supabase
    .from("attendance")
    .insert([attendancePayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update attendance by id.
 * @param {string} attendanceId
 * @param {Object} updates
 */
export async function updateAttendance(attendanceId, updates) {
  const { data, error } = await supabase
    .from("attendance")
    .update(updates)
    .eq("attendance_id", attendanceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete attendance by id.
 * @param {string} attendanceId
 */
export async function deleteAttendance(attendanceId) {
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("attendance_id", attendanceId);

  if (error) throw error;
  return { success: true };
}
