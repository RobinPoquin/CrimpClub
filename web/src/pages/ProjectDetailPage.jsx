import { useState } from "react";
import { addAttempt, deleteAttempt, updateProjectStatus, deleteProject } from "../lib/projects";
import { addAscent } from "../lib/db";
import MediaUploader from "../components/MediaUploader";

const today = new Date().toISOString().split("T")[0];

export default function ProjectDetailPage({ project, userId, gyms, onChanged, onBack, onEdit }) {
  const [showAddAttempt, setShowAddAttempt] = useState(false);
  const [attemptForm, setAttemptForm]       = useState({ date: today, comment: "", mediaList: [] });
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");
  const [confirmAction, setConfirmAction]   = useState(null); // "reussi" | "abandonne" | "delete"

  const hasColor = project.colorHex && !project.outdoor;

  // Ajoute une tentative au projet
  async function handleAddAttempt(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await addAttempt(userId, project.id, attemptForm);
      setAttemptForm({ date: today, comment: "", mediaList: [] });
      setShowAddAttempt(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Marque le projet comme réussi et crée une ascension dans le logbook
  async function handleSuccess() {
    setSaving(true);
    try {
      // Crée l'ascension correspondante dans le logbook
      const ascent = await addAscent(userId, {
        routeName:  project.routeName,
        grade:      project.grade,
        type:       project.type,
        outdoor:    project.outdoor,
        location:   project.location,
        sector:     project.sector,
        colorId:    project.colorId,
        colorHex:   project.colorHex,
        colorName:  project.colorName,
        gradeHint:  project.gradeHint,
        gymId:      project.gymId,
        date:       today,
        result:     "Flash",
        comment:    "",
        mediaList:  [],
        tags:       [],
        ropeStyle:  null,
      });
      // Met à jour le statut du projet avec la référence à l'ascension
      await updateProjectStatus(project.id, "reussi", ascent.id);
      setConfirmAction(null);
      onChanged();
      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Abandonne le projet
  async function handleAbandon() {
    setSaving(true);
    try {
      await updateProjectStatus(project.id, "abandonne");
      setConfirmAction(null);
      onChanged();
      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Supprime le projet
  async function handleDelete() {
    setSaving(true);
    try {
      await deleteProject(project.id);
      setConfirmAction(null);
      onChanged();
      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-text" onClick={onBack}>← Projets</button>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Bouton modifier */}
          {project.status === "en_cours" && (
            <button className="btn-text" onClick={onEdit}>✏️</button>
          )}
          {/* Menu actions */}
          <button className="card-menu-btn" onClick={() => setConfirmAction("menu")}>⋯</button>
        </div>
      </div>

      {/* Infos du projet */}
      <div style={{ padding: "0 20px 20px" }}>
        {/* Cotation ou couleur */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          {hasColor ? (
            <>
              <span className="card-color-dot" style={{ background: project.colorHex, width: 32, height: 32 }} />
              <div>
                <p style={{ fontSize: 22, fontWeight: 900 }}>{project.colorName}</p>
                {project.gradeHint && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>~{project.gradeHint}</p>}
              </div>
            </>
          ) : (
            <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: -2 }}>{project.grade || "?"}</span>
          )}
          {project.routeName && (
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>{project.routeName}</span>
          )}
        </div>

        {/* Meta */}
        <div className="card-meta" style={{ marginBottom: 12 }}>
          <span>📍 {project.location}</span>
          {project.sector && <span>📌 {project.sector}</span>}
          <span>{project.type}</span>
          {project.outdoor && <span>🌿 Extérieur</span>}
        </div>

        {/* Date objectif */}
        {project.objectiveDate && project.status === "en_cours" && (() => {
          const days = Math.ceil((new Date(project.objectiveDate) - new Date()) / (1000 * 60 * 60 * 24));
          return (
            <p style={{ fontSize: 13, color: days < 7 ? "var(--danger)" : "var(--text-muted)", marginBottom: 12 }}>
              🎯 Objectif : {new Date(project.objectiveDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              {" "}({days > 0 ? `dans ${days} jour${days > 1 ? "s" : ""}` : "dépassé"})
            </p>
          );
        })()}

        {/* Actions si en cours */}
        {project.status === "en_cours" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button className="btn-primary" style={{ flex: 1 }}
              onClick={() => setShowAddAttempt(true)}>
              + Ajouter une tentative
            </button>
            <button className="btn-primary" style={{ flex: 1, background: "var(--accent)" }}
              onClick={() => setConfirmAction("reussi")}>
              ✓ Réussi !
            </button>
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}
      </div>

      {/* Formulaire ajout tentative */}
      {showAddAttempt && (
        <form onSubmit={handleAddAttempt} className="add-form" style={{ paddingTop: 0 }}>
          <div style={{ padding: "0 20px", marginBottom: -8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Nouvelle tentative</h3>
          </div>

          <div className="field">
            <label>Date</label>
            <input type="date" value={attemptForm.date} max={today}
              onChange={e => setAttemptForm(f => ({ ...f, date: e.target.value }))} required />
          </div>

          <div className="field">
            <label>Commentaire <span className="optional">(optionnel)</span></label>
            <textarea rows={3} placeholder="Observations, passages clés, beta…"
              value={attemptForm.comment}
              onChange={e => setAttemptForm(f => ({ ...f, comment: e.target.value }))} />
          </div>

          <div className="field">
            <label>Photo / vidéo <span className="optional">(optionnel)</span></label>
            <MediaUploader
              userId={userId}
              mediaList={attemptForm.mediaList}
              onChange={list => setAttemptForm(f => ({ ...f, mediaList: list }))}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="sheet-cancel" onClick={() => setShowAddAttempt(false)}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Enregistrement…" : "Ajouter"}
            </button>
          </div>
        </form>
      )}

      {/* Liste des tentatives */}
      <div style={{ padding: "0 16px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: .5, fontSize: 13 }}>
          {project.attempts.length} tentative{project.attempts.length !== 1 ? "s" : ""}
        </h3>

        {project.attempts.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
            Aucune tentative enregistrée.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {project.attempts.map((attempt, idx) => (
              <div key={attempt.id} className="ascent-card">
                <div className="card-accent-bar" style={{ background: "var(--warn)" }} />
                <div className="card-body">
                  <div className="card-top">
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                      Tentative {project.attempts.length - idx}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(attempt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {/* Bouton suppression tentative */}
                      <button
                        className="card-menu-btn"
                        onClick={async () => {
                          await deleteAttempt(attempt.id);
                          onChanged();
                        }}
                        aria-label="Supprimer"
                        style={{ fontSize: 14, color: "var(--danger)" }}
                      >✕</button>
                    </div>
                  </div>
                  {attempt.comment && <p className="card-comment">"{attempt.comment}"</p>}

                  {/* Médias de la tentative */}
                  {[...attempt.photoUrls, ...attempt.videoUrls].length > 0 && (
                    <div className="card-media-grid" style={{ marginTop: 8 }}>
                      {[...attempt.photoUrls, ...attempt.videoUrls].map((m, i) => (
                        m.type === "photo"
                          ? <img key={i} src={m.url} alt="" className="card-media-thumb" />
                          : <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                              className="card-media-thumb card-media-video-link">🎥</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom sheet actions */}
      {confirmAction === "menu" && (
        <>
          <div className="sheet-backdrop" onClick={() => setConfirmAction(null)} />
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            {project.status === "en_cours" && (
              <>
                <button className="sheet-action" onClick={() => { setConfirmAction(null); onEdit(); }}>
                  <span className="sheet-action-icon">✏️</span><span>Modifier le projet</span>
                </button>
                <button className="sheet-action" onClick={() => setConfirmAction("abandonne")}>
                  <span className="sheet-action-icon">🚫</span><span>Abandonner</span>
                </button>
              </>
            )}
            <button className="sheet-action sheet-action-danger" onClick={() => setConfirmAction("delete")}>
              <span className="sheet-action-icon">🗑️</span><span>Supprimer le projet</span>
            </button>
            <button className="sheet-cancel" onClick={() => setConfirmAction(null)}>Annuler</button>
          </div>
        </>
      )}

      {/* Confirmation réussi */}
      {confirmAction === "reussi" && (
        <>
          <div className="sheet-backdrop" onClick={() => setConfirmAction(null)} />
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🎉 Projet réussi !</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              Une ascension sera automatiquement ajoutée à ton logbook.
            </p>
            <button className="btn-primary" onClick={handleSuccess} disabled={saving} style={{ marginBottom: 10 }}>
              {saving ? "Enregistrement…" : "Confirmer la réussite"}
            </button>
            <button className="sheet-cancel" onClick={() => setConfirmAction(null)}>Annuler</button>
          </div>
        </>
      )}

      {/* Confirmation abandon */}
      {confirmAction === "abandonne" && (
        <>
          <div className="sheet-backdrop" onClick={() => setConfirmAction(null)} />
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Abandonner ce projet ?</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              Le projet passera en statut "Abandonné". Tes tentatives seront conservées.
            </p>
            <button className="btn-primary" onClick={handleAbandon} disabled={saving}
              style={{ background: "var(--text-muted)", marginBottom: 10 }}>
              {saving ? "…" : "Abandonner"}
            </button>
            <button className="sheet-cancel" onClick={() => setConfirmAction(null)}>Annuler</button>
          </div>
        </>
      )}

      {/* Confirmation suppression */}
      {confirmAction === "delete" && (
        <>
          <div className="sheet-backdrop" onClick={() => setConfirmAction(null)} />
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Supprimer ce projet ?</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              Le projet et toutes ses tentatives seront définitivement supprimés.
            </p>
            <button className="btn-primary" onClick={handleDelete} disabled={saving}
              style={{ background: "var(--danger)", marginBottom: 10 }}>
              {saving ? "…" : "Supprimer"}
            </button>
            <button className="sheet-cancel" onClick={() => setConfirmAction(null)}>Annuler</button>
          </div>
        </>
      )}
    </div>
  );
}