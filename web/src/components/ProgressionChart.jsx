import { useState, useRef, useEffect } from "react";
import { topNAverage, topNColorAvg, pointsToGrade, pctToLabel } from "../lib/gradePoints";

const RANGES = [
  { label: "3 mois",  months: 3 },
  { label: "6 mois",  months: 6 },
  { label: "12 mois", months: 12 },
  { label: "Tout",    months: null },
];

const MONTH_LABELS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
function shortMonth(ym) {
  const [y, m] = ym.split("-");
  return `${MONTH_LABELS[parseInt(m) - 1]} ${y.slice(2)}`;
}

function monthsBetween(start, end) {
  const months = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

// Dessine une courbe sur le canvas
function drawCurve(ctx, points, dataPoints, xOf, yOf, color, bgCard) {
  const defined = points.filter(p => p !== null);
  if (defined.length < 2) return;

  // Aire dégradée
  const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height / (window.devicePixelRatio || 1));
  grad.addColorStop(0, color + "44");
  grad.addColorStop(1, color + "00");

  ctx.beginPath();
  let started = false;
  points.forEach((p, i) => {
    if (p === null) return;
    const x = xOf(i), y = yOf(p);
    if (!started) { ctx.moveTo(x, yOf(Math.min(...defined) - 1)); ctx.lineTo(x, y); started = true; }
    else ctx.lineTo(x, y);
  });
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i] !== null) { ctx.lineTo(xOf(i), yOf(Math.min(...defined) - 1)); break; }
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Ligne
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  started = false;
  points.forEach((p, i) => {
    if (p === null) { started = false; return; }
    if (!started) { ctx.moveTo(xOf(i), yOf(p)); started = true; }
    else ctx.lineTo(xOf(i), yOf(p));
  });
  ctx.stroke();

  // Points
  points.forEach((p, i) => {
    if (p === null) return;
    ctx.beginPath();
    ctx.arc(xOf(i), yOf(p), 4, 0, Math.PI * 2);
    ctx.fillStyle = bgCard;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });
}

