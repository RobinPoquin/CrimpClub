import { supabase } from "./supabase";

// Récupère tous les secteurs d'un user, optionnellement filtrés par spot
export async function getSectors(userId, spotName = null) {
  let query = supabase
    .from("sectors")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  // Filtre par spot si précisé
  if (spotName) query = query.eq("spot_name", spotName);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

// Enregistre un secteur s'il n'existe pas déjà (UNIQUE sur user_id + spot_name + name)
export async function saveSector(userId, spotName, sectorName) {
  if (!sectorName?.trim() || !spotName?.trim()) return;
  await supabase
    .from("sectors")
    .upsert(
      { user_id: userId, spot_name: spotName.trim(), name: sectorName.trim() },
      { onConflict: "user_id,spot_name,name" }
    );
}

// Supprime un secteur par son nom et son spot
export async function deleteSector(userId, spotName, sectorName) {
  const { error } = await supabase
    .from("sectors")
    .delete()
    .eq("user_id", userId)
    .eq("spot_name", spotName)
    .eq("name", sectorName);
  if (error) throw new Error(error.message);
}