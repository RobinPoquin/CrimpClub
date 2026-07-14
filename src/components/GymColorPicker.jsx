import { useEffect } from "react";
import LocationInput from "./LocationInput";

export default function GymColorPicker({ gyms, selectedGymId, selectedColorId, onGymChange, onColorSelect, userId, onGymCreated }) {
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

      {/* Champ salle avec autocomplétion */}
      <div className="field">
        <label>Salle</label>
        {gyms.length === 0 ? (
          <p className="field-hint">⚠️ Aucune salle configurée. Va dans <strong>Profil → Mes salles & couleurs</strong> pour en ajouter une.</p>
        ) : (
          <LocationInput
            value={gym?.name || ""}
            onChange={name => {
              // Cherche la salle par nom dans la liste
              const found = gyms.find(g => g.name === name);
              onGymChange(found ? found.id : null);
            }}
            locations={gyms.map(g => ({ id: g.id, name: g.name, is_outdoor: false }))}
            placeholder="ex. La Verticale"
            userId={userId}
            gyms={gyms}
            onGymCreated={onGymCreated}
            showCreateGym={true}
          />
        )}
      </div>

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
