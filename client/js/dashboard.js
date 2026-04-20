import { supabase } from "./supabaseClient.js";

export async function fetchDashboardData() {
  const { data, error } = await supabase
    .from("dashboard_stats")
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
