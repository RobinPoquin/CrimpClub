import ProgressionChart from "../components/ProgressionChart";
import { ascentToPoints, ascentToColorLevel, COLOR_LEVELS, ascentDisplayGrade } from "../lib/gradePoints";

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

  // Niveau max (voies cotées)
  const gradedDone = done.filter(a => ascentToPoints(a) !== null);
  const maxAscent  = gradedDone.reduce((best, a) => {
    const p = ascentToPoints(a);
    return p > (ascentToPoints(best) ?? -Infinity) ? a : best;
  }, gradedDone[0]);
  const maxGrade = maxAscent ? ascentDisplayGrade(maxAscent).label : "--";

  // ── Pyramide voies cotées (intérieur + extérieur) ──
  const routeGradeCountsIn  = {};
  const routeGradeCountsOut = {};
  done.filter(a => ascentToPoints(a) !== null && !a.colorId && a.type !== "Bloc").forEach(a => {
    const { label } = ascentDisplayGrade(a);
    if (a.outdoor) {
      routeGradeCountsOut[label] = (routeGradeCountsOut[label] || 0) + 1;
    } else {
      routeGradeCountsIn[label] = (routeGradeCountsIn[label] || 0) + 1;
    }
  });
  const allRouteLabels = [...new Set([
    ...Object.keys(routeGradeCountsIn),
    ...Object.keys(routeGradeCountsOut),
  ])].sort((a, b) => ORDER.indexOf(b) - ORDER.indexOf(a)).slice(0, 8);
  const maxRouteCount = Math.max(
    ...allRouteLabels.map(l => (routeGradeCountsIn[l] || 0) + (routeGradeCountsOut[l] || 0)),
    1
  );

  // ── Pyramide blocs couleur — 6 niveaux normalisés ──
  const colorLevelCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let hasColorAscents = false;
  done.forEach(a => {
    const lvl = ascentToColorLevel(a, gyms);
    if (lvl !== null) {
      colorLevelCounts[lvl]++;
      hasColorAscents = true;
    }
  });
  const maxColorCount = Math.max(...Object.values(colorLevelCounts), 1);

  // ── Pyramide blocs cotés (intérieur coté + extérieur) ──
  const blocGradeCountsIn  = {};
  const blocGradeCountsOut = {};
  done.filter(a => a.type === "Bloc" && !a.colorId && ascentToPoints(a) !== null).forEach(a => {
    const { label } = ascentDisplayGrade(a);
    if (a.outdoor) {
      blocGradeCountsOut[label] = (blocGradeCountsOut[label] || 0) + 1;
    } else {
      blocGradeCountsIn[label] = (blocGradeCountsIn[label] || 0) + 1;
    }
  });
  const allBlocLabels = [...new Set([
    ...Object.keys(blocGradeCountsIn),
    ...Object.keys(blocGradeCountsOut),
  ])].sort((a, b) => ORDER.indexOf(b) - ORDER.indexOf(a)).slice(0, 8);
  const maxBlocCount = Math.max(
    ...allBlocLabels.map(l => (blocGradeCountsIn[l] || 0) + (blocGradeCountsOut[l] || 0)),
    1
  );

  // Types
  const typeCounts = {};
  ascents.forEach(a => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });

  // Résultats
  const resultCounts = { Flash: 0, Travaillé: 0 };
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

      {/* ── Pyramide voies cotées ── */}
      {allRouteLabels.length > 0 && (
        <section className="stats-section">
          <h2>Pyramide — Voies cotées</h2>
          <div className="pyr-hint" style={{ marginBottom: 12, display: "flex", gap: 16 }}>
            <span><span style={{ color: "#22C55E" }}>■</span> Intérieur</span>
            <span><span style={{ color: "#3B82F6" }}>■</span> Extérieur</span>
          </div>
          <div className="pyramid">
            {allRouteLabels.map(label => {
              const inCount  = routeGradeCountsIn[label]  || 0;
              const outCount = routeGradeCountsOut[label] || 0;
              const tot      = inCount + outCount;
              return (
                <div key={label} className="pyr-row">
                  <span className="pyr-grade">{label}</span>
                  <div className="pyr-bar-wrap">
                    {inCount > 0 && (
                      <div className="pyr-bar" style={{
                        width: `${(inCount / maxRouteCount) * 100}%`,
                        background: "#22C55E",
                        borderRadius: outCount > 0 ? "6px 0 0 6px" : "6px",
                      }} />
                    )}
                    {outCount > 0 && (
                      <div className="pyr-bar" style={{
                        width: `${(outCount / maxRouteCount) * 100}%`,
                        background: "#3B82F6",
                        borderRadius: inCount > 0 ? "0 6px 6px 0" : "6px",
                      }} />
                    )}
                  </div>
                  <span className="pyr-count">{tot}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Pyramide blocs couleur — 6 niveaux normalisés ── */}
      {hasColorAscents && (
        <section className="stats-section">
          <h2>Pyramide — Blocs couleur</h2>
          <p className="pyr-hint" style={{ marginBottom: 12 }}>
            Niveaux normalisés sur 6 tranches, comparables entre toutes les salles.
          </p>
          <div className="pyramid">
            {[...COLOR_LEVELS].reverse().map(lvl => {
              const count = colorLevelCounts[lvl.id] || 0;
              return (
                <div key={lvl.id} className="pyr-row">
                  <span className="pyr-grade" style={{ color: lvl.color, fontWeight: 700 }}>
                    {lvl.short}
                  </span>
                  <div className="pyr-bar-wrap">
                    <div
                      className="pyr-bar"
                      style={{
                        width: `${(count / maxColorCount) * 100}%`,
                        background: lvl.color,
                        opacity: count === 0 ? 0.15 : 1,
                      }}
                    />
                  </div>
                  <span className="pyr-count">{count || "—"}</span>
                </div>
              );
            })}
          </div>
          {/* Légende */}
          <div className="color-level-legend">
            {COLOR_LEVELS.map(lvl => (
              <div key={lvl.id} className="color-level-item">
                <span className="color-level-dot" style={{ background: lvl.color }} />
                <span>{lvl.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Pyramide blocs cotés ── */}
      {allBlocLabels.length > 0 && (
        <section className="stats-section">
          <h2>Pyramide — Blocs cotés</h2>
          <div className="pyr-hint" style={{ marginBottom: 12, display: "flex", gap: 16 }}>
            <span><span style={{ color: "#F59E0B" }}>■</span> Intérieur</span>
            <span><span style={{ color: "#3B82F6" }}>■</span> Extérieur</span>
          </div>
          <div className="pyramid">
            {allBlocLabels.map(label => {
              const inCount  = blocGradeCountsIn[label]  || 0;
              const outCount = blocGradeCountsOut[label] || 0;
              const total    = inCount + outCount;
              return (
                <div key={label} className="pyr-row">
                  <span className="pyr-grade">{label}</span>
                  <div className="pyr-bar-wrap">
                    {/* Barre intérieur */}
                    {inCount > 0 && (
                      <div className="pyr-bar" style={{
                        width: `${(inCount / maxBlocCount) * 100}%`,
                        background: "#F59E0B",
                        borderRadius: outCount > 0 ? "6px 0 0 6px" : "6px",
                      }} />
                    )}
                    {/* Barre extérieur accolée */}
                    {outCount > 0 && (
                      <div className="pyr-bar" style={{
                        width: `${(outCount / maxBlocCount) * 100}%`,
                        background: "#3B82F6",
                        borderRadius: inCount > 0 ? "0 6px 6px 0" : "6px",
                        marginLeft: inCount > 0 ? 0 : undefined,
                      }} />
                    )}
                  </div>
                  <span className="pyr-count">{total}</span>
                </div>
              );
            })}
          </div>
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
