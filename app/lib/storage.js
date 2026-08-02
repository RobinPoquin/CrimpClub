import { supabase } from "./supabase";

// Upload d'un fichier média vers Supabase Storage
// Sur React Native on utilise fetch + FormData au lieu de File API web
export async function uploadMedia(userId, mediaItem) {
  const { uri, type } = mediaItem;
  
  const ext  = uri.split('.').pop().toLowerCase();
  const path = `${userId}/${type}_${Date.now()}.${ext}`;

  // Sur React Native, on utilise FormData au lieu de blob
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: `file.${ext}`,
    type: type === "photo" ? `image/${ext}` : `video/${ext}`,
  });

  const { error } = await supabase.storage
    .from("media")
    .upload(path, formData, {
      contentType:  type === "photo" ? `image/${ext}` : `video/${ext}`,
      cacheControl: "3600",
      upsert:       false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl, path, type };
}

// Supprime un média depuis Supabase Storage
export async function deleteMedia(path) {
  if (!path) return;
  const { error } = await supabase.storage.from("media").remove([path]);
  if (error) throw new Error(error.message);
}