import { supabase } from "./supabaseClient.js";

/**
 * Fetch all classes ordered by class date.
 */
export async function fetchAllClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("class_date", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Paged class list (same sort as fetchAllClasses).
 * @param {Object} opts
 * @param {number} [opts.limit]
 * @param {number} [opts.offset]
 */
export async function fetchClassesPaged(opts = {}) {
  const { limit, offset } = opts;

  let query = supabase.from("classes").select("*", { count: "exact" }).order("class_date", { ascending: true });

  if (typeof limit === "number" && limit > 0) {
    const safeOffset = typeof offset === "number" && offset >= 0 ? offset : 0;
    query = query.range(safeOffset, safeOffset + limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data, count };
}

/**
 * Insert one class record.
 * @param {Object} classPayload
 */
export async function insertClass(classPayload) {
  const { data, error } = await supabase
    .from("classes")
    .insert([classPayload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a class by id.
 * @param {string} classId
 * @param {Object} updates
 */
export async function updateClass(classId, updates) {
  const { data, error } = await supabase
    .from("classes")
    .update(updates)
    .eq("class_id", classId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a class by id.
 * @param {string} classId
 */
export async function deleteClass(classId) {
  const { error } = await supabase.from("classes").delete().eq("class_id", classId);

  if (error) throw error;
  return { success: true };
}
