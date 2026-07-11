import { supabase } from "./supabase";

// ── Gyms ────────────────────────────────────────
// Chaque gym appartient à un user et possède un tableau de couleurs ordonnées :
// colors: [{ id, name, hex, gradeHint }]
// gradeHint est optionnel (ex: "~6A") pour info seulement

export async function getGyms(userId) {
  const { data, error } = await supabase
    .from("gyms")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data || []).map(normaliseGym);
}

export async function addGym(userId, { name, colors }) {
  const { data, error } = await supabase
    .from("gyms")
    .insert({ user_id: userId, name, colors })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normaliseGym(data);
}

export async function updateGym(id, { name, colors }) {
  const { data, error } = await supabase
    .from("gyms")
    .update({ name, colors })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normaliseGym(data);
}

export async function deleteGym(id) {
  const { error } = await supabase.from("gyms").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function normaliseGym(g) {
  return {
    id:     g.id,
    userId: g.user_id,
    name:   g.name,
    colors: g.colors || [],
  };
}
