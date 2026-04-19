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
 * Paged attendance list (newest first).
 * @param {Object} opts
 * @param {number} [opts.limit]
 * @param {number} [opts.offset]
 */
export async function fetchAttendancePaged(opts = {}) {
  const { limit, offset } = opts;

  let query = supabase.from("attendance").select("*", { count: "exact" }).order("marked_at", { ascending: false });

  if (typeof limit === "number" && limit > 0) {
    const safeOffset = typeof offset === "number" && offset >= 0 ? offset : 0;
    query = query.range(safeOffset, safeOffset + limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data, count };
}

/**
 * Fetch attendance rows for one participant.
 * @param {string} participantId
 */
export async function fetchAttendanceByParticipant(participantId) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("participant_id", participantId)
    .order("marked_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch attendance rows for one class.
 * @param {string} classId
 */
export async function fetchAttendanceByClass(classId) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("class_id", classId)
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

/**
 * Upsert attendance for many participants in one class.
 * Uses unique(participant_id, class_id). Empty string values are treated as "clear row".
 *
 * @param {string} classId
 * @param {Record<string, string | null | undefined>} statusesByParticipantId
 */
export async function syncAttendanceForClass(classId, statusesByParticipantId) {
  const markedAt = new Date().toISOString();
  const participantIds = Object.keys(statusesByParticipantId || {});

  const toDelete = participantIds.filter((pid) => {
    const value = statusesByParticipantId[pid];
    return value === null || value === undefined || String(value).trim() === "";
  });

  const upsertPayloads = participantIds
    .filter((pid) => !toDelete.includes(pid))
    .map((participant_id) => ({
      participant_id,
      class_id: classId,
      attendance_status: String(statusesByParticipantId[participant_id]).trim(),
      marked_at: markedAt
    }));

  if (upsertPayloads.length) {
    const { error } = await supabase
      .from("attendance")
      .upsert(upsertPayloads, { onConflict: "participant_id,class_id" });

    if (error) throw error;
  }

  if (toDelete.length) {
    const chunkSize = 120;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
      const chunk = toDelete.slice(i, i + chunkSize);
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("class_id", classId)
        .in("participant_id", chunk);

      if (error) throw error;
    }
  }

  return { upserted: upsertPayloads.length, deleted: toDelete.length };
}
