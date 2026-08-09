import { View, Text } from 'react-native';
import Svg, { Line, Circle, Path, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme';
import { pctToColorLevel, pctToLabel } from '../../../lib/gradePoints';

// Composant graphique de progression avec deux courbes indépendantes
// Courbe verte : voies cotées (points → cotations)
// Courbe violette : blocs couleur (pourcentage normalisé)
export default function ProgressionChart({ 
  progressionRoute, 
  progressionColor, 
  palette, 
  width,
  pointsToGradeLabel 
}) {
  const HEIGHT       = 180;
  const PADDING_LEFT = 20; // espace pour les labels Y
  const PADDING_RIGHT = 40;
  const PADDING_TOP  = 10;
  const PADDING_BOT  = 30; // espace pour les labels X
  
  const chartW = width - PADDING_LEFT - PADDING_RIGHT;
  const chartH = HEIGHT - PADDING_TOP - PADDING_BOT;

  // ── Calcul échelle courbe verte ────────────────
  const routeValues = progressionRoute.map(d => d.avg);
  const routeMin    = routeValues.length > 0 ? Math.min(...routeValues) * 0.95 : 0;
  const routeMax    = routeValues.length > 0 ? Math.max(...routeValues) * 1.05 : 10;

  // ── Calcul échelle courbe violette ─────────────
  const colorValues = progressionColor.map(d => d.avg);
  const colorMin    = colorValues.length > 0 ? Math.min(...colorValues) * 0.95 : 0;
  const colorMax    = colorValues.length > 0 ? Math.max(...colorValues) * 1.05 : 100;

  // ── Calcul positions X communes ────────────────
  // Tous les mois uniques triés
  const allMonths = [...new Set([
    ...progressionRoute.map(d => d.month),
    ...progressionColor.map(d => d.month),
  ])].sort();

  const monthNames = ['jan.', 'fév.', 'mar.', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.'];

  // Position X d'un mois
  function xPos(month) {
    const idx = allMonths.indexOf(month);
    if (allMonths.length === 1) return chartW / 2;
    return (idx / (allMonths.length - 1)) * chartW;
  }

  // Position Y selon la valeur et l'échelle
  function yPos(value, min, max) {
    if (max === min) return chartH / 2;
    return chartH - ((value - min) / (max - min)) * chartH;
  }

  // ── Génère le path SVG d'une courbe ───────────
  function makePath(points) {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  function makeAreaPath(points, chartHeight) {
    if (points.length === 0) return '';
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    // Ferme le path en bas
    return `${linePath} L ${points.at(-1).x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
  }

  // Points de la courbe verte
  const routePoints = progressionRoute.map(d => ({
    x:     xPos(d.month),
    y:     yPos(d.avg, routeMin, routeMax),
    month: d.month,
    avg:   d.avg,
  }));

  // Points de la courbe violette
  const colorPoints = progressionColor.map(d => ({
    x:     xPos(d.month),
    y:     yPos(d.avg, colorMin, colorMax),
    month: d.month,
    avg:   d.avg,
  }));

  // Labels Y axe gauche (cotations)
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const val = routeMin + (i / 4) * (routeMax - routeMin);
    return {
      y:     yPos(val, routeMin, routeMax),
      label: pointsToGradeLabel(val),
    };
  });

  // Labels Y axe droit (%) pour les blocs couleur
  const yLabelsRight = Array.from({ length: 5 }, (_, i) => {
    const val = colorMin + (i / 4) * (colorMax - colorMin);
    return {
      y:     yPos(val, colorMin, colorMax),
      label: `${Math.round(val)}%`,
    };
  });

  return (
    <View>
      {/* Légende */}
      <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={{ width: 16, height: 3, backgroundColor: '#22C55E', borderRadius: 2 }} />
          <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: '#22C55E' }}>Voies cotées</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={{ width: 16, height: 3, backgroundColor: '#7C3AED', borderRadius: 2 }} />
          <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: '#7C3AED' }}>Blocs couleur</Text>
        </View>
      </View>

      <Svg width={width} height={HEIGHT}>

        {/* Dégradés pour les aires sous les courbes */}
        <Defs>
          <LinearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#22C55E" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#22C55E" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7C3AED" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Axe X */}
        <Line
          x1={PADDING_LEFT} y1={PADDING_TOP + chartH}
          x2={PADDING_LEFT + chartW} y2={PADDING_TOP + chartH}
          stroke={palette.border} strokeWidth={1}
        />

        {/* Axe Y gauche */}
        <Line
          x1={PADDING_LEFT} y1={PADDING_TOP}
          x2={PADDING_LEFT} y2={PADDING_TOP + chartH}
          stroke={palette.border} strokeWidth={1}
        />

        {/* Labels Y gauche (cotations) */}
        {routePoints.length > 0 && yLabels.map((l, i) => (
          <SvgText
            key={i}
            x={PADDING_LEFT - 5}
            y={PADDING_TOP + l.y + 4}
            fontSize={9}
            fill={palette.textMuted}
            textAnchor="end"
          >
            {l.label}
          </SvgText>
        ))}

        {/* Labels X (mois) */}
        {allMonths.map((month, i) => {
          const [y, m] = month.split('-');
          const label = `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`;
          if (allMonths.length > 6 && i % 2 !== 0) return null;
          return (
            <SvgText
              key={month}
              x={PADDING_LEFT + xPos(month)}
              y={PADDING_TOP + chartH + 18}
              fontSize={9}
              fill={palette.textMuted}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}

        {/* Aires sous les courbes — en dessous des lignes */}
        {routePoints.length >= 2 && (
          <Path
            d={makeAreaPath(
              routePoints.map(p => ({ x: PADDING_LEFT + p.x, y: PADDING_TOP + p.y })),
              PADDING_TOP + chartH
            )}
            fill="url(#gradGreen)"
          />
        )}
        {colorPoints.length >= 2 && (
          <Path
            d={makeAreaPath(
              colorPoints.map(p => ({ x: PADDING_LEFT + p.x, y: PADDING_TOP + p.y })),
              PADDING_TOP + chartH
            )}
            fill="url(#gradPurple)"
          />
        )}

        {/* Courbe verte */}
        {routePoints.length >= 2 && (
          <Path
            d={makePath(routePoints.map(p => ({ x: PADDING_LEFT + p.x, y: PADDING_TOP + p.y })))}
            stroke="#22C55E"
            strokeWidth={2}
            fill="none"
          />
        )}

        {/* Points courbe verte */}
        {routePoints.map((p, i) => (
          <Circle
            key={i}
            cx={PADDING_LEFT + p.x}
            cy={PADDING_TOP + p.y}
            r={4}
            fill="#22C55E"
          />
        ))}

        {/* Labels valeur courbe violette */}
        {colorPoints.map((p, i) => (
          <SvgText
            key={i}
            x={PADDING_LEFT + p.x}
            y={PADDING_TOP + p.y - 10}
            fontSize={9}
            fill="#7C3AED"
            textAnchor="middle"
            fontWeight="bold"
          >
            {(() => {
              const level = pctToColorLevel(progressionColor[i].avg);
              const labels = ['Très facile', 'Facile', 'Moyen', 'Difficile', 'Très difficile', 'Élite'];
              return `N${level} - ${labels[level - 1]}`;
            })()}
          </SvgText>
        ))}

        {/* Courbe violette */}
        {colorPoints.length >= 2 && (
          <Path
            d={makePath(colorPoints.map(p => ({ x: PADDING_LEFT + p.x, y: PADDING_TOP + p.y })))}
            stroke="#7C3AED"
            strokeWidth={2}
            fill="none"
          />
        )}

        {/* Points courbe violette */}
        {colorPoints.map((p, i) => (
          <Circle
            key={i}
            cx={PADDING_LEFT + p.x}
            cy={PADDING_TOP + p.y}
            r={4}
            fill="#7C3AED"
          />
        ))}

      </Svg>

    </View>
  );
}