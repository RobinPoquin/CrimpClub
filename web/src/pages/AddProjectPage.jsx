import { useState } from "react";
import { addProject, updateProject } from "../lib/projects";
import GymColorPicker from "../components/GymColorPicker";
import LocationInput from "../components/LocationInput";
import SectorInput from "../components/SectorInput";

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
const TYPES = ["Bloc","Diff","Trad","Grande voie","Deep water solo"];
const today = new Date().toISOString().split("T")[0];

// Convertit un projet en formulaire
function projectToForm(p) {
  return {
    routeName:     p?.routeName     || "",
    grade:         p?.grade         || "6a",
    type:          p?.type          || "Diff",
    outdoor:       p?.outdoor       || false,
    location:      p?.location      || "",
    sector:        p?.sector        || "",
    colorId:       p?.colorId       || null,
    colorHex:      p?.colorHex      || null,
    colorName:     p?.colorName     || null,
    gradeHint:     p?.gradeHint     || null,
    gymId:         p?.gymId         || null,
    objectiveDate: p?.objectiveDate || "",
  };
}

export default function AddProjectPage({ userId, gyms = [], spots = [], locations = [], sectors = [], editProject = null, onSaved, onCancel }) {
  const isEdit = !!editProject;
  const [form, setForm]     = useState(projectToForm(editProject));
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);
  const [currentGyms, setCurrentGyms] = useState(gyms);
  const [blocMode, setBlocMode] = useState(editProject?.colorId ? "color" : "grade");

  // Bloc intérieur en mode couleur
  const colorMode = form.type === "Bloc" && !form.outdoor && blocMode === "color";
  const isBloc    = form.type === "Bloc";
  const grades    = isBloc ? GRADES_BLOC : GRADES_FRENCH;

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === "type") {
        // Reset cotation si changement bloc/voie
        const wasBloc = f.type === "Bloc";
        const nowBloc = value === "Bloc";
        if (wasBloc !== nowBloc) next.grade = nowBloc ? "6A" : "6a";
        if (!nowBloc || next.outdoor) {
          next.colorId = null; next.colorHex = null; next.colorName = null; next.gymId = null;
        }
        // Types toujours extérieurs
        if (["Trad", "Grande voie", "Deep water solo"].includes(value)) next.outdoor = true;
        if (["Bloc", "Diff"].includes(value)) next.outdoor = false;
      }
      if (field === "outdoor" && value === true) {
        next.colorId = null; next.colorHex = null; next.colorName = null;
      }
      return next;
    });
    setError("");
  }

  function handleGymChange(gymId) {
    setForm(f => ({
      ...f,
      gymId,
      colorId: null, colorHex: null, colorName: null, gradeHint: null,
      location: currentGyms.find(g => g.id === gymId)?.name || f.location,
    }));
  }

  function handleColorSelect(color) {
    setForm(f => ({
      ...f,
      colorId: color.id, colorHex: color.hex,
      colorName: color.name, gradeHint: color.gradeHint || null,
      grade: color.gradeHint || f.grade,
    }));
  }

  async function handleGymCreated(gym) {
    setCurrentGyms(prev => [...prev, gym]);
    handleGymChange(gym.id);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.location.trim()) { setError("Indique la salle ou le site."); return; }
    if (colorMode && !form.colorId) { setError("Sélectionne la couleur du bloc."); return; }
    setSaving(true);
    try {
      if (isEdit) await updateProject(editProject.id, form);
      else        await addProject(userId, form);
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
        <h1>{isEdit ? "Modifier le projet" : "Nouveau projet"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="add-form">

        {/* Type */}
        <div className="field">
          <label>Type de grimpe</label>
          <div className="pill-group">
            {TYPES.map(t => (
              <button key={t} type="button"
                className={`pill ${form.type === t ? "pill-active" : ""}`}
                onClick={() => set("type", t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* Toggle extérieur */}
        <div className="toggle-row">
          <div>
            <span className="toggle-label">En extérieur</span>
            <span className="toggle-sub">{form.outdoor ? "Falaise / montagne" : "Salle d'escalade"}</span>
          </div>
          <button type="button" role="switch" aria-checked={form.outdoor}
            className={`toggle ${form.outdoor ? "toggle-on" : ""}`}
            onClick={() => set("outdoor", !form.outdoor)} />
        </div>

        {/* Mode de cotation pour les blocs intérieurs */}
        {form.type === "Bloc" && !form.outdoor && (
          <div className="field">
            <label>Système de cotation</label>
            <div className="pill-group">
              <button type="button"
                className={`pill ${blocMode === "color" ? "pill-active" : ""}`}
                onClick={() => { setBlocMode("color"); set("grade", "6A"); }}>
                🎨 Couleurs
              </button>
              <button type="button"
                className={`pill ${blocMode === "grade" ? "pill-active" : ""}`}
                onClick={() => { setBlocMode("grade"); set("colorId", null); set("colorHex", null); set("colorName", null); set("gymId", null); }}>
                🔢 Cotation officielle
              </button>
            </div>
          </div>
        )}

        {/* Cotation — mode couleur ou classique */}
        {colorMode ? (
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
            <div className="field">
              <label>Salle</label>
              <LocationInput
                value={form.location}
                onChange={v => set("location", v)}
                locations={currentGyms.map(g => ({ id: g.id, name: g.name, is_outdoor: false, logoUrl: g.logoUrl }))}
                placeholder="ex. La Verticale"
                userId={userId}
                gyms={currentGyms}
                onGymCreated={handleGymCreated}
                showCreateGym={true}
              />
            </div>
          </>
        ) : (
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
                    .filter(g => (g.types || []).includes(form.type.toLowerCase()))
                    .map(g => ({ id: g.id, name: g.name, is_outdoor: false, logoUrl: g.logoUrl })),
                  ...locations.filter(l => !l.is_outdoor && !currentGyms.find(g => g.name === l.name)),
                ]}
                placeholder={form.outdoor ? "ex. Gorges du Verdon" : "ex. Arkose Nation"}
                userId={userId}
                gyms={currentGyms}
                onGymCreated={handleGymCreated}
                showCreateGym={!form.outdoor}
                isOutdoor={form.outdoor}
              />
            </div>
          </>
        )}

        {/* Secteur — uniquement en extérieur */}
        {form.outdoor && (
          <div className="field">
            <label>Secteur <span className="optional">(optionnel)</span></label>
            <SectorInput
              value={form.sector || ""}
              onChange={v => set("sector", v)}
              sectors={sectors.filter(s => s.spot_name === form.location)}
              placeholder="ex. Escalès"
            />
          </div>
        )}

        {/* Nom de la voie */}
        <div className="field">
          <label>Nom de la voie <span className="optional">(optionnel)</span></label>
          <input type="text" placeholder="ex. La Directe"
            value={form.routeName} onChange={e => set("routeName", e.target.value)} />
        </div>

        {/* Date objectif */}
        <div className="field">
          <label>Date objectif <span className="optional">(optionnel)</span></label>
          <input type="date" value={form.objectiveDate || ""}
            min={today}
            onChange={e => set("objectiveDate", e.target.value)} />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer le projet"}
        </button>
      </form>
    </div>
  );
}