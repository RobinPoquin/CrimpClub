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

// Points d'une ascension cotée (classique ou gradeHint)
// Retourne null pour les blocs couleur purs
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

// Score normalisé 0-100 d'un bloc couleur
// basé sur le rang de la couleur dans la liste de la salle
// rang 1/N (plus facile) → ~10%  |  rang N/N (plus dur) → 100%
export function ascentToColorPct(ascent, gyms) {
  if (ascent.result === "Projet") return null;
  if (!ascent.colorId || !ascent.gymId) return null;
  const gym = gyms.find(g => g.id === ascent.gymId);
  if (!gym || gym.colors.length === 0) return null;
  const idx = gym.colors.findIndex(c => c.id === ascent.colorId);
  if (idx === -1) return null;
  // Normalise : 0-100%, le minimum est ~10 pour que même le plus facile ait du poids
  const pct = 10 + (idx / (gym.colors.length - 1 || 1)) * 90;
  return Math.round(pct * 10) / 10;
}

// Moyenne top N des pourcentages couleur d'un mois
export function topNColorAvg(ascents, gyms, n = 5) {
  const pcts = ascents
    .map(a => ascentToColorPct(a, gyms))
    .filter(p => p !== null)
    .sort((a, b) => b - a)
    .slice(0, n);
  if (pcts.length === 0) return null;
  return pcts.reduce((s, p) => s + p, 0) / pcts.length;
}

// Moyenne top N des points cotation d'un mois
export function topNAverage(ascents, n = 5) {
  const points = ascents
    .map(a => ascentToPoints(a))
    .filter(p => p !== null)
    .sort((a, b) => b - a)
    .slice(0, n);
  if (points.length === 0) return null;
  return points.reduce((s, p) => s + p, 0) / points.length;
}

// Label de difficulté pour un pourcentage couleur
export function pctToLabel(pct) {
  if (pct >= 85) return "Expert";
  if (pct >= 65) return "Difficile";
  if (pct >= 40) return "Intermédiaire";
  return "Facile";
}

// Reconvertit un score en cotation lisible
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

// Label d'affichage pour la pyramide
export function ascentDisplayGrade(ascent) {
  if (ascent.colorHex && !ascent.gradeHint) {
    return { label: ascent.colorName || "?", isColor: true, hex: ascent.colorHex };
  }
  if (ascent.gradeHint) return { label: ascent.gradeHint, isColor: false, hex: null };
  return { label: ascent.grade || "?", isColor: false, hex: null };
}
