import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  window.SUPABASE_URL ||
  localStorage.getItem("SUPABASE_URL") ||
  "";
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  window.SUPABASE_ANON_KEY ||
  localStorage.getItem("SUPABASE_ANON_KEY") ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase credentials missing. Set window.SUPABASE_URL and window.SUPABASE_ANON_KEY in client/js/config.js."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
