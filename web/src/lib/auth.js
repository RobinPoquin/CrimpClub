import { supabase } from "./supabase";

// Formate l'objet user Supabase en objet simplifié pour React
function formatUser(u) {
  return {
    id:          u.id,
    email:       u.email,
    displayName: u.user_metadata.display_name || "",
    bio:         u.user_metadata.bio          || "",
    avatarUrl:   u.user_metadata.avatar_url   || null,
  };
}

// Crée un nouveau compte utilisateur
// displayName est stocké dans user_metadata, un champ JSON libre de Supabase
export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw new Error(error.message);
  return { id: data.user.id, email: data.user.email, displayName };
}

// Connecte un utilisateur existant avec email + mot de passe
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return formatUser(data.user);
}

// Déconnecte l'utilisateur (supprime la session du navigateur)
export async function signOut() {
  await supabase.auth.signOut();
}

// Vérifie si l'user est déjà connecté au démarrage
// Si le token est expiré, force une déconnexion propre
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    // Nettoie la session corrompue pour éviter une page blanche
    await supabase.auth.signOut();
    return null;
  }
  return formatUser(data.user);
}

// Envoie un email de réinitialisation
// window.location.origin = URL de base (prod ou localhost selon l'environnement)
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message || JSON.stringify(error));
}

// Met à jour le profil — deux endroits simultanément :
// user_metadata (auth Supabase) + table profiles (pour le futur système social)
export async function updateProfile({ displayName, email, bio, avatarUrl }) {
  const updates = { data: { display_name: displayName, bio, avatar_url: avatarUrl } };
  // On n'envoie l'email que s'il est défini pour éviter d'écraser l'email existant
  if (email) updates.email = email;

  const { data, error } = await supabase.auth.updateUser(updates);
  if (error) throw new Error(error.message);

  // Synchronise aussi la table profiles pour le futur système social
  await supabase.from("profiles").upsert({
    id:           data.user.id,
    display_name: data.user.user_metadata.display_name,
    bio:          data.user.user_metadata.bio,
    avatar_url:   data.user.user_metadata.avatar_url,
  });

  return formatUser(data.user);
}

// Change le mot de passe (nécessite une session valide)
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}