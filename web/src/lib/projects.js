import { supabase } from "./supabase";

// ── Normalisation ─────────────────────────────
// Convertit les champs snake_case de Supabase en camelCase pour le front
function normaliseProject(p) {
  return {
    id:            p.id,
    userId:        p.user_id,
    routeName:     p.route_name,
    grade:         p.grade,
    type:          p.type,
    outdoor:       p.is_outdoor,
    location:      p.location,
    sector:        p.sector,
    colorId:       p.color_id,
    colorHex:      p.color_hex,
    colorName:     p.color_name,
    gradeHint:     p.grade_hint,
    gymId:         p.gym_id,
    status:        p.status,
    objectiveDate: p.objective_date,
    ascentId:      p.ascent_id,
    createdAt:     p.created_at,
    updatedAt:     p.updated_at,
    // Les tentatives sont chargées séparément
    attempts:      [],
  };
}

function normaliseAttempt(a) {
  return {
    id:        a.id,
    projectId: a.project_id,
    userId:    a.user_id,
    date:      a.date,
    comment:   a.comment,
    photoUrls: (a.photo_urls || []).map(m => {
      const obj = typeof m === "string" ? JSON.parse(m) : m;
      return { url: obj.url, path: obj.path, type: "photo" };
    }),
    videoUrls: (a.video_urls || []).map(m => {
      const obj = typeof m === "string" ? JSON.parse(m) : m;
      return { url: obj.url, path: obj.path, type: "video" };
    }),
    createdAt: a.created_at,
  };
}

// ── Projets ───────────────────────────────────

// Récupère tous les projets d'un user avec leurs tentatives
export async function getProjects(userId) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_attempts(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(p => ({
    ...normaliseProject(p),
    // Trie les tentatives par date décroissante
    attempts: (p.project_attempts || [])
      .map(normaliseAttempt)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
  }));
}

// Crée un nouveau projet
export async function addProject(userId, form) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id:        userId,
      route_name:     form.routeName     || null,
      grade:          form.grade         || null,
      type:           form.type,
      is_outdoor:     form.outdoor       || false,
      location:       form.location      || null,
      sector:         form.sector        || null,
      color_id:       form.colorId       || null,
      color_hex:      form.colorHex      || null,
      color_name:     form.colorName     || null,
      grade_hint:     form.gradeHint     || null,
      gym_id:         form.gymId         || null,
      status:         "en_cours",
      objective_date: form.objectiveDate || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { ...normaliseProject(data), attempts: [] };
}

// Met à jour un projet existant
export async function updateProject(id, form) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      route_name:     form.routeName     || null,
      grade:          form.grade         || null,
      type:           form.type,
      is_outdoor:     form.outdoor       || false,
      location:       form.location      || null,
      sector:         form.sector        || null,
      color_id:       form.colorId       || null,
      color_hex:      form.colorHex      || null,
      color_name:     form.colorName     || null,
      grade_hint:     form.gradeHint     || null,
      gym_id:         form.gymId         || null,
      objective_date: form.objectiveDate || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normaliseProject(data);
}

// Change le statut d'un projet (en_cours, reussi, abandonne)
export async function updateProjectStatus(id, status, ascentId = null) {
  const { data, error } = await supabase
    .from("projects")
    .update({ status, ascent_id: ascentId })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normaliseProject(data);
}

// Supprime un projet et ses tentatives (cascade via FK)
export async function deleteProject(id) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Tentatives ────────────────────────────────

// Ajoute une tentative à un projet
export async function addAttempt(userId, projectId, form) {
  const { data, error } = await supabase
    .from("project_attempts")
    .insert({
      project_id: projectId,
      user_id:    userId,
      date:       form.date,
      comment:    form.comment || null,
      photo_urls: (form.mediaList || []).filter(m => m.type === "photo").map(m => ({ url: m.url, path: m.path })),
      video_urls: (form.mediaList || []).filter(m => m.type === "video").map(m => ({ url: m.url, path: m.path })),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normaliseAttempt(data);
}

// Supprime une tentative
export async function deleteAttempt(id) {
  const { error } = await supabase.from("project_attempts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}