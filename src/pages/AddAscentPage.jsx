import { useState, useEffect } from "react";
import { addAscent, updateAscent } from "../lib/db";
import MediaUploader from "../components/MediaUploader";
import GymColorPicker from "../components/GymColorPicker";
import LocationInput from "../components/LocationInput";
import { saveLocation } from "../lib/locations";
import TagInput from "../components/TagInput";

const GRADES_FRENCH = [
  "3","3+","4","4+","5a","5b","5c",
  "6a","6a+","6b","6b+","6c","6c+",
  "7a","7a+","7b","7b+","7c","7c+",
  "8a","8a+","8b","8b+","8c","8c+",
  "9a","9a+","9b","9b+","9c",
];
const GRADES_BLOC = [
  "3","4","5","5+","6A","6A+","6B","6B+","6C","6C+",
  "7A","7A+","7B","7B+","7C","7C+",
  "8A","8A+","8B","8B+","8C","8C+",
];
const TYPES   = ["Bloc","Diff","Trad","Grande voie","Deep water solo"];
const RESULTS = ["Flash","Travaillé"];
const today   = new Date().toISOString().split("T")[0];

function ascentToForm(a) {
  return {
    grade:      a.grade      || "6a",
    type:       a.type       || "Diff",
    date:       a.date       || today,
    outdoor:    a.outdoor    || false,
    routeName:  a.routeName  || "",
    location:   a.location   || "",
    result:     a.result     || "Travaillé",
    comment:    a.comment    || "",
    mediaList:  a.mediaList  || [],
    gymId:      a.gymId      || null,
    colorId:    a.colorId    || null,
    colorHex:   a.colorHex   || null,
    colorName:  a.colorName  || null,
    gradeHint:  a.gradeHint  || null,
    tags:       a.tags       || [],
    ropeStyle:  a.ropeStyle  || null,
  };
}

const EMPTY = ascentToForm({});

