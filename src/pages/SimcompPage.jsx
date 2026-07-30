import { useState, useEffect } from "react";
import {
  canAccessSimcomp,
  calculateBlocScore,
  calculateTotalScore,
  createEmptyBloc,
  getSimcomps,
  addSimcomp,
  updateSimcomp,
  deleteSimcomp,
} from "../lib/simcomp";
import { uploadMedia } from "../lib/storage";

// Page simulateur de compétition — accès restreint
export default function SimcompPage({ user, onBack }) {
  const [simcomps, setSimcomps]         = useState([]);
  const [view, setView]                 = useState("list"); // "list" | "edit" | "new"
  const [editingSim, setEditingSim]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Vérifie l'accès avant tout
  if (!canAccessSimcomp(user.id)) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-text" onClick={onBack}>← Retour</button>
          <h1>SimComp</h1>
        </div>
        <div className="empty-state">
          <p className="empty-icon">🔒</p>
          <p className="empty-title">Accès restreint</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getSimcomps(user.id);
      setSimcomps(data);
    } finally {
      setLoading(false);
    }
  }

  // ── Nouvelle simulation ───────────────────────
  function handleNew() {
    setEditingSim({
      id:          null,
      name:        "",
      nbBlocs:     5,
      blocs:       Array.from({ length: 5 }, (_, i) => createEmptyBloc(i)),
      totalScore:  0,
    });
    setView("edit");
  }

  // ── Édition d'une simulation existante ────────
  function handleEdit(sim) {
    setEditingSim({
      id:         sim.id,
      name:       sim.name,
      nbBlocs:    sim.nb_blocs,
      blocs:      sim.blocs,
      totalScore: sim.total_score,
    });
    setView("edit");
  }

  // ── Sauvegarde ────────────────────────────────
  async function handleSave() {
    setError("");
    if (!editingSim.name.trim()) { setError("Donne un nom à la simulation."); return; }
    
    // Validation AVANT setSaving pour ne pas bloquer le bouton
    const blocInvalide = editingSim.blocs.find(
      b => b.topEssais !== null && b.zoneEssais === null
    );
    if (blocInvalide) {
      setError(`Bloc ${blocInvalide.id} : tu dois renseigner la zone si tu as fait le top.`);
      return;
    }

    setSaving(true);
    try {
      const totalScore = calculateTotalScore(editingSim.blocs);
      if (editingSim.id) {
        await updateSimcomp(editingSim.id, { ...editingSim, totalScore });
      } else {
        await addSimcomp(user.id, { ...editingSim, totalScore });
      }
      await load();
      setView("list");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Suppression ───────────────────────────────
  async function handleDelete(id) {
    await deleteSimcomp(id);
    await load();
    setConfirmDelete(null);
  }

  // ── Mise à jour d'un bloc ─────────────────────
  function updateBloc(idx, field, value) {
    setEditingSim(s => {
      const blocs = [...s.blocs];
      blocs[idx] = { ...blocs[idx], [field]: value };
      return { ...s, blocs, totalScore: calculateTotalScore(blocs) };
    });
  }

  // ── Changement du nombre de blocs ─────────────
  function handleNbBlocsChange(nb) {
    const current = editingSim.blocs;
    let blocs;
    if (nb > current.length) {
      // Ajoute des blocs vides
      blocs = [
        ...current,
        ...Array.from({ length: nb - current.length }, (_, i) => createEmptyBloc(current.length + i)),
      ];
    } else {
      // Supprime les derniers blocs
      blocs = current.slice(0, nb);
    }
    setEditingSim(s => ({ ...s, nbBlocs: nb, blocs, totalScore: calculateTotalScore(blocs) }));
  }

  // ── Upload photo d'un bloc ────────────────────
  async function handleBlocPhoto(idx, file) {
    if (!file) return;
    try {
      const result = await uploadMedia(user.id, file);
      updateBloc(idx, "photoUrl",  result.url);
      updateBloc(idx, "photoPath", result.path);
    } catch (err) {
      setError(err.message);
    }
  }

  // ── Vue liste ─────────────────────────────────
  if (view === "list") {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn-text" onClick={onBack}>← Retour</button>
          <h1>🏆 SimComp</h1>
        </div>

        <div style={{ padding: "0 16px 16px" }}>
          <button className="btn-primary" onClick={handleNew}>
            + Nouvelle simulation
          </button>
        </div>

        {loading ? (
          <p className="loading">Chargement…</p>
        ) : simcomps.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">🏆</p>
            <p className="empty-title">Aucune simulation.</p>
            <p className="empty-sub">Crée ta première simulation de compétition.</p>
          </div>
        ) : (
          <div className="ascents-list">
            {simcomps.map(sim => (
              <div key={sim.id} className="ascent-card" style={{ cursor: "pointer" }}
                onClick={() => handleEdit(sim)}>
                <div className="card-accent-bar" style={{ background: "var(--warn)" }} />
                <div className="card-body">
                  <div className="card-top">
                    <span className="card-grade" style={{ fontSize: 18 }}>{sim.name}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {/* Score total */}
                      <span className="card-result result-flash">
                        {sim.total_score} pts
                      </span>
                      {/* Suppression */}
                      <button className="card-menu-btn"
                        onClick={e => { e.stopPropagation(); setConfirmDelete(sim.id); }}
                        aria-label="Supprimer">🗑️</button>
                    </div>
                  </div>
                  <div className="card-meta">
                    <span>🧱 {sim.nb_blocs} blocs</span>
                    <span>🗓 {new Date(sim.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirm delete */}
        {confirmDelete && (
          <>
            <div className="sheet-backdrop" onClick={() => setConfirmDelete(null)} />
            <div className="bottom-sheet">
              <div className="sheet-handle" />
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Supprimer cette simulation ?</p>
              <button className="btn-primary" style={{ background: "var(--danger)", marginBottom: 10 }}
                onClick={() => handleDelete(confirmDelete)}>
                Supprimer
              </button>
              <button className="sheet-cancel" onClick={() => setConfirmDelete(null)}>Annuler</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Vue édition ───────────────────────────────
  const totalScore = calculateTotalScore(editingSim.blocs);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-text" onClick={() => setView("list")}>← Simulations</button>
        <h1>{editingSim.id ? "Modifier" : "Nouvelle simulation"}</h1>
      </div>

      <div className="add-form">

        {/* Nom */}
        <div className="field">
          <label>Nom de la simulation</label>
          <input type="text" placeholder="ex. Coupe de France 2026"
            value={editingSim.name}
            onChange={e => setEditingSim(s => ({ ...s, name: e.target.value }))} />
        </div>

        {/* Nombre de blocs */}
        <div className="field">
          <label>Nombre de blocs</label>
          <div className="pill-group">
            {[4, 5, 6, 8].map(n => (
              <button key={n} type="button"
                className={`pill ${editingSim.nbBlocs === n ? "pill-active" : ""}`}
                onClick={() => handleNbBlocsChange(n)}>
                {n} blocs
              </button>
            ))}
          </div>
        </div>

        {/* Score total en temps réel */}
        <div className="simcomp-score-total">
          <span className="simcomp-score-label">Score total</span>
          <span className="simcomp-score-value">{totalScore} pts</span>
        </div>

        {/* Blocs */}
        {editingSim.blocs.map((bloc, idx) => {
          const blocScore = calculateBlocScore(bloc);
          return (
            <div key={bloc.id} className="simcomp-bloc">
              <div className="simcomp-bloc-header">
                <span className="simcomp-bloc-title">Bloc {idx + 1}</span>
                <span className="simcomp-bloc-score">{blocScore > 0 ? `${blocScore} pts` : "0 pt"}</span>
              </div>

              {/* Photo du bloc */}
              <div className="simcomp-bloc-photo">
                {bloc.photoUrl ? (
                  <div style={{ position: "relative" }}>
                    <img src={bloc.photoUrl} alt={`Bloc ${idx + 1}`}
                      className="simcomp-photo-preview"
                      onClick={() => window.open(bloc.photoUrl, "_blank")} />
                    <button className="media-remove-btn"
                      onClick={() => { updateBloc(idx, "photoUrl", null); updateBloc(idx, "photoPath", null); }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="simcomp-photo-btn">
                    📷 Ajouter une photo
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => handleBlocPhoto(idx, e.target.files[0])} />
                  </label>
                )}
              </div>

              <div className="simcomp-bloc-inputs">
                {/* Zone */}
                <div className="field">
                  <label>Zone — essais</label>
                  <div className="pill-group">
                    {/* Bouton "Non atteint" */}
                    <button type="button"
                      className={`pill ${bloc.zoneEssais === null ? "pill-active" : ""}`}
                      style={bloc.zoneEssais === null ? { background: "var(--text-muted)", borderColor: "var(--text-muted)" } : {}}
                      onClick={() => updateBloc(idx, "zoneEssais", null)}>
                      ✗
                    </button>
                    {/* 1 à 10 essais */}
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button key={n} type="button"
                        className={`pill ${bloc.zoneEssais === n ? "pill-active" : ""}`}
                        onClick={() => updateBloc(idx, "zoneEssais", n)}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top */}
                <div className="field">
                  <label>Top — essais</label>
                  <div className="pill-group">
                    {/* Bouton "Non atteint" */}
                    <button type="button"
                      className={`pill ${bloc.topEssais === null ? "pill-active" : ""}`}
                      style={bloc.topEssais === null ? { background: "var(--text-muted)", borderColor: "var(--text-muted)" } : {}}
                      onClick={() => updateBloc(idx, "topEssais", null)}>
                      ✗
                    </button>
                    {/* 1 à 10 essais */}
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button key={n} type="button"
                        className={`pill ${bloc.topEssais === n ? "pill-active" : ""}`}
                        onClick={() => updateBloc(idx, "topEssais", n)}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {error && <p className="error-msg">{error}</p>}

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement…" : editingSim.id ? "Enregistrer" : "Créer la simulation"}
        </button>
      </div>
    </div>
  );
}