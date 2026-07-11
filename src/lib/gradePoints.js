// ── Système de points cotations classiques ────────────────────────────────────

const ROUTE_GRADES = [
  "3","3+","4","4+",
  "5a","5b","5c",
  "6a","6a+","6b","6b+","6c","6c+",
  "7a","7a+","7b","7b+","7c","7c+",
  "8a","8a+","8b","8b+","8c","8c+",
  "9a","9a+","9b","9b+","9c",
];
const BLOC_GRADES = [
  "3","4","5","5+",
  "6A","6A+","6B","6B+","6C","6C+",
  "7A","7A+","7B","7B+","7C","7C+",
  "8A","8A+","8B","8B+","8C","8C+",
];

function buildMap(list, startGrade, basePoints) {
  const startIdx = list.indexOf(startGrade);
  const map = {};
  list.forEach((g, i) => { map[g] = basePoints + (i - startIdx); });
  return map;
}

const ROUTE_POINTS = buildMap(ROUTE_GRADES, "6a", 10);
const BLOC_POINTS  = buildMap(BLOC_GRADES,  "6A", 10);
export const GRADE_POINTS = { ...ROUTE_POINTS, ...BLOC_POINTS };

export function gradeToPoints(grade) {
  if (!grade) return null;
  return GRADE_POINTS[grade] ?? null;
}

export function ascentToPoints(ascent) {
  if (ascent.result === "Projet") return null;
  const direct = gradeToPoints(ascent.grade);
  if (direct !== null) return direct;
  if (ascent.gradeHint) {
    const hint = gradeToPoints(ascent.gradeHint);
    if (hint !== null) return hint;
  }
  return null;
}

// ── Système de niveaux normalisés (blocs couleur) ─────────────────────────────
// 6 niveaux fixes, communs à toutes les salles
// Le rang de la couleur dans sa salle est converti en % puis mappé sur N1-N6

export const COLOR_LEVELS = [
  { id: 1, label: "N1 — Très facile",    short: "N1", color: "#FACC15" }, // jaune
  { id: 2, label: "N2 — Facile",         short: "N2", color: "#22C55E" }, // vert
  { id: 3, label: "N3 — Moyen",          short: "N3", color: "#3B82F6" }, // bleu
  { id: 4, label: "N4 — Difficile",      short: "N4", color: "#EF4444" }, // rouge
  { id: 5, label: "N5 — Très difficile", short: "N5", color: "#3F3F46" }, // noir
  { id: 6, label: "N6 — Élite",          short: "N6", color: "#7C3AED" }, // violet
];

// Convertit le rang d'une couleur dans sa salle en % (10-100)
export function ascentToColorPct(ascent, gyms) {
  if (ascent.result === "Projet") return null;
  if (!ascent.colorId || !ascent.gymId) return null;
  const gym = gyms.find(g => g.id === ascent.gymId);
  if (!gym || gym.colors.length === 0) return null;
  const idx = gym.colors.findIndex(c => c.id === ascent.colorId);
  if (idx === -1) return null;
  const pct = 10 + (idx / (gym.colors.length - 1 || 1)) * 90;
  return Math.round(pct * 10) / 10;
}

// Convertit un % en niveau N1-N6
export function pctToColorLevel(pct) {
  // 6 tranches égales entre 10% et 100% → chaque tranche = 15%
  // N1: 10-25  N2: 25-40  N3: 40-55  N4: 55-70  N5: 70-85  N6: 85-100
  if (pct >= 85) return 6;
  if (pct >= 70) return 5;
  if (pct >= 55) return 4;
  if (pct >= 40) return 3;
  if (pct >= 25) return 2;
  return 1;
}

// Retourne le niveau N1-N6 d'une ascension couleur
export function ascentToColorLevel(ascent, gyms) {
  const pct = ascentToColorPct(ascent, gyms);
  if (pct === null) return null;
  return pctToColorLevel(pct);
}

// Moyenne top N des % couleur d'un mois (pour la courbe)
export function topNColorAvg(ascents, gyms, n = 5) {
  const pcts = ascents
    .map(a => ascentToColorPct(a, gyms))
    .filter(p => p !== null)
    .sort((a, b) => b - a)
    .slice(0, n);
  if (pcts.length === 0) return null;
  return pcts.reduce((s, p) => s + p, 0) / pcts.length;
}

// Moyenne top N des points cotation d'un mois (pour la courbe)
export function topNAverage(ascents, n = 5) {
  const points = ascents
    .map(a => ascentToPoints(a))
    .filter(p => p !== null)
    .sort((a, b) => b - a)
    .slice(0, n);
  if (points.length === 0) return null;
  return points.reduce((s, p) => s + p, 0) / points.length;
}

// Label pour la courbe
export function pctToLabel(pct) {
  const lvl = COLOR_LEVELS[pctToColorLevel(pct) - 1];
  return lvl ? lvl.short : "?";
}

export function pointsToGrade(points, preferBloc = false) {
  const map = preferBloc ? BLOC_POINTS : ROUTE_POINTS;
  const entries = Object.entries(map);
  let best = entries[0];
  let bestDiff = Math.abs(entries[0][1] - points);
  for (const [g, p] of entries) {
    const diff = Math.abs(p - points);
    if (diff < bestDiff) { bestDiff = diff; best = [g, p]; }
  }
  return best[0];
}

export function ascentDisplayGrade(ascent) {
  if (ascent.colorHex && !ascent.gradeHint) {
    return { label: ascent.colorName || "?", isColor: true, hex: ascent.colorHex };
  }
  if (ascent.gradeHint) return { label: ascent.gradeHint, isColor: false, hex: null };
  return { label: ascent.grade || "?", isColor: false, hex: null };
}
