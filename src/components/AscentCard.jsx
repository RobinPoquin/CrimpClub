const RESULT_COLORS = {
  "À vue": "#16a34a",
  Flash: "#2563eb",
  Travaillé: "#d97706",
  Projet: "#dc2626",
};

export default function AscentCard({ ascent }) {
  const {
    grade, type, date, outdoor, routeName,
    location, result, comment,
  } = ascent;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <article className="ascent-card">
      <div className="card-top">
        <div className="card-left">
          <span className="card-grade">{grade}</span>
          {routeName && <span className="card-name">{routeName}</span>}
        </div>
        <span
          className="card-result"
          style={{ color: RESULT_COLORS[result] || "#6b7280" }}
        >
          {result}
        </span>
      </div>

      <div className="card-chips">
        <span className="chip chip-type">{type}</span>
        {outdoor && <span className="chip chip-outdoor">🌿 Extérieur</span>}
      </div>

      <div className="card-meta">
        {location && <span>📍 {location}</span>}
        {formattedDate && <span>🗓 {formattedDate}</span>}
      </div>

      {comment && <p className="card-comment">"{comment}"</p>}
    </article>
  );
}