export default function ProgressionChart({ ascents, gyms = [] }) {
  const [rangeIdx, setRangeIdx] = useState(1);
  const canvasRef = useRef(null);

  const done = ascents.filter(a => a.result !== "Projet" && a.date);
  const now  = new Date();
  const range = RANGES[rangeIdx];

  const startDate = range.months
    ? new Date(now.getFullYear(), now.getMonth() - range.months + 1, 1)
    : done.length > 0
      ? new Date(done.map(a => a.date).sort()[0] + "T00:00:00")
      : new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const allMonths = monthsBetween(startDate, now);

  // Données par mois — deux séries indépendantes
  const dataPoints = allMonths.map(ym => {
    const monthA = done.filter(a => a.date.startsWith(ym));
    return {
      ym,
      label:    shortMonth(ym),
      gradeAvg: topNAverage(monthA, 5),       // points cotation (null si aucune)
      colorAvg: topNColorAvg(monthA, gyms, 5), // % couleur (null si aucune)
    };
  });

  const hasGrade = dataPoints.some(d => d.gradeAvg !== null);
  const hasColor = dataPoints.some(d => d.colorAvg !== null);
  const withGrade = dataPoints.filter(d => d.gradeAvg !== null);
  const withColor = dataPoints.filter(d => d.colorAvg !== null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasGrade && !hasColor) return;

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const style  = getComputedStyle(canvas);
    const accent = "#22C55E";
    const purple = "#A855F7";
    const muted  = style.getPropertyValue("--border").trim()         || "#E4E4E0";
    const textSec= style.getPropertyValue("--text-secondary").trim() || "#71717A";
    const bgCard = style.getPropertyValue("--bg-card").trim()        || "#fff";

    const PAD_L = 44, PAD_R = hasColor ? 44 : 16, PAD_T = 16, PAD_B = 36;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    function xOf(i) { return PAD_L + (i / (dataPoints.length - 1 || 1)) * chartW; }

    // ── Grille + axe Y gauche (cotations) ──────────
    if (hasGrade) {
      const gScores  = dataPoints.map(d => d.gradeAvg).filter(Boolean);
      const gMin     = Math.min(...gScores) - 1;
      const gMax     = Math.max(...gScores) + 1;
      const gRange   = gMax - gMin || 1;
      const yGrade   = val => PAD_T + chartH - ((val - gMin) / gRange) * chartH;

      const steps = 4;
      for (let s = 0; s <= steps; s++) {
        const val = gMin + (s / steps) * gRange;
        const y   = yGrade(val);
        ctx.strokeStyle = muted;
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(PAD_L, y);
        ctx.lineTo(W - PAD_R, y);
        ctx.stroke();

        ctx.fillStyle    = accent;
        ctx.font         = "500 10px Inter, sans-serif";
        ctx.textAlign    = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(pointsToGrade(val), PAD_L - 6, y);
      }

      drawCurve(ctx,
        dataPoints.map(d => d.gradeAvg),
        dataPoints, xOf, yGrade, accent, bgCard
      );
    }

    // ── Axe Y droit (% couleur) ─────────────────────
    if (hasColor) {
      const cScores = dataPoints.map(d => d.colorAvg).filter(Boolean);
      const cMin    = Math.max(0,   Math.min(...cScores) - 5);
      const cMax    = Math.min(100, Math.max(...cScores) + 5);
      const cRange  = cMax - cMin || 1;
      const yColor  = val => PAD_T + chartH - ((val - cMin) / cRange) * chartH;

      // Labels axe droit
      const LEVELS = [
        { pct: 10,  label: "Facile" },
        { pct: 40,  label: "Inter." },
        { pct: 65,  label: "Difficile" },
        { pct: 85,  label: "Expert" },
      ].filter(l => l.pct >= cMin && l.pct <= cMax);

      ctx.fillStyle    = purple;
      ctx.font         = "500 10px Inter, sans-serif";
      ctx.textAlign    = "left";
      ctx.textBaseline = "middle";
      LEVELS.forEach(l => {
        ctx.fillText(l.label, W - PAD_R + 4, yColor(l.pct));
      });

      // Ligne pointillée de grille droite si pas de courbe cotation
      if (!hasGrade) {
        LEVELS.forEach(l => {
          const y = yColor(l.pct);
          ctx.strokeStyle = muted;
          ctx.lineWidth   = 0.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(PAD_L, y);
          ctx.lineTo(W - PAD_R, y);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      drawCurve(ctx,
        dataPoints.map(d => d.colorAvg),
        dataPoints, xOf, yColor, purple, bgCard
      );
    }

    // ── Labels axe X ───────────────────────────────
    ctx.fillStyle    = textSec;
    ctx.font         = "500 10px Inter, sans-serif";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    const maxLabels = Math.floor(chartW / 40);
    const step = Math.max(1, Math.ceil(dataPoints.length / maxLabels));
    dataPoints.forEach((d, i) => {
      if (i % step !== 0 && i !== dataPoints.length - 1) return;
      ctx.fillText(d.label, xOf(i), PAD_T + chartH + 6);
    });

  }, [dataPoints, rangeIdx, hasGrade, hasColor]);

  if (done.length === 0) return null;

  // Évolutions
  const gradeDelta = withGrade.length >= 2
    ? (withGrade.at(-1).gradeAvg - withGrade.at(0).gradeAvg) : 0;
  const colorDelta = withColor.length >= 2
    ? (withColor.at(-1).colorAvg - withColor.at(0).colorAvg) : 0;

  const lastGrade = withGrade.at(-1)?.gradeAvg;
  const lastColor = withColor.at(-1)?.colorAvg;

  return (
    <section className="stats-section">
      <div className="chart-header">
        <h2>Progression</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {gradeDelta !== 0 && (
            <span className={`chart-delta ${gradeDelta > 0 ? "delta-up" : "delta-down"}`}
              title="Évolution voies cotées">
              🟢 {gradeDelta > 0 ? "▲" : "▼"} {Math.abs(gradeDelta).toFixed(1)}%
            </span>
          )}
          {colorDelta !== 0 && (
            <span className={`chart-delta ${colorDelta > 0 ? "delta-up-purple" : "delta-down"}`}
              title="Évolution blocs couleur">
              🟣 {colorDelta > 0 ? "▲" : "▼"} {Math.abs(colorDelta).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="range-pills">
        {RANGES.map((r, i) => (
          <button key={r.label}
            className={`range-pill ${rangeIdx === i ? "range-pill-active" : ""}`}
            onClick={() => setRangeIdx(i)}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Légende des courbes */}
      {(hasGrade || hasColor) && (
        <div className="chart-legend-row">
          {hasGrade && <span className="chart-legend-item" style={{ color: "#22C55E" }}>● Voies cotées</span>}
          {hasColor && <span className="chart-legend-item" style={{ color: "#A855F7" }}>● Blocs couleur</span>}
        </div>
      )}

      {(!hasGrade && !hasColor) || (withGrade.length < 2 && withColor.length < 2) ? (
        <p className="chart-empty">Pas encore assez de données sur cette période.<br />Ajoute des ascensions sur plusieurs mois.</p>
      ) : (
        <div className="chart-wrap">
          <canvas ref={canvasRef} className="progression-canvas" />
        </div>
      )}

      {/* Niveaux actuels */}
      <div className="chart-footer">
        {lastGrade && (
          <p className="chart-legend">
            <span style={{ color: "#22C55E" }}>●</span> Niveau estimé : <strong>{pointsToGrade(lastGrade)}</strong>
            <span className="chart-legend-sub"> (top 5 voies cotées)</span>
          </p>
        )}
        {lastColor && (
          <p className="chart-legend">
            <span style={{ color: "#A855F7" }}>●</span> Niveau bloc : <strong>{pctToLabel(lastColor)}</strong>
            <span className="chart-legend-sub"> ({lastColor.toFixed(0)}% · top 5 blocs couleur)</span>
          </p>
        )}
      </div>
    </section>
  );
}
