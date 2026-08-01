// Carte d'aperçu d'un projet dans la liste
export default function ProjectCard({ project, onClick }) {
  const {
    routeName, grade, type, location, colorHex, colorName,
    gradeHint, status, objectiveDate, attempts
  } = project;

  // Dernière tentative pour afficher la date
  const lastAttempt = attempts?.[0];

  // Nombre de jours avant la date objectif
  const daysLeft = objectiveDate
    ? Math.ceil((new Date(objectiveDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const hasColor = colorHex && !project.outdoor;

  return (
    <article className="ascent-card" onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Barre latérale — couleur du bloc ou couleur du statut */}
      <div
        className="card-accent-bar"
        style={{
          background: hasColor ? colorHex :
            status === "reussi" ? "var(--accent)" :
            status === "abandonne" ? "var(--text-muted)" :
            "var(--warn)"
        }}
      />

      <div className="card-body">
        <div className="card-top">
          <div className="card-grade-block">
            {hasColor ? (
              <div className="card-color-grade">
                <span className="card-color-dot" style={{ background: colorHex }} />
                <span className="card-grade card-grade-color">{colorName}</span>
                {gradeHint && <span className="card-grade-hint">{gradeHint}</span>}
              </div>
            ) : (
              <span className="card-grade">{grade || "?"}</span>
            )}
            {routeName && <span className="card-name">{routeName}</span>}
          </div>

          {/* Badge statut */}
          <span className={`card-result ${
            status === "reussi"    ? "result-flash" :
            status === "abandonne" ? "result-worked" :
            "result-worked"
          }`} style={status === "en_cours" ? { background: "#FEF3C7", color: "#92400E" } : {}}>
            {status === "en_cours"  ? "En cours" :
             status === "reussi"    ? "Réussi ✓" :
             "Abandonné"}
          </span>
        </div>

        <div className="card-chips">
          <span className="chip-type">{type}</span>
        </div>

        <div className="card-meta">
          {location && <span>📍 {location}</span>}
          {/* Nombre de tentatives */}
          <span>🔄 {attempts?.length || 0} tentative{attempts?.length !== 1 ? "s" : ""}</span>
          {/* Dernière tentative */}
          {lastAttempt && (
            <span>Dernière : {new Date(lastAttempt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
          )}
        </div>

        {/* Compte à rebours objectif */}
        {daysLeft !== null && status === "en_cours" && (
          <p className="project-deadline" style={{ color: daysLeft < 7 ? "var(--danger)" : "var(--text-muted)" }}>
            🎯 {daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}` : "Date objectif dépassée"}
          </p>
        )}
      </div>
    </article>
  );
}