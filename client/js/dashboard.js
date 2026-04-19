import { supabase } from "./supabaseClient.js";

/**
 * Fetch dashboard aggregate metrics from SQL view.
 */
export async function fetchDashboardData() {
  const { data, error } = await supabase
    .from("dashboard_stats")
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
