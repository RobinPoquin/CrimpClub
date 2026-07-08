import { supabase } from "./supabase";

export async function uploadMedia(userId, file, type = "photo") {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${type}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
