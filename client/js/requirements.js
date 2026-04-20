import { supabase } from "./supabaseClient.js";

export async function fetchAllRequirements() {
  const { data, error } = await supabase
    .from("requirements")
    .select("*")
    .order("verified_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data;
}

export async function fetchRequirementsByParticipant(participantId) {
  const { data, error } = await supabase
    .from("requirements")
    .select("*")
    .eq("participant_id", participantId)
    .order("verified_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data;
}

export async function insertRequirement(requirementPayload) {
  const { data, error } = await supabase
    .from("requirements")
    .insert([requirementPayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRequirement(requirementId, updates) {
  const { data, error } = await supabase
    .from("requirements")
    .update(updates)
    .eq("requirement_id", requirementId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRequirement(requirementId) {
  const { error } = await supabase
    .from("requirements")
    .delete()
    .eq("requirement_id", requirementId);

  if (error) throw error;
  return { success: true };
}
