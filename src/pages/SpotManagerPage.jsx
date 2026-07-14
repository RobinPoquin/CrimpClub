import { useState } from "react";
import { getLocations, saveLocation, deleteLocationByName } from "../lib/locations";

export default function SpotManagerPage({ userId, spots = [], onSpotsChanged, onBack }) {
  const [editingSpot, setEditingSpot] = useState(null); // null = liste, object = édition
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Liste des spots ───────────────────────────
  if (!editingSpot) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-text" onClick={onBack}>← Retour</button>
          <h1>Mes spots extérieurs</h1>
        </div>

        <div className="gym-list">
          {spots.length === 0 && (
            <div className="empty-state" style={{ padding: "40px 24px" }}>
              <p className="empty-icon">🌿</p>
              <p className="empty-title">Aucun spot configuré.</p>
              <p className="empty-sub">Tes spots s'ajoutent automatiquement quand tu crées une ascension extérieure, ou ajoute-en un manuellement.</p>
            </div>
          )}

          {spots.map(s => (
            <div key={s.id} className="gym-row">
              <div className="gym-row-info">
                <span className="gym-row-name">{s.name}</span>
                <div className="gym-row-swatches">
                  {(s.types || ['bloc', 'diff']).map(t => (
                    <span key={t} className="chip chip-type" style={{ fontSize: 11, padding: "2px 8px" }}>
                      {t === 'bloc' ? '🧱 Bloc' : '🧗 Diff'}
                    </span>
                  ))}
                </div>
              </div>
              <div className="gym-row-actions">
                <button className="btn-sm" onClick={() => setEditingSpot({ ...s, types: s.types || ['bloc', 'diff'] })}>✏️</button>
                <button className="btn-sm btn-sm-danger" onClick={() => setConfirmDelete(s)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px" }}>
          <button className="btn-primary"
            onClick={() => setEditingSpot({ id: null, name: "", types: ['bloc', 'diff'], is_outdoor: true })}>
            + Ajouter un spot
          </button>
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <>
            <div className="sheet-backdrop" onClick={() => setConfirmDelete(null)} />
            <div className="bottom-sheet">
              <div className="sheet-handle" />
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Supprimer ce spot ?</p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                Les ascensions liées ne seront pas supprimées.
              </p>
              <button className="btn-primary" style={{ background: "var(--danger)", marginBottom: 10 }}
                onClick={async () => {
                  await deleteLocationByName(userId, confirmDelete.name);
                  await onSpotsChanged();
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

  // ── Éditeur de spot ───────────────────────────
  const isNew = !editingSpot.id;

  function toggleType(t) {
    const types = editingSpot.types || ['bloc', 'diff'];
    const next  = types.includes(t) ? types.filter(x => x !== t) : [...types, t];
    if (next.length === 0) return;
    setEditingSpot(s => ({ ...s, types: next }));
  }

  async function handleSave() {
    if (!editingSpot.name.trim()) { setError("Donne un nom au spot."); return; }
    setSaving(true);
    try {
      if (!isNew) {
        // Supprime l'ancien puis recrée avec le nouveau nom/types
        await deleteLocationByName(userId, spots.find(s => s.id === editingSpot.id)?.name);
      }
      await saveLocation(userId, editingSpot.name, true, editingSpot.types);
      await onSpotsChanged();
      setEditingSpot(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-text" onClick={() => { setEditingSpot(null); setError(""); }}>← Spots</button>
        <h1>{isNew ? "Nouveau spot" : "Modifier"}</h1>
      </div>

      <div className="add-form">
        <div className="field">
          <label>Nom du spot</label>
          <input type="text" placeholder="ex. Gorges du Verdon"
            value={editingSpot.name}
            onChange={e => { setEditingSpot(s => ({ ...s, name: e.target.value })); setError(""); }} />
        </div>

        <div className="field">
          <label>Type de grimpe</label>
          <div className="pill-group">
            <button type="button"
              className={`pill ${(editingSpot.types || []).includes('bloc') ? "pill-active" : ""}`}
              onClick={() => toggleType('bloc')}>🧱 Bloc</button>
            <button type="button"
              className={`pill ${(editingSpot.types || []).includes('diff') ? "pill-active" : ""}`}
              onClick={() => toggleType('diff')}>🧗 Diff</button>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement…" : isNew ? "Créer le spot" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}