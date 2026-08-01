import { useState } from "react";
import { addGym, updateGym, deleteGym } from "../lib/gyms";
import { deleteLocationByName } from "../lib/locations";
import AvatarUploader from "../components/AvatarUploader";

const DEFAULT_COLORS = [
  { id: "c1", name: "Jaune",  hex: "#FACC15", gradeHint: "" },
  { id: "c2", name: "Vert",   hex: "#22C55E", gradeHint: "" },
  { id: "c3", name: "Bleu",   hex: "#3B82F6", gradeHint: "" },
  { id: "c4", name: "Rouge",  hex: "#EF4444", gradeHint: "" },
  { id: "c5", name: "Noir",   hex: "#18181B", gradeHint: "" },
];

function newColor() {
  return { id: `c_${Date.now()}`, name: "", hex: "#888888", gradeHint: "" };
}

export default function GymManagerPage({ userId, gyms, onGymsChanged, onBack }) {
  const [editingGym, setEditingGym] = useState(null); // null = liste, object = édition
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Liste des salles ──────────────────────────
  if (!editingGym) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-text" onClick={onBack}>← Retour</button>
          <h1>Mes salles</h1>
        </div>

        <div className="gym-list">
          {gyms.length === 0 && (
            <div className="empty-state" style={{ padding: "40px 24px" }}>
              <p className="empty-icon">🏟️</p>
              <p className="empty-title">Aucune salle configurée.</p>
              <p className="empty-sub">Ajoute ta salle pour définir ses couleurs de blocs.</p>
            </div>
          )}

          {gyms.map(g => (
            <div key={g.id} className="gym-row">
              <div className="gym-row-info">
                <span className="gym-row-name">{g.name}</span>
                <div className="gym-row-swatches">
                  {g.colors.slice(0, 8).map(c => (
                    <span key={c.id} className="mini-swatch" style={{ background: c.hex }} title={c.name} />
                  ))}
                  {g.colors.length > 8 && <span className="mini-more">+{g.colors.length - 8}</span>}
                </div>
              </div>
              <div className="gym-row-actions">
                <button className="btn-sm" onClick={() => setEditingGym({ ...g, colors: g.colors.map(c => ({...c})), types: g.types || ['bloc', 'diff'] })}>✏️</button>
                <button className="btn-sm btn-sm-danger" onClick={() => setConfirmDelete(g.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px" }}>
          <button
            className="btn-primary"
            onClick={() => setEditingGym({ id: null, name: "", colors: DEFAULT_COLORS.map(c => ({...c})), types: ['bloc', 'diff'] })}
          >
            + Ajouter une salle
          </button>
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <>
            <div className="sheet-backdrop" onClick={() => setConfirmDelete(null)} />
            <div className="bottom-sheet">
              <div className="sheet-handle" />
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Supprimer cette salle ?</p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                Les ascensions liées ne seront pas supprimées, mais perdront leur couleur associée.
              </p>
              <button className="btn-primary" style={{ background: "var(--danger)", marginBottom: 10 }}
                onClick={async () => {
                  const gymToDelete = gyms.find(g => g.id === confirmDelete);
                  await deleteGym(confirmDelete);
                  if (gymToDelete) await deleteLocationByName(userId, gymToDelete.name);
                  await onGymsChanged();
                  setConfirmDelete(null);
                }}>
                Supprimer
              </button>
              <button className="sheet-cancel" onClick={() => setConfirmDelete(null)}>Annuler</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Éditeur de salle ──────────────────────────
  const isNew = !editingGym.id;

  function setName(v) { setEditingGym(g => ({ ...g, name: v })); setError(""); }

  function setColor(idx, field, value) {
    setEditingGym(g => {
      const colors = [...g.colors];
      colors[idx] = { ...colors[idx], [field]: value };
      return { ...g, colors };
    });
  }

  function addColor() {
    setEditingGym(g => ({ ...g, colors: [...g.colors, newColor()] }));
  }

  function removeColor(idx) {
    setEditingGym(g => ({ ...g, colors: g.colors.filter((_, i) => i !== idx) }));
  }

  function moveColor(idx, dir) {
    setEditingGym(g => {
      const colors = [...g.colors];
      const target = idx + dir;
      if (target < 0 || target >= colors.length) return g;
      [colors[idx], colors[target]] = [colors[target], colors[idx]];
      return { ...g, colors };
    });
  }

  async function handleSave() {
    if (!editingGym.name.trim()) { setError("Donne un nom à la salle."); return; }
    if ((editingGym.types || []).includes('bloc') && editingGym.colors.some(c => !c.name.trim())) {
      setError("Tous les niveaux doivent avoir un nom.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await addGym(userId, { name: editingGym.name, colors: editingGym.colors, types: editingGym.types, logo_url: editingGym.logoUrl });
      } else {
        await updateGym(editingGym.id, { name: editingGym.name, colors: editingGym.colors, types: editingGym.types, logo_url: editingGym.logoUrl });
      }
      await onGymsChanged();
      setEditingGym(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-text" onClick={() => setEditingGym(null)}>← Salles</button>
        <h1>{isNew ? "Nouvelle salle" : "Modifier"}</h1>
      </div>

      <div className="add-form">
        <div className="field">
          <label>Nom de la salle</label>
          <input type="text" placeholder="ex. Arkose Nation" value={editingGym.name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="field">
          <label>Logo <span className="optional">(optionnel)</span></label>
          <AvatarUploader
            userId={userId}
            currentUrl={editingGym.logoUrl}
            folder="logos"
            size={56}
            placeholder="🏟️"
            onUploaded={url => setEditingGym(g => ({ ...g, logoUrl: url }))}
          />
        </div>

        <div className="field">
          <label>Type de salle</label>
          <div className="pill-group">
            {['bloc', 'diff'].map(t => (
              <button key={t} type="button"
                className={`pill ${(editingGym.types || []).includes(t) ? "pill-active" : ""}`}
                onClick={() => {
                  const types = editingGym.types || ['bloc', 'diff'];
                  const next = types.includes(t) ? types.filter(x => x !== t) : [...types, t];
                  if (next.length === 0) return;
                  setEditingGym(g => ({ ...g, types: next }));
                }}>
                {t === 'bloc' ? '🧱 Bloc' : '🧗 Diff'}
              </button>
            ))}
          </div>
        </div>

        {/* Couleurs seulement si la salle fait du bloc */}
        {(editingGym.types || []).includes('bloc') && (
          <>
            <div className="field">
              <label>Niveaux de couleurs <span className="optional">(du + facile au + difficile)</span></label>
              <p className="field-hint">Fais glisser ↕ pour réordonner. Chaque couleur peut avoir une cotation indicative.</p>
            </div>

            <div className="color-editor-list">
              {editingGym.colors.map((c, idx) => (
                <div key={c.id} className="color-editor-row">

                  {/* Ligne 1 : numéro + pastille + nom + supprimer */}
                  <div className="color-row-top">
                    <span className="color-order">{idx + 1}</span>
                    <div className="color-swatch-input-wrap">
                      <input type="color" value={c.hex}
                        onChange={e => setColor(idx, "hex", e.target.value)}
                        className="color-input-native" title="Choisir la couleur" />
                      <span className="color-preview" style={{ background: c.hex }} />
                    </div>
                    <input type="text" placeholder="Nom (ex: Jaune)" value={c.name}
                      onChange={e => setColor(idx, "name", e.target.value)}
                      className="color-name-input" />
                    <button type="button" onClick={() => removeColor(idx)}
                      className="remove-color-btn" aria-label="Supprimer">✕</button>
                  </div>

                  {/* Ligne 2 : cotation indicative + boutons ordre */}
                  <div className="color-row-bottom">
                    <input type="text" placeholder="Cotation indicative (ex: 6A, optionnel)"
                      value={c.gradeHint}
                      onChange={e => setColor(idx, "gradeHint", e.target.value)}
                      className="color-hint-input-full"
                      title="Cotation indicative (optionnel)" />
                    <div className="color-order-btns">
                      <button type="button" onClick={() => moveColor(idx, -1)}
                        disabled={idx === 0} className="order-btn">↑</button>
                      <button type="button" onClick={() => moveColor(idx, 1)}
                      disabled={idx === editingGym.colors.length - 1} className="order-btn">↓</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn-outline-accent" onClick={addColor}>
            + Ajouter un niveau de couleur
          </button>
        </>
      )}

        {error && <p className="error-msg">{error}</p>}

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement…" : isNew ? "Créer la salle" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
