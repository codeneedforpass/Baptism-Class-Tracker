import { supabase } from "./supabaseClient.js";

/**
 * Fetch all participants ordered by newest enrollment first.
 */
export async function fetchAllParticipants() {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .order("enrolled_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Search and filter participants.
 * Uses:
 * - .ilike() for name search
 * - .eq() for exact status
 * - .gte()/.lte() for baptism_date range
 *
 * @param {Object} filters
 * @param {string} [filters.name] - Search text for first/last name
 * @param {string} [filters.status] - Participant status filter
 * @param {string} [filters.baptismDateFrom] - YYYY-MM-DD
 * @param {string} [filters.baptismDateTo] - YYYY-MM-DD
 */
export async function fetchParticipantsByFilters(filters = {}) {
  const { name, status, baptismDateFrom, baptismDateTo } = filters;

  let query = supabase
    .from("participants")
    .select("*, baptismschedule(status, baptism_date)")
    .order("enrolled_at", { ascending: false });

  if (name && name.trim()) {
    const safeName = name.trim().replace(/,/g, " ");
    query = query.or(`first_name.ilike.%${safeName}%,last_name.ilike.%${safeName}%`);
  }

  if (status && status.trim()) {
    query = query.eq("baptismschedule.status", status.trim());
  }

  if (baptismDateFrom && baptismDateFrom.trim()) {
    query = query.gte("baptismschedule.baptism_date", baptismDateFrom.trim());
  }

  if (baptismDateTo && baptismDateTo.trim()) {
    query = query.lte("baptismschedule.baptism_date", baptismDateTo.trim());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Insert one participant record.
 * @param {Object} participant - Participant payload
 */
export async function insertParticipant(participant) {
  const { data, error } = await supabase
    .from("participants")
    .insert([participant])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a participant by id.
 * @param {string} participantId
 * @param {Object} updates - Partial participant fields to update
 */
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

/**
 * Delete a participant by id.
 * @param {string} participantId
 */
export async function deleteParticipant(participantId) {
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("participant_id", participantId);

  if (error) throw error;
  return { success: true };
}
