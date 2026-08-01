import { supabase } from "./supabase";

export async function getAscents(userId) {
  const { data, error } = await supabase
    .from("ascents")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(normalise);
}

export async function addAscent(userId, form) {
  const { data, error } = await supabase
    .from("ascents")
    .insert({
      user_id:       userId,
      route_name:    form.routeName || null,
      grade:         form.grade,
      type:          form.type,
      result:        form.result,
      is_outdoor:    form.outdoor,
      location_name: form.location || null,
      sector:        form.sector || null,
      date:          form.date,
      comment:       form.comment || null,
      gym_id:        form.gymId   || null,
      color_id:      form.colorId || null,
      color_hex:     form.colorHex || null,
      color_name:    form.colorName || null,
      grade_hint:    form.gradeHint || null,
      photo_urls:    (form.mediaList || []).filter(m => m.type === "photo").map(m => ({ url: m.url, path: m.path })),
      video_urls:    (form.mediaList || []).filter(m => m.type === "video").map(m => ({ url: m.url, path: m.path })),
      tags:        form.tags       || [],
      rope_style:  form.ropeStyle  || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalise(data);
}

export async function updateAscent(id, form) {
  const { data, error } = await supabase
    .from("ascents")
    .update({
      route_name:    form.routeName || null,
      grade:         form.grade,
      type:          form.type,
      result:        form.result,
      is_outdoor:    form.outdoor,
      location_name: form.location || null,
      sector:        form.sector || null,
      date:          form.date,
      comment:       form.comment || null,
      gym_id:        form.gymId   || null,
      color_id:      form.colorId || null,
      color_hex:     form.colorHex || null,
      color_name:    form.colorName || null,
      grade_hint:    form.gradeHint || null,
      photo_urls:    (form.mediaList || []).filter(m => m.type === "photo").map(m => ({ url: m.url, path: m.path })),
      video_urls:    (form.mediaList || []).filter(m => m.type === "video").map(m => ({ url: m.url, path: m.path })),
      tags:        form.tags       || [],
      rope_style:  form.ropeStyle  || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalise(data);
}

export async function deleteAscent(id) {
  // Récupère les médias avant suppression
  const { data } = await supabase
    .from("ascents")
    .select("photo_urls, video_urls")
    .eq("id", id)
    .single();

  // Supprime les fichiers Storage
  if (data) {
    const paths = [
      ...(data.photo_urls || []).map(m => (typeof m === "string" ? JSON.parse(m) : m).path),
      ...(data.video_urls || []).map(m => (typeof m === "string" ? JSON.parse(m) : m).path),
    ].filter(Boolean);

    if (paths.length > 0) {
      await supabase.storage.from("media").remove(paths);
    }
  }

  const { error } = await supabase.from("ascents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function migrateMediaUrls() {
  const { data, error } = await supabase
    .from("ascents")
    .select("id, photo_urls, video_urls");
  if (error) throw new Error(error.message);

  for (const ascent of data || []) {
    const fix = urls => (urls || []).map(m => {
      const obj = typeof m === "string" ? JSON.parse(m) : m;
      const url = obj.url?.replace("/object/sign/", "/object/public/").split("?")[0];
      return { url, path: obj.path };
    });

    await supabase.from("ascents").update({
      photo_urls: fix(ascent.photo_urls),
      video_urls: fix(ascent.video_urls),
    }).eq("id", ascent.id);
  }
}

function normalise(a) {
  return {
    id:        a.id,
    userId:    a.user_id,
    routeName: a.route_name,
    grade:     a.grade,
    type:      a.type,
    result:    a.result,
    outdoor:   a.is_outdoor,
    location:  a.location_name,
    sector:    a.sector || null,
    date:      a.date,
    comment:   a.comment,
    gymId:     a.gym_id,
    colorId:   a.color_id,
    colorHex:  a.color_hex,
    colorName: a.color_name,
    gradeHint: a.grade_hint,
    photoUrls: a.photo_urls || [],
    videoUrls: a.video_urls || [],
    mediaList: [
      ...(a.photo_urls || []).map(m => {
        const obj = typeof m === "string" ? JSON.parse(m) : m;
        return { url: obj.url, path: obj.path, type: "photo" };
      }),
      ...(a.video_urls || []).map(m => {
        const obj = typeof m === "string" ? JSON.parse(m) : m;
        return { url: obj.url, path: obj.path, type: "video" };
      }),
    ],
    createdAt: a.created_at,
    tags:       a.tags       || [],
    ropeStyle:  a.rope_style || null,
  };
}

// Charge les ascensions par page (20 par défaut)
// page 0 = premières 20, page 1 = suivantes 20, etc.
export async function getAscentsPaginated(userId, page = 0, pageSize = 20) {
  const { data, error } = await supabase
    .from("ascents")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  if (error) throw new Error(error.message);
  return (data || []).map(normalise);
}