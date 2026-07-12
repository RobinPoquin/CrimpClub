import { useState } from "react";
import { addAscent, updateAscent } from "../lib/db";
import MediaUploader from "../components/MediaUploader";
import GymColorPicker from "../components/GymColorPicker";

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
const RESULTS = ["À vue","Flash","Travaillé","Projet"];
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
  };
}

const EMPTY = ascentToForm({});

// Bloc intérieur = mode couleur
const isColorMode = (form) => form.type === "Bloc" && !form.outdoor;

export default function AddAscentPage({ userId, gyms = [], onSaved, onCancel, editAscent = null }) {
  const isEdit = !!editAscent;
  const [form, setForm]     = useState(isEdit ? ascentToForm(editAscent) : EMPTY);
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);

  const colorMode = isColorMode(form);
  const isBloc    = form.type === "Bloc";
  const grades    = isBloc ? GRADES_BLOC : GRADES_FRENCH;

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
      location: gyms.find(g => g.id === gymId)?.name || f.location,
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.location.trim()) { setError("Indique la salle ou le site."); return; }
    if (colorMode && !form.colorId) { setError("Sélectionne la couleur du bloc."); return; }
    setSaving(true);
    try {
      if (isEdit) await updateAscent(editAscent.id, form);
      else        await addAscent(userId, form);
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

        {/* COTATION — mode couleur ou mode classique */}
        {colorMode ? (
          /* ── Mode couleur : Bloc intérieur ── */
          <GymColorPicker
            gyms={gyms}
            selectedGymId={form.gymId}
            selectedColorId={form.colorId}
            onGymChange={handleGymChange}
            onColorSelect={handleColorSelect}
          />
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
              <input type="text"
                placeholder={form.outdoor ? "ex. Gorges du Verdon" : "ex. Arkose Nation"}
                value={form.location}
                onChange={e => set("location", e.target.value)} />
            </div>
          </>
        )}

        {/* Lieu (mode couleur : déjà pré-rempli, mais éditable) */}
        {colorMode && (
          <div className="field">
            <label>Salle <span className="optional">(pré-rempli)</span></label>
            <input type="text" placeholder="Nom de la salle"
              value={form.location} onChange={e => set("location", e.target.value)} />
          </div>
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
