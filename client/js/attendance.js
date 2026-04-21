import { supabase } from "./supabaseClient.js";

export async function fetchAllAttendance() {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .order("marked_at", { ascending: false });

  if (error) throw error;
  return data;
}

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

export async function fetchAttendanceByFilters(opts = {}) {
  const { participantId, classId, status, markedFrom, markedTo, limit, offset } = opts;

  let query = supabase.from("attendance").select("*", { count: "exact" }).order("marked_at", { ascending: false });

  if (participantId && String(participantId).trim()) {
    query = query.eq("participant_id", String(participantId).trim());
  }

  if (classId && String(classId).trim()) {
    query = query.eq("class_id", String(classId).trim());
  }

  if (status && String(status).trim()) {
    query = query.eq("attendance_status", String(status).trim());
  }

  if (markedFrom && String(markedFrom).trim()) {
    query = query.gte("marked_at", `${String(markedFrom).trim()}T00:00:00`);
  }

  if (markedTo && String(markedTo).trim()) {
    query = query.lte("marked_at", `${String(markedTo).trim()}T23:59:59.999`);
  }

  if (typeof limit === "number" && limit > 0) {
    const safeOffset = typeof offset === "number" && offset >= 0 ? offset : 0;
    query = query.range(safeOffset, safeOffset + limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data, count };
}

export async function fetchAttendanceByParticipant(participantId) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("participant_id", participantId)
    .order("marked_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchAttendanceByClass(classId) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("class_id", classId)
    .order("marked_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function insertAttendance(attendancePayload) {
  const { data, error } = await supabase
    .from("attendance")
    .insert([attendancePayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

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

export async function deleteAttendance(attendanceId) {
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("attendance_id", attendanceId);

  if (error) throw error;
  return { success: true };
}

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
