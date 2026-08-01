import { supabase } from "./supabase";

// Upload d'un avatar ou logo dans le bucket avatars
export async function uploadAvatar(userId, file, folder = "avatars") {
  const ext  = file.name.split(".").pop().toLowerCase();
  const path = `${userId}/${folder}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

// Supprime un ancien avatar/logo
export async function deleteAvatar(url) {
  if (!url) return;
  // Extrait le path depuis l'URL publique
  const path = url.split("/avatars/")[1];
  if (!path) return;
  await supabase.storage.from("avatars").remove([path]);
}