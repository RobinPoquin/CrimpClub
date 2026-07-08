import { supabase } from "./supabase";

export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw new Error(error.message);
  return { id: data.user.id, email: data.user.email, displayName };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const u = data.user;
  return {
    id: u.id,
    email: u.email,
    displayName: u.user_metadata?.display_name || "",
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return null;
  const u = data.user;
  return {
    id: u.id,
    email: u.email,
    displayName: u.user_metadata?.display_name || "",
  };
}
