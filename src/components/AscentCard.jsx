import { useState } from "react";

const RESULT_MAP = {
  "À vue":     { bar: "bar-vue",    badge: "result-vue",    label: "À vue" },
  "Flash":     { bar: "bar-flash",  badge: "result-flash",  label: "Flash" },
  "Travaillé": { bar: "bar-worked", badge: "result-worked", label: "Travaillé" },
  "Projet":    { bar: "bar-projet", badge: "result-projet", label: "Projet" },
};

export default function AscentCard({ ascent, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { grade, type, date, outdoor, routeName, location, result, comment, colorHex, colorName, gradeHint } = ascent;
  const res = RESULT_MAP[result] || { bar: "bar-worked", badge: "result-worked", label: result };

  const hasColor = !outdoor && type === "Bloc" && colorHex;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : "";

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setMenuOpen(false); setConfirmDelete(false);
    onDelete(ascent.id);
  }

  return (
    <>
      <article className="ascent-card">
        {/* Barre latérale : couleur du bloc OU couleur du résultat */}
        <div
          className={`card-accent-bar ${hasColor ? "" : res.bar}`}
          style={hasColor ? { background: colorHex } : {}}
        />

        <div className="card-body">
          <div className="card-top">
            <div className="card-grade-block">
              {hasColor ? (
                /* Pastille couleur + nom */
                <div className="card-color-grade">
                  <span className="card-color-dot" style={{ background: colorHex }} />
                  <span className="card-grade card-grade-color">{colorName}</span>
                  {gradeHint && <span className="card-grade-hint">~{gradeHint}</span>}
                </div>
              ) : (
                <span className="card-grade">{grade}</span>
              )}
              {routeName && <span className="card-name">{routeName}</span>}
            </div>
            <div className="card-top-right">
              <span className={`card-result ${res.badge}`}>{res.label}</span>
              <button className="card-menu-btn" onClick={() => { setMenuOpen(true); setConfirmDelete(false); }} aria-label="Options">⋯</button>
            </div>
          </div>

          <div className="card-chips">
            <span className="chip-type">{type}</span>
            {outdoor && <span className="chip-outdoor">🌿 Extérieur</span>}
          </div>

          <div className="card-meta">
            {location && <span>📍 {location}</span>}
            {formattedDate && <span>🗓 {formattedDate}</span>}
          </div>

          {comment && <p className="card-comment">"{comment}"</p>}
        </div>
      </article>

      {menuOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} />
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              {hasColor
                ? <><span className="card-color-dot" style={{ background: colorHex, width: 20, height: 20 }} /><span className="sheet-name">{colorName}{gradeHint ? ` (~${gradeHint})` : ""}</span></>
                : <><span className="sheet-grade">{grade}</span><span className="sheet-name">{routeName || type}</span></>
              }
            </div>
            <button className="sheet-action" onClick={() => { setMenuOpen(false); onEdit(ascent); }}>
              <span className="sheet-action-icon">✏️</span><span>Modifier l'ascension</span>
            </button>
            <button className={`sheet-action sheet-action-danger ${confirmDelete ? "sheet-action-confirm" : ""}`} onClick={handleDelete}>
              <span className="sheet-action-icon">🗑️</span>
              <span>{confirmDelete ? "Confirmer la suppression" : "Supprimer"}</span>
            </button>
            {confirmDelete && <p className="sheet-confirm-hint">Appuie une seconde fois pour confirmer.</p>}
            <button className="sheet-cancel" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }}>Annuler</button>
          </div>
        </>
      )}
    </>
  );
}
