import { supabase } from "./supabaseClient.js";

/**
 * Fetch all baptism schedule rows ordered by baptism date.
 */
export async function fetchAllBaptismSchedules() {
  const { data, error } = await supabase
    .from("baptism_schedule")
    .select("*")
    .order("baptism_date", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Fetch baptism schedules for one participant.
 * @param {string} participantId
 */
export async function fetchBaptismSchedulesByParticipant(participantId) {
  const { data, error } = await supabase
    .from("baptism_schedule")
    .select("*")
    .eq("participant_id", participantId)
    .order("baptism_date", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Insert one baptism schedule record.
 * @param {Object} schedulePayload
 */
export async function insertBaptismSchedule(schedulePayload) {
  const { data, error } = await supabase
    .from("baptism_schedule")
    .insert([schedulePayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a baptism schedule by id.
 * @param {string} scheduleId
 * @param {Object} updates
 */
export async function updateBaptismSchedule(scheduleId, updates) {
  const { data, error } = await supabase
    .from("baptism_schedule")
    .update(updates)
    .eq("schedule_id", scheduleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a baptism schedule by id.
 * @param {string} scheduleId
 */
export async function deleteBaptismSchedule(scheduleId) {
  const { error } = await supabase
    .from("baptism_schedule")
    .delete()
    .eq("schedule_id", scheduleId);

  if (error) throw error;
  return { success: true };
}