export default function AddAscentPage({ userId, gyms = [], locations = [], spots = [], onSaved, onCancel, onGymsChanged, editAscent = null }) {
  const isEdit = !!editAscent;
  const [form, setForm]     = useState(isEdit ? ascentToForm(editAscent) : EMPTY);
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);
  const [currentGyms, setCurrentGyms] = useState(gyms);
  const [blocMode, setBlocMode] = useState(editAscent?.colorId ? "color" : "grade");

  // Bloc intérieur en mode couleur
  const colorMode = form.type === "Bloc" && !form.outdoor && blocMode === "color";
  const isBloc    = form.type === "Bloc";
  const grades    = isBloc ? GRADES_BLOC : GRADES_FRENCH;

  // Synchronise currentGyms quand le parent recharge les gyms
  useEffect(() => {
    setCurrentGyms(gyms);
  }, [gyms]);

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === "type") {
        const wasBloc = f.type === "Bloc";
        const nowBloc = value === "Bloc";
        if (wasBloc !== nowBloc) next.grade = nowBloc ? "6A" : "6a";
        // Si on quitte le bloc intérieur, reset couleur
        if (!nowBloc || next.outdoor) {
          next.colorId = null; next.colorHex = null; next.colorName = null; next.gymId = null;
        }
      }
      if (field === "outdoor" && (value === true || next.type !== "Bloc")) {
        next.colorId = null; next.colorHex = null; next.colorName = null;
      }
      return next;
    });
    setError("");
  }

  function handleGymChange(gymId) {
    setForm(f => ({ ...f, gymId, colorId: null, colorHex: null, colorName: null, gradeHint: null,
      // Pré-remplir le lieu avec le nom de la salle
      location: currentGyms.find(g => g.id === gymId)?.name || f.location,
    }));
  }

  function handleColorSelect(color) {
    setForm(f => ({
      ...f,
      colorId: color.id,
      colorHex: color.hex,
      colorName: color.name,
      gradeHint: color.gradeHint || null,
      grade: color.gradeHint || f.grade, // pré-remplit la cotation indicative si dispo
    }));
  }

  async function handleGymCreated(gym) {
    // Met à jour les gyms locaux immédiatement
    setCurrentGyms(prev => [...prev, gym]);
    // Auto-sélectionne la salle créée
    handleGymChange(gym.id);
    // Recharge depuis Supabase pour le parent
    if (onGymsChanged) await onGymsChanged();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.location.trim()) { setError("Indique la salle ou le site."); return; }
    if (colorMode && !form.colorId) { setError("Sélectionne la couleur du bloc."); return; }
    setSaving(true);
    try {
      if (isEdit) await updateAscent(editAscent.id, form);
      else        await addAscent(userId, form);
      await saveLocation(userId, form.location, form.outdoor); // Mémorise le lieu automatiquement
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-text" onClick={onCancel}>← Annuler</button>
        <h1>{isEdit ? "Modifier" : "Nouvelle ascension"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="add-form">

        {/* Type */}
        <div className="field">
          <label>Type de grimpe</label>
          <div className="pill-group">
            {TYPES.map(t => (
              <button key={t} type="button" className={`pill ${form.type === t ? "pill-active" : ""}`} onClick={() => set("type", t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* Extérieur toggle (avant cotation pour conditionner le mode) */}
        <div className="toggle-row">
          <div>
            <span className="toggle-label">En extérieur</span>
            <span className="toggle-sub">{form.outdoor ? "Falaise / montagne" : "Salle d'escalade"}</span>
          </div>
          <button type="button" role="switch" aria-checked={form.outdoor}
            className={`toggle ${form.outdoor ? "toggle-on" : ""}`}
            onClick={() => set("outdoor", !form.outdoor)} />
        </div>

        {/* Choix du mode de cotation pour les blocs intérieurs */}
        {form.type === "Bloc" && !form.outdoor && (
          <div className="field">
            <label>Système de cotation</label>
            <div className="pill-group">
              <button type="button"
                className={`pill ${blocMode === "color" ? "pill-active" : ""}`}
                onClick={() => {
                  setBlocMode("color");
                  // Reset la cotation officielle si on passe en couleur
                  set("grade", "6A");
                }}>
                🎨 Couleurs
              </button>
              <button type="button"
                className={`pill ${blocMode === "grade" ? "pill-active" : ""}`}
                onClick={() => {
                  setBlocMode("grade");
                  // Reset les couleurs si on passe en cotation
                  set("colorId", null);
                  set("colorHex", null);
                  set("colorName", null);
                  set("gymId", null);
                }}>
                🔢 Cotation officielle
              </button>
            </div>
          </div>
        )}

        {/* COTATION — mode couleur ou mode classique */}
        {colorMode ? (
        /* ── Mode couleur : Bloc intérieur ── */
          <>
            <GymColorPicker
              gyms={currentGyms}
              selectedGymId={form.gymId}
              selectedColorId={form.colorId}
              onGymChange={handleGymChange}
              onColorSelect={handleColorSelect}
              userId={userId}
              onGymCreated={handleGymCreated}
            />
          </>
        ) : (
          /* ── Mode classique ── */
          <>
            <div className="field">
              <label>Cotation</label>
              <select value={form.grade} onChange={e => set("grade", e.target.value)}>
                {grades.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{form.outdoor ? "Site extérieur" : "Salle"}</label>
              <LocationInput
                value={form.location}
                onChange={v => set("location", v)}
                locations={form.outdoor ? spots.map(s => ({ ...s, logoUrl: s.logo_url })) : [
                  ...currentGyms
                    .filter(g => !form.outdoor && (g.types || []).includes(form.type.toLowerCase()))
                    .map(g => ({ id: g.id, name: g.name, is_outdoor: false, logoUrl: g.logoUrl })),
                  ...locations.filter(l => 
                    !l.is_outdoor && !currentGyms.find(g => g.name === l.name)
                  ),
                ]}
                placeholder={form.outdoor ? "ex. Gorges du Verdon" : "ex. Arkose Nation"}
                userId={userId}
                gyms={currentGyms}
                onGymCreated={handleGymCreated}
                showCreateGym={true}
                isOutdoor={form.outdoor}
              />
            </div>
          </>
        )}

        {/* Résultat */}
        <div className="field">
          <label>Résultat</label>
          <div className="pill-group">
            {RESULTS.map(r => (
              <button key={r} type="button" className={`pill ${form.result === r ? "pill-active" : ""}`} onClick={() => set("result", r)}>{r}</button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="field">
          <label>Date</label>
          <input type="date" value={form.date} max={today} onChange={e => set("date", e.target.value)} required />
        </div>

        {/* Nom voie */}
        <div className="field">
          <label>Nom de la voie <span className="optional">(optionnel)</span></label>
          <input type="text" placeholder="ex. La Directe" value={form.routeName} onChange={e => set("routeName", e.target.value)} />
        </div>

        {/* Commentaire */}
        <div className="field">
          <label>Commentaire <span className="optional">(optionnel)</span></label>
          <textarea rows={3} placeholder="Ressenti, conditions, clé de pas, beta…"
            value={form.comment} onChange={e => set("comment", e.target.value)} />
        </div>

        {/* Tags libres — caractéristiques de la voie */}
        <div className="field">
          <label>Tags <span className="optional">(optionnel)</span></label>
          <TagInput
            tags={form.tags}
            onChange={t => set("tags", t)}
          />
        </div>

        {/* Moulinette / Tête — uniquement pour les voies (pas le bloc) */}
        {form.type !== "Bloc" && (
          <div className="field">
            <label>Style <span className="optional">(optionnel)</span></label>
            <div className="pill-group">
              <button type="button"
                className={`pill ${form.ropeStyle === "moulinette" ? "pill-active" : ""}`}
                onClick={() => set("ropeStyle", form.ropeStyle === "moulinette" ? null : "moulinette")}>
                🔄 Moulinette
              </button>
              <button type="button"
                className={`pill ${form.ropeStyle === "tete" ? "pill-active" : ""}`}
                onClick={() => set("ropeStyle", form.ropeStyle === "tete" ? null : "tete")}>
                🧗 En tête
              </button>
            </div>
          </div>
        )}

        <div className="field">
          <label>Photo / vidéo <span className="optional">(optionnel)</span></label>
          <MediaUploader
            userId={userId}
            mediaList={form.mediaList}
            onChange={list => set("mediaList", list)}
          />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Enregistrer l'ascension"}
        </button>
      </form>
    </div>
  );
}
