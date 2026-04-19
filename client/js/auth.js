import { supabase } from "./supabaseClient.js";

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    window.location.href = "./login.html";
    throw new Error("No active session");
  }
  return session;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return data.subscription;
}
