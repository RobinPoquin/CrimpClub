export default function StatsPage({ ascents }) {
  const total = ascents.length;
  const done = ascents.filter((a) => a.result !== "Projet");
  const outdoor = ascents.filter((a) => a.outdoor).length;

  // Sessions uniques par date
  const sessions = new Set(ascents.map((a) => a.date)).size;

  // Ce mois
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthCount = ascents.filter((a) => a.date?.startsWith(thisMonth)).length;

  // Niveau max (approximation sur cotation française)
  const ORDER = [
    "3","3+","4","4+","5a","5b","5c",
    "6a","6a+","6b","6b+","6c","6c+",
    "7a","7a+","7b","7b+","7c","7c+",
    "8a","8a+","8b","8b+","8c","8c+","9a","9a+","9b","9b+","9c",
    "5","5+","6A","6A+","6B","6B+","6C","6C+",
    "7A","7A+","7B","7B+","7C","7C+",
    "8A","8A+","8B","8B+","8C","8C+",
  ];
  const grades = done.map((a) => a.grade);
  const maxGrade = grades.reduce((max, g) => {
    return ORDER.indexOf(g) > ORDER.indexOf(max) ? g : max;
  }, grades[0] || "--");

  // Répartition par cotation
  const gradeCounts = {};
  done.forEach((a) => {
    gradeCounts[a.grade] = (gradeCounts[a.grade] || 0) + 1;
  });
  const pyramidGrades = Object.entries(gradeCounts)
    .sort((a, b) => ORDER.indexOf(b[0]) - ORDER.indexOf(a[0]))
    .slice(0, 8);
  const maxCount = Math.max(...pyramidGrades.map((g) => g[1]), 1);

  // Répartition par type
  const typeCounts = {};
  ascents.forEach((a) => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });

  // Résultats
  const resultCounts = { "À vue": 0, Flash: 0, Travaillé: 0, Projet: 0 };
  ascents.forEach((a) => { if (resultCounts[a.result] !== undefined) resultCounts[a.result]++; });

  if (total === 0) {
    return (
      <div className="page">
        <div className="page-header"><h1>Statistiques</h1></div>
        <div className="empty-state">
          <p className="empty-icon">📊</p>
          <p className="empty-title">Rien à afficher.</p>
          <p className="empty-sub">Ajoute des ascensions pour voir tes stats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header"><h1>Statistiques</h1></div>

      <div className="stats-grid">
        <StatCard label="Ascensions" value={total} />
        <StatCard label="Niveau max" value={maxGrade} accent />
        <StatCard label="Ce mois" value={monthCount} />
        <StatCard label="Sessions" value={sessions} />
        <StatCard label="En extérieur" value={outdoor} />
        <StatCard label="Sites visités" value={new Set(ascents.map((a) => a.location).filter(Boolean)).size} />
      </div>

      {pyramidGrades.length > 0 && (
        <section className="stats-section">
          <h2>Pyramide</h2>
          <div className="pyramid">
            {pyramidGrades.map(([grade, count]) => (
              <div key={grade} className="pyr-row">
                <span className="pyr-grade">{grade}</span>
                <div className="pyr-bar-wrap">
                  <div
                    className="pyr-bar"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="pyr-count">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="stats-section">
        <h2>Résultats</h2>
        <div className="result-grid">
          {Object.entries(resultCounts).map(([label, count]) => (
            <div key={label} className="result-pill">
              <span className="result-count">{count}</span>
              <span className="result-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {Object.keys(typeCounts).length > 0 && (
        <section className="stats-section">
          <h2>Par discipline</h2>
          <div className="type-list">
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="type-row">
                  <span>{type}</span>
                  <div className="type-bar-wrap">
                    <div
                      className="type-bar"
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </div>
                  <span className="type-count">{count}</span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${accent ? "accent" : ""}`}>{value}</span>
    </div>
  );
}
