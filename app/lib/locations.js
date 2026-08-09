import { supabase } from "./supabase";

// Récupère tous les lieux mémorisés d'un user
export async function getLocations(userId) {
  const { data, error } = await supabase
    .from("user_locations")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  if (error) throw new Error(error.message);
  return data || [];
}

// Enregistre un lieu s'il n'existe pas déjà (UNIQUE sur user_id + name)
export async function saveLocation(userId, name, isOutdoor, types, logoUrl) {
  if (!name?.trim()) return;
  
  // Vérifie si le lieu existe déjà
  const { data: existing } = await supabase
    .from("user_locations")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name.trim())
    .single();

  if (existing) {
    // Met à jour la ligne existante
    const { data: updateData, error: updateError } = await supabase
      .from("user_locations")
      .update({ types: types || ['bloc', 'diff'], logo_url: logoUrl || null })
      .eq("id", existing.id)
      .select()

    return updateData;
  } else {
    // Crée une nouvelle ligne
    const { data } = await supabase
      .from("user_locations")
      .insert({ user_id: userId, name: name.trim(), is_outdoor: isOutdoor, types: types || ['bloc', 'diff'], logo_url: logoUrl || null })
      .select()
      .single();
    return data;
  }
}

// Supprime un lieu mémorisé
export async function deleteLocation(id) {
  const { error } = await supabase.from("user_locations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Supprime un lieu par son nom (utilisé quand une salle est supprimée)
  export async function deleteLocationByName(userId, name) {
    const { error } = await supabase
      .from("user_locations")
      .delete()
      .eq("user_id", userId)
      .eq("name", name);
    if (error) throw new Error(error.message);
  }