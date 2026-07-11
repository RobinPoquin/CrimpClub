import { useEffect } from "react";

export default function GymColorPicker({ gyms, selectedGymId, selectedColorId, onGymChange, onColorSelect }) {
  // Auto-sélectionne si une seule salle
  useEffect(() => {
    if (!selectedGymId && gyms.length === 1) {
      onGymChange(gyms[0].id);
    }
  }, [gyms]);

  const gym    = gyms.find(g => g.id === selectedGymId);
  const colors = gym?.colors || [];

  return (
    <div className="gym-color-picker">

      {/* Select salle — masqué si une seule salle */}
      {gyms.length !== 1 && (
        <div className="field">
          <label>Salle</label>
          {gyms.length === 0 ? (
            <p className="field-hint">⚠️ Aucune salle configurée. Va dans <strong>Profil → Mes salles & couleurs</strong> pour en ajouter une.</p>
          ) : (
            <select value={selectedGymId || ""} onChange={e => onGymChange(e.target.value || null)}>
              <option value="">— Choisir une salle —</option>
              {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Nom de la salle quand auto-sélectionnée */}
      {gyms.length === 1 && gym && (
        <div className="field">
          <label>Salle</label>
          <div className="gym-single-name">
            🏟️ {gym.name}
            <button type="button" className="link-btn" style={{ fontSize: 12, marginLeft: 8 }}
              onClick={() => onGymChange(null)}>changer</button>
          </div>
        </div>
      )}

      {/* Pastilles de couleur */}
      {gym && colors.length > 0 && (
        <div className="field">
          <label>Couleur du bloc</label>
          <div className="color-swatches">
            {colors.map(c => (
              <button
                key={c.id}
                type="button"
                className={`color-swatch ${selectedColorId === c.id ? "swatch-active" : ""}`}
                onClick={() => onColorSelect(c)}
                title={c.gradeHint ? `${c.name} (~${c.gradeHint})` : c.name}
                aria-label={c.name}
                style={{ background: c.hex }}
              >
                {selectedColorId === c.id && <span className="swatch-check">✓</span>}
              </button>
            ))}
          </div>

          {/* Label couleur sélectionnée */}
          {selectedColorId && (() => {
            const sel = colors.find(c => c.id === selectedColorId);
            return sel ? (
              <p className="color-label">
                <span className="color-dot" style={{ background: sel.hex }} />
                <strong>{sel.name}</strong>
                {sel.gradeHint && <span className="color-grade-hint"> · ~{sel.gradeHint}</span>}
              </p>
            ) : null;
          })()}
        </div>
      )}

      {gym && colors.length === 0 && (
        <p className="field-hint">⚠️ Cette salle n'a pas de couleurs configurées. Va dans <strong>Profil → Mes salles & couleurs</strong>.</p>
      )}
    </div>
  );
}
