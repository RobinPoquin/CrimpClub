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
    id:          u.id,
    email:       u.email,
    displayName: u.user_metadata?.display_name || "",
    bio:         u.user_metadata?.bio || "",
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    await supabase.auth.signOut();
    return null;
  }
  const u = data.user;
  return {
    id:          u.id,
    email:       u.email,
    displayName: u.user_metadata?.display_name || "",
    bio:         u.user_metadata?.bio || "",
  };
}

// Envoie un email de réinitialisation de mot de passe
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) {
    console.error("Supabase reset error:", error);
    throw new Error(error.message || error.error_description || JSON.stringify(error));
  }
}

// Met à jour les infos du profil (nom, email, bio)
export async function updateProfile({ displayName, email, bio }) {
  const updates = { data: { display_name: displayName, bio } };
  if (email) updates.email = email;

  const { data, error } = await supabase.auth.updateUser(updates);
  if (error) throw new Error(error.message);

  const u = data.user;
  await supabase.from("profiles").upsert({
    id:           u.id,
    display_name: u.user_metadata?.display_name,
    bio:          u.user_metadata?.bio,
  });

  return {
    id:          u.id,
    email:       u.email,
    displayName: u.user_metadata?.display_name || "",
    bio:         u.user_metadata?.bio || "",
  };
}

// Change le mot de passe (utilisateur connecté)
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
