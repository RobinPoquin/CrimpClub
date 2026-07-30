import { supabase } from "./supabase";

// UUIDs autorisés à accéder à la SimComp (dev + prod)
export const SIMCOMP_ALLOWED_USERS = [
  "cdee2afa-e05c-4438-b861-28740356d161", // dev
  "47fb20ea-adb2-4286-9f86-44a3b0126a1b", // prod
];

// Vérifie si l'utilisateur a accès à la SimComp
export function canAccessSimcomp(userId) {
  return SIMCOMP_ALLOWED_USERS.includes(userId);
}

// Calcule le score IFSC d'un bloc
// Top en 1 essai = 25pts, chaque essai supplémentaire = -0.1pt
// Zone en 1 essai = 10pts, chaque essai supplémentaire = -0.1pt
export function calculateBlocScore(bloc) {
  // Essais manqués = essais totaux - 1
  const zoneManques = bloc.zoneEssais !== null ? bloc.zoneEssais - 1 : 0;
  const topManques  = bloc.topEssais  !== null ? bloc.topEssais  - 1 : 0;

  // Zone atteinte sans top → 10 - essais manqués zone
  if (bloc.zoneEssais !== null && bloc.topEssais === null) {
    return Math.max(0, Math.round((10 - zoneManques * 0.1) * 10) / 10);
  }

  // Top atteint → 25 - essais manqués (max entre zone et top car le top inclut la zone)
  if (bloc.topEssais !== null) {
    return Math.max(0, Math.round((25 - Math.max(zoneManques, topManques) * 0.1) * 10) / 10);
  }

  return 0;
}

// Calcule le score total d'une simulation
export function calculateTotalScore(blocs) {
  return blocs.reduce((total, bloc) => {
    return Math.round((total + calculateBlocScore(bloc)) * 10) / 10;
  }, 0);
}

// Crée un bloc vide avec les valeurs par défaut
export function createEmptyBloc(index) {
  return {
    id:         index + 1,
    nom:        `Bloc ${index + 1}`,
    zoneEssais: null,  // null = non atteint
    topEssais:  null,  // null = non atteint
    photoUrl:   null,
    photoPath:  null,
  };
}

// Récupère toutes les simulations
export async function getSimcomps(userId) {
  const { data, error } = await supabase
    .from("simcomp")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// Crée une nouvelle simulation
export async function addSimcomp(userId, { name, nbBlocs, blocs, totalScore }) {
  const { data, error } = await supabase
    .from("simcomp")
    .insert({
      user_id:     userId,
      name,
      nb_blocs:    nbBlocs,
      blocs,
      total_score: totalScore,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Met à jour une simulation existante
export async function updateSimcomp(id, { name, blocs, totalScore }) {
  const { data, error } = await supabase
    .from("simcomp")
    .update({ name, blocs, total_score: totalScore })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Supprime une simulation
export async function deleteSimcomp(id) {
  const { error } = await supabase.from("simcomp").delete().eq("id", id);
  if (error) throw new Error(error.message);
}