import { supabase } from "./supabaseClient.js";

export async function fetchAllParticipants() {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .order("enrolled_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchParticipantById(participantId) {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("participant_id", participantId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchParticipantsByFilters(filters = {}) {
  const { name, status, baptismDateFrom, baptismDateTo, limit, offset } = filters;

  let query = supabase
    .from("participants")
    .select("*, baptism_schedule(status, baptism_date, baptism_time, schedule_id)", { count: "exact" })
    .order("enrolled_at", { ascending: false })
    .order("baptism_date", { ascending: false, foreignTable: "baptism_schedule" });

  if (name && name.trim()) {
    const safeName = name.trim().replace(/,/g, " ");
    query = query.or(`first_name.ilike.%${safeName}%,last_name.ilike.%${safeName}%`);
  }

  if (status && status.trim()) {
    query = query.eq("baptism_schedule.status", status.trim());
  }

  if (baptismDateFrom && baptismDateFrom.trim()) {
    query = query.gte("baptism_schedule.baptism_date", baptismDateFrom.trim());
  }

  if (baptismDateTo && baptismDateTo.trim()) {
    query = query.lte("baptism_schedule.baptism_date", baptismDateTo.trim());
  }

  if (typeof limit === "number" && limit > 0) {
    const safeOffset = typeof offset === "number" && offset >= 0 ? offset : 0;
    query = query.range(safeOffset, safeOffset + limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data, count };
}

export async function insertParticipant(participant) {
  const { data, error } = await supabase
    .from("participants")
    .insert([participant])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateParticipant(participantId, updates) {
  const { data, error } = await supabase
    .from("participants")
    .update(updates)
    .eq("participant_id", participantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteParticipant(participantId) {
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("participant_id", participantId);

  if (error) throw error;
  return { success: true };
}
