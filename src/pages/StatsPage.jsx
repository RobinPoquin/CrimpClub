import ProgressionChart from "../components/ProgressionChart";
import { ascentToPoints, ascentDisplayGrade } from "../lib/gradePoints";

const ORDER_ROUTE = [
  "3","3+","4","4+","5a","5b","5c",
  "6a","6a+","6b","6b+","6c","6c+",
  "7a","7a+","7b","7b+","7c","7c+",
  "8a","8a+","8b","8b+","8c","8c+","9a","9a+","9b","9b+","9c",
];
const ORDER_BLOC = [
  "3","4","5","5+","6A","6A+","6B","6B+","6C","6C+",
  "7A","7A+","7B","7B+","7C","7C+","8A","8A+","8B","8B+","8C","8C+",
];
const ORDER = [...ORDER_ROUTE, ...ORDER_BLOC];

export default function StatsPage({ ascents, gyms = [] }) {
  const total    = ascents.length;
  const done     = ascents.filter(a => a.result !== "Projet");
  const outdoor  = ascents.filter(a => a.outdoor).length;
  const sessions = new Set(ascents.map(a => a.date)).size;

  const thisMonth  = new Date().toISOString().slice(0, 7);
  const monthCount = ascents.filter(a => a.date?.startsWith(thisMonth)).length;

  // Niveau max — prend en compte gradeHint pour les couleurs
  const gradedDone = done.filter(a => ascentToPoints(a) !== null);
  const maxAscent  = gradedDone.reduce((best, a) => {
    const p = ascentToPoints(a);
    return p > (ascentToPoints(best) ?? -Infinity) ? a : best;
  }, gradedDone[0]);
  const maxGrade = maxAscent ? ascentDisplayGrade(maxAscent).label : "--";

  // Pyramide — regroupe par label d'affichage
  const gradeCounts = {}; // { label: { count, isColor, hex } }
  done.forEach(a => {
    const { label, isColor, hex } = ascentDisplayGrade(a);
    if (!gradeCounts[label]) gradeCounts[label] = { count: 0, isColor, hex };
    gradeCounts[label].count++;
  });

  // Trie : les cotations connues par ORDER, les couleurs pures à la fin
  const pyramidEntries = Object.entries(gradeCounts)
    .sort(([a, va], [b, vb]) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return vb.count - va.count;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ib - ia;
    })
    .slice(0, 10);
  const maxCount = Math.max(...pyramidEntries.map(([, v]) => v.count), 1);

  // Types
  const typeCounts = {};
  ascents.forEach(a => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });

  // Résultats
  const resultCounts = { "À vue": 0, Flash: 0, Travaillé: 0, Projet: 0 };
  ascents.forEach(a => { if (resultCounts[a.result] !== undefined) resultCounts[a.result]++; });

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
        <StatCard label="Niveau max"  value={maxGrade} accent />
        <StatCard label="Ce mois"     value={monthCount} />
        <StatCard label="Sessions"    value={sessions} />
        <StatCard label="Extérieur"   value={outdoor} />
        <StatCard label="Sites"       value={new Set(ascents.map(a => a.location).filter(Boolean)).size} />
      </div>

      <ProgressionChart ascents={ascents} gyms={gyms} />

      {/* Pyramide */}
      {pyramidEntries.length > 0 && (
        <section className="stats-section">
          <h2>Pyramide</h2>
          <div className="pyramid">
            {pyramidEntries.map(([label, { count, isColor, hex }]) => (
              <div key={label} className="pyr-row">
                {isColor ? (
                  <span className="pyr-color-dot" style={{ background: hex }} title={label} />
                ) : (
                  <span className="pyr-grade">{label}</span>
                )}
                <div className="pyr-bar-wrap">
                  <div
                    className="pyr-bar"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: isColor ? hex : undefined,
                    }}
                  />
                </div>
                <span className="pyr-count">{count}</span>
              </div>
            ))}
          </div>
          {done.some(a => ascentToPoints(a) === null && !a.gradeHint) && (
            <p className="pyr-hint">💡 Ajoute une cotation indicative à tes couleurs dans <strong>Profil → Mes salles</strong> pour les inclure dans la courbe de progression.</p>
          )}
        </section>
      )}

      {/* Résultats */}
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
            {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="type-row">
                <span>{type}</span>
                <div className="type-bar-wrap">
                  <div className="type-bar" style={{ width: `${(count / total) * 100}%` }} />
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
