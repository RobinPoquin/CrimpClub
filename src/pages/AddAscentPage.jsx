import { useState } from "react";
import { addAscent, updateAscent } from "../lib/db";

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
const TYPES   = ["Bloc","Diff","Trad","Grande voie","SAE","Deep water solo"];
const RESULTS = ["À vue","Flash","Travaillé","Projet"];
const today   = new Date().toISOString().split("T")[0];

function ascentToForm(a) {
  return {
    grade:     a.grade     || "6a",
    type:      a.type      || "Diff",
    date:      a.date      || today,
    outdoor:   a.outdoor   || false,
    routeName: a.routeName || "",
    location:  a.location  || "",
    result:    a.result    || "Travaillé",
    comment:   a.comment   || "",
  };
}

const EMPTY = ascentToForm({});

export default function AddAscentPage({ userId, onSaved, onCancel, editAscent = null }) {
  const isEdit = !!editAscent;
  const [form, setForm]   = useState(isEdit ? ascentToForm(editAscent) : EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isBloc = form.type === "Bloc";
  const grades = isBloc ? GRADES_BLOC : GRADES_FRENCH;

  function set(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "type") {
        const wasBloc = f.type === "Bloc";
        const nowBloc = value === "Bloc";
        if (wasBloc !== nowBloc) next.grade = nowBloc ? "6A" : "6a";
      }
      return next;
    });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.location.trim()) { setError("Indique la salle ou le site."); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateAscent(editAscent.id, form);
      } else {
        await addAscent(userId, form);
      }
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
        <div className="field">
          <label>Type de grimpe</label>
          <div className="pill-group">
            {TYPES.map((t) => (
              <button key={t} type="button" className={`pill ${form.type === t ? "pill-active" : ""}`} onClick={() => set("type", t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Cotation</label>
          <select value={form.grade} onChange={(e) => set("grade", e.target.value)}>
            {grades.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Résultat</label>
          <div className="pill-group">
            {RESULTS.map((r) => (
              <button key={r} type="button" className={`pill ${form.result === r ? "pill-active" : ""}`} onClick={() => set("result", r)}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Date</label>
          <input type="date" value={form.date} max={today} onChange={(e) => set("date", e.target.value)} required />
        </div>

        <div className="toggle-row">
          <div>
            <span className="toggle-label">En extérieur</span>
            <span className="toggle-sub">{form.outdoor ? "Falaise / montagne" : "Salle d'escalade"}</span>
          </div>
          <button type="button" role="switch" aria-checked={form.outdoor} className={`toggle ${form.outdoor ? "toggle-on" : ""}`} onClick={() => set("outdoor", !form.outdoor)} />
        </div>

        <div className="field">
          <label>{form.outdoor ? "Site extérieur" : "Salle"}</label>
          <input type="text" placeholder={form.outdoor ? "ex. Gorges du Verdon" : "ex. Arkose Nation"} value={form.location} onChange={(e) => set("location", e.target.value)} />
        </div>

        <div className="field">
          <label>Nom de la voie <span className="optional">(optionnel)</span></label>
          <input type="text" placeholder="ex. La Directe" value={form.routeName} onChange={(e) => set("routeName", e.target.value)} />
        </div>

        <div className="field">
          <label>Commentaire <span className="optional">(optionnel)</span></label>
          <textarea rows={3} placeholder="Ressenti, conditions, clé de pas, beta…" value={form.comment} onChange={(e) => set("comment", e.target.value)} />
        </div>

        {!isEdit && (
          <div className="field">
            <label>Photo / vidéo <span className="optional">(optionnel)</span></label>
            <div className="media-btns">
              <button type="button" className="btn-media">📷 Ajouter une photo</button>
              <button type="button" className="btn-media">🎥 Ajouter une vidéo</button>
            </div>
            <p className="field-hint">Stockage media via Supabase Storage — voir docs/SETUP.md</p>
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Enregistrer l'ascension"}
        </button>
      </form>
    </div>
  );
}
