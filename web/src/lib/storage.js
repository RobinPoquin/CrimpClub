import { supabase } from "./supabase";

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/mov", "video/avi", "video/webm"];

export function validateFile(file) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`Fichier trop lourd (max ${MAX_SIZE_MB} MB).`);
  }
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) {
    throw new Error("Format non supporté. Utilise JPG, PNG, HEIC, MP4 ou MOV.");
  }
  return isImage ? "photo" : "video";
}

export async function uploadMedia(userId, file) {
  const type = validateFile(file);
  const ext  = file.name.split(".").pop().toLowerCase();
  const path = `${userId}/${type}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);

  // Signed URL valable 1 an (bucket privé)
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl, path, type };
}

export async function deleteMedia(path) {
  const { error } = await supabase.storage.from("media").remove([path]);
  if (error) throw new Error(error.message);
}

// Rafraîchit les signed URLs (elles expirent après 1 an)
export async function getSignedUrl(path) {
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
