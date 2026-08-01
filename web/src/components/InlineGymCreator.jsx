import { useState } from "react";
import { addGym } from "../lib/gyms";
import { saveLocation } from "../lib/locations";

const DEFAULT_COLORS = [
  { id: "c1", name: "Jaune",  hex: "#FACC15", gradeHint: "" },
  { id: "c2", name: "Vert",   hex: "#22C55E", gradeHint: "" },
  { id: "c3", name: "Bleu",   hex: "#3B82F6", gradeHint: "" },
  { id: "c4", name: "Rouge",  hex: "#EF4444", gradeHint: "" },
  { id: "c5", name: "Noir",   hex: "#18181B", gradeHint: "" },
  { id: "c6", name: "Violet", hex: "#9833AB", gradeHint: "" },
];

function newColor() {
  return { id: `c_${Date.now()}`, name: "", hex: "#888888", gradeHint: "" };
}

export default function InlineGymCreator({ userId, onCreated, onCancel, isOutdoor = false }) {
  const [name, setName]     = useState("");
  const [types, setTypes]   = useState(['bloc', 'diff']);
  const [colors, setColors] = useState(DEFAULT_COLORS.map(c => ({...c})));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  function toggleType(t) {
    const next = types.includes(t) ? types.filter(x => x !== t) : [...types, t];
    if (next.length === 0) return; // Au moins un type requis
    setTypes(next);
  }

  function setColor(idx, field, value) {
    setColors(cs => {
      const next = [...cs];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function addColor() {
    setColors(cs => [...cs, newColor()]);
  }

  function removeColor(idx) {
    setColors(cs => cs.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!name.trim()) { setError(`Donne un nom ${isOutdoor ? "au spot" : "à la salle"}.`); return; }
    setSaving(true);
    try {
      if (isOutdoor) {
        // Crée un spot extérieur
        await saveLocation(userId, name, true, types);
        onCreated({ name, types, is_outdoor: true });
      } else {
        const gym = await addGym(userId, {
          name,
          types,
          colors: types.includes('bloc') ? colors : [],
        });
        onCreated(gym);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inline-gym-creator">
      <div className="inline-gym-header">
        <span className="inline-gym-title">{isOutdoor ? "Nouveau spot" : "Nouvelle salle"}</span>
        <button type="button" className="inline-gym-close" onClick={onCancel}>✕</button>
      </div>

      {/* Nom */}
      <div className="field">
        <label>Nom de la salle</label>
        <input type="text" placeholder="ex. Arkose La Rochelle"
          value={name} onChange={e => { setName(e.target.value); setError(""); }} />
      </div>

      {/* Type */}
      <div className="field">
        <label>Type de salle</label>
        <div className="pill-group">
          <button type="button" className={`pill ${types.includes('bloc') ? "pill-active" : ""}`}
            onClick={() => toggleType('bloc')}>🧱 Bloc</button>
          <button type="button" className={`pill ${types.includes('diff') ? "pill-active" : ""}`}
            onClick={() => toggleType('diff')}>🧗 Diff</button>
        </div>
      </div>

      {/* Couleurs — seulement si bloc */}
      {!isOutdoor && types.includes('bloc') && (
        <div className="field">
          <label>Niveaux de couleurs <span className="optional">(du + facile au + difficile)</span></label>
          <div className="color-editor-list">
            {colors.map((c, idx) => (
              <div key={c.id} className="color-editor-row">
                <div className="color-row-top">
                  <span className="color-order">{idx + 1}</span>
                  <div className="color-swatch-input-wrap">
                    <input type="color" value={c.hex}
                      onChange={e => setColor(idx, "hex", e.target.value)}
                      className="color-input-native" />
                    <span className="color-preview" style={{ background: c.hex }} />
                  </div>
                  <input type="text" placeholder="Nom (ex: Jaune)" value={c.name}
                    onChange={e => setColor(idx, "name", e.target.value)}
                    className="color-name-input" />
                  <button type="button" onClick={() => removeColor(idx)}
                    className="remove-color-btn">✕</button>
                </div>
                <div className="color-row-bottom">
                  <input type="text" placeholder="Cotation indicative (ex: 6A, optionnel)"
                    value={c.gradeHint} onChange={e => setColor(idx, "gradeHint", e.target.value)}
                    className="color-hint-input-full" />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn-outline-accent" style={{ marginTop: 8 }}
            onClick={addColor}>+ Ajouter un niveau</button>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button type="button" className="sheet-cancel" onClick={onCancel}>Annuler</button>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Création…" : "Créer la salle"}
        </button>
      </div>
    </div>
  );
}