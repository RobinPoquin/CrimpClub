import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getAscents } from '../../../lib/db';
import { ascentToPoints, topNAverage, ascentDisplayGrade, COLOR_LEVELS, pointsToGrade, topNColorAvg, pctToColorLevel } from '../../../lib/gradePoints';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { getGyms } from '../../../lib/gyms';
import Header from '../../components/common/Header';
import ProgressionChart from '../../components/stats/ProgressionChart';

// Périodes de filtrage
const PERIODS = [
  { label: '3 mois', months: 3 },
  { label: '6 mois', months: 6 },
  { label: '12 mois', months: 12 },
  { label: 'Tout',   months: null },
];

export default function StatsScreen({ route }) {
  const userId = route?.params?.userId;
  const { palette, toggleTheme, theme } = useTheme();
  const styles = makeStyles(palette);

  const [ascents, setAscents]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState(PERIODS[1]); // 6 mois par défaut

  const [gyms, setGyms] = useState([]);

  const { width } = useWindowDimensions();

  // Recharge les ascensions au focus
  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!userId) return;
        setLoading(true);
        try {
          const [data, gymData] = await Promise.all([
            getAscents(userId),
            getGyms(userId),
          ]);
          setAscents(data);
          setGyms(gymData);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [userId])
  );

  // Filtre les ascensions selon la période
  const filtered = period.months
  ? ascents.filter(a => {
      const date   = new Date(a.date);
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - (period.months - 1));
      cutoff.setDate(1); // début du mois
      return date >= cutoff;
    })
  : ascents;

  // Ascensions réussies (Flash uniquement pour les stats)
  const done = filtered.filter(a => a.result === 'Flash' || a.result === 'Travaillé');

  // ── Chiffres clés ─────────────────────────────
  const totalAscents   = done.length;
  const outdoorCount   = done.filter(a => a.outdoor).length;
  const sitesCount     = new Set(done.map(a => a.location).filter(Boolean)).size;
  const thisMonth      = done.filter(a => {
    const d = new Date(a.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Sessions = jours distincts où il y a eu une ascension
  const sessions = new Set(done.map(a => a.date)).size;

  // Niveau max — meilleure cotation officielle
  const gradePoints = done
    .filter(a => !a.colorId)
    .map(a => ascentToPoints(a))
    .filter(Boolean);
  const maxPoints   = gradePoints.length > 0 ? Math.max(...gradePoints) : null;
  const maxGrade    = maxPoints
    ? ascentDisplayGrade(done.find(a => ascentToPoints(a) === maxPoints))?.label
    : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  // ── Pyramide voies cotées ──────────────────────
  const routeGradeCountsIn  = {};
  const routeGradeCountsOut = {};
  done.filter(a => ascentToPoints(a) !== null && !a.colorId && a.type !== 'Bloc').forEach(a => {
    const { label } = ascentDisplayGrade(a);
    if (a.outdoor) routeGradeCountsOut[label] = (routeGradeCountsOut[label] || 0) + 1;
    else           routeGradeCountsIn[label]  = (routeGradeCountsIn[label]  || 0) + 1;
  });
  const allRouteLabels = [...new Set([
    ...Object.keys(routeGradeCountsIn),
    ...Object.keys(routeGradeCountsOut),
  ])].sort((a, b) => (ascentToPoints({ grade: b, type: 'Diff' }) || 0) - (ascentToPoints({ grade: a, type: 'Diff' }) || 0));

  // ── Pyramide blocs cotés ───────────────────────
  const blocGradeCountsIn  = {};
  const blocGradeCountsOut = {};
  done.filter(a => a.type === 'Bloc' && !a.colorId && ascentToPoints(a) !== null).forEach(a => {
    const { label } = ascentDisplayGrade(a);
    if (a.outdoor) blocGradeCountsOut[label] = (blocGradeCountsOut[label] || 0) + 1;
    else           blocGradeCountsIn[label]  = (blocGradeCountsIn[label]  || 0) + 1;
  });
  const allBlocLabels = [...new Set([
    ...Object.keys(blocGradeCountsIn),
    ...Object.keys(blocGradeCountsOut),
  ])].sort((a, b) => (ascentToPoints({ grade: b, type: 'Bloc' }) || 0) - (ascentToPoints({ grade: a, type: 'Bloc' }) || 0));

  // ── Pyramide blocs couleur ─────────────────────
  // Calcule le niveau normalisé (N1-N6) d'un bloc couleur
  const colorCounts = { N1: 0, N2: 0, N3: 0, N4: 0, N5: 0, N6: 0 };
  done.filter(a => a.colorId && a.gymId).forEach(a => {
    const gym = gyms.find(g => g.id === a.gymId);
    if (!gym?.colors?.length) return;
    const idx      = gym.colors.findIndex(c => c.id === a.colorId);
    if (idx === -1) return;
    // Normalise la position en N1-N6
    const ratio    = idx / (gym.colors.length - 1);
    const level    = Math.min(6, Math.max(1, Math.round(ratio * 5) + 1));
    const key      = `N${level}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  });

  // ── Courbe de progression ──────────────────────
  // Groupe les ascensions par mois
  const monthlyData = {};
  done.filter(a => !a.colorId && ascentToPoints(a) !== null).forEach(a => {
    const key = a.date.slice(0, 7); // "2026-03"
    if (!monthlyData[key]) monthlyData[key] = [];
    monthlyData[key].push(a);
  });

  // Calcule la moyenne top 5 par mois pour les voies cotées
  const progressionRoute = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, ascents]) => ({
      month,
      avg: topNAverage(ascents.filter(a => a.type !== 'Bloc'), 5),
      label: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    }))
    .filter(d => d.avg !== null);

  // Calcule la moyenne top 5 par mois pour les blocs couleur
  const colorMonthlyData = {};
  done.filter(a => a.colorId).forEach(a => {
    const key = a.date.slice(0, 7);
    if (!colorMonthlyData[key]) colorMonthlyData[key] = [];
    colorMonthlyData[key].push(a);
  });

  // Moyenne top 5 blocs couleur normalisés par mois (N1-N6 → 1-6)
  const progressionColor = Object.entries(colorMonthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, monthAscents]) => {
      const avg = topNColorAvg(monthAscents, gyms, 5);
      if (avg === null) return null;
      return {
        month,
        avg,       // garde la vraie valeur pour le delta
        avgScaled: avg, // on normalisera après
        label: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      };
    })
    .filter(Boolean);

  // Convertit les points en cotations pour l'axe Y
  function pointsToGradeLabel(points) {
    if (!points) return '';
    return pointsToGrade(points) || '';
  }

  // Calcule les valeurs min/max pour l'axe Y
  const allValues = [
    ...progressionRoute.map(d => d.avg),
    ...progressionColor.map(d => d.avg),
  ].filter(Boolean);
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 10;

  // Évolution du niveau — compare premier et dernier mois
  const gradeDelta = progressionRoute.length >= 2
    ? progressionRoute.at(-1).avg - progressionRoute.at(-2).avg
    : null;

  const colorDelta = progressionColor.length >= 2
    ? progressionColor.at(-1).avg - progressionColor.at(-2).avg
    : null;

  // Crée un axe X commun avec tous les mois
  const allMonths = [...new Set([
    ...progressionRoute.map(d => d.month),
    ...progressionColor.map(d => d.month),
  ])].sort();

  // Reconstruit les données avec l'axe commun
  const routeDataAligned = allMonths.map((month, idx) => {
    const found = progressionRoute.find(d => d.month === month);
    const [y, m] = month.split('-');
    const monthNames = ['jan.', 'fév.', 'mar.', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.'];
    const label = `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`;
    
    if (found) return { value: found.avg, label };
    
    // Trouve les points précédent et suivant pour interpoler
    const prev = progressionRoute.filter(d => d.month < month).at(-1);
    const next = progressionRoute.find(d => d.month > month);
    
    if (prev && next) {
      // Interpolation linéaire
      return { value: (prev.avg + next.avg) / 2, label, hideDataPoint: true };
    }
    if (prev) return { value: prev.avg, label, hideDataPoint: true };
    if (next) return { value: next.avg, label, hideDataPoint: true };
    
    return { value: 0, label, hideDataPoint: true };
  });

  const colorDataAligned = allMonths.map(month => {
    const found = progressionColor.find(d => d.month === month);
    return {
      value:         found ? found.avg : 0,
      hideDataPoint: !found,
    };
  });

  const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Niveau moyen Diff ce mois
  const thisMonthDiff = done.filter(a => new Date(a.date) >= thirtyDaysAgo && a.type !== 'Bloc' && !a.colorId);

  // Niveau moyen Bloc ce mois
  const thisMonthBloc = done.filter(a => new Date(a.date) >= thirtyDaysAgo && a.type === 'Bloc' && !a.colorId);

  // Niveau moyen Bloc couleur ce mois — utilise le système normalisé
  const thisMonthBlocColor = done.filter(a => new Date(a.date) >= thirtyDaysAgo && a.colorId);

  const avgBlocPct = thisMonthBlocColor.length > 0
    ? topNColorAvg(thisMonthBlocColor, gyms, thisMonthBlocColor.length)
    : null;

  const avgBloc = avgBlocPct !== null
    ? `N${pctToColorLevel(avgBlocPct)} · ${['Très facile','Facile','Moyen','Difficile','Très difficile','Élite'][pctToColorLevel(avgBlocPct) - 1]}`
    : '-';

  const avgDiff = thisMonthDiff.length > 0
    ? pointsToGradeLabel(thisMonthDiff.reduce((s, a) => s + (ascentToPoints(a) || 0), 0) / thisMonthDiff.length)
    : '-';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bgCard }]} edges={['top']}>
      {/* Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        palette={palette}
        userId={userId}
        navigation={navigation}
      />

      <ScrollView style={{ backgroundColor: palette.bg }} contentContainerStyle={styles.content}>

        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, backgroundColor: palette.bg }}>
          <Text style={{ fontSize: typography.xxl, fontWeight: typography.black, color: palette.textPrimary }}>
            Statistiques
          </Text>
        </View>

        {/* Sélecteur de période */}
        <View style={styles.periodSelector}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.label}
              style={[styles.periodBtn, period.label === p.label && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodBtnText, period.label === p.label && styles.periodBtnTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chiffres clés */}
        <View style={styles.statsGrid}>
          <StatCard label="ASCENSIONS"  value={totalAscents} palette={palette} />
          <StatCard label="NIVEAU MAX"  value={maxGrade || '-'} palette={palette} accent />
          <StatCard label="CE MOIS"     value={thisMonth} palette={palette} />
          <StatCard label="MOY. DIFF (30j)" value={avgDiff} palette={palette} />
          <StatCard label="MOY. BLOC (30j)" value={avgBloc} palette={palette} small />
        </View>

        {/* Courbe de progression */}
        {(progressionRoute.length >= 2 || progressionColor.length >= 2) && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Progression</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {gradeDelta !== null && gradeDelta !== 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, backgroundColor: gradeDelta > 0 ? '#DCFCE7' : '#FEE2E2' }}>
                    <Text style={{ fontSize: typography.xs }}>🟢</Text>
                    <Text style={{ fontSize: typography.xs, fontWeight: typography.bold, color: gradeDelta > 0 ? '#15803D' : colors.danger }}>
                      {gradeDelta > 0 ? '▲' : '▼'} {Math.abs(gradeDelta).toFixed(1)}%
                    </Text>
                  </View>
                )}
                {colorDelta !== null && colorDelta !== 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colorDelta > 0 ? '#EDE9FE' : '#FEE2E2' }}>
                    <Text style={{ fontSize: typography.xs }}>🟣</Text>
                    <Text style={{ fontSize: typography.xs, fontWeight: typography.bold, color: colorDelta > 0 ? '#7C3AED' : colors.danger }}>
                      {colorDelta > 0 ? '▲' : '▼'} {Math.abs(colorDelta).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <ProgressionChart
              progressionRoute={progressionRoute}
              progressionColor={progressionColor}
              palette={palette}
              width={width - spacing.lg * 2}
              pointsToGradeLabel={pointsToGradeLabel}
            />
          </View>
        )}

        {/* Pyramide voies cotées */}
        {allRouteLabels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pyramide — Voies cotées</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#22C55E' }} />
                <Text style={{ fontSize: typography.xs, color: palette.textMuted }}>Intérieur</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#3B82F6' }} />
                <Text style={{ fontSize: typography.xs, color: palette.textMuted }}>Extérieur</Text>
              </View>
            </View>
            {allRouteLabels.map(label => {
              const inCount  = routeGradeCountsIn[label]  || 0;
              const outCount = routeGradeCountsOut[label] || 0;
              const total    = inCount + outCount;
              const maxCount = Math.max(...allRouteLabels.map(l => (routeGradeCountsIn[l] || 0) + (routeGradeCountsOut[l] || 0)));
              return (
                <View key={label} style={styles.pyrRow}>
                  <Text style={styles.pyrLabel}>{label}</Text>
                  <View style={styles.pyrBarWrap}>
                    {inCount > 0 && (
                      <View style={[styles.pyrBar, {
                        width: `${(inCount / maxCount) * 100}%`,
                        backgroundColor: '#22C55E',
                        borderRadius: outCount > 0 ? '4px 0 0 4px' : 4,
                      }]} />
                    )}
                    {outCount > 0 && (
                      <View style={[styles.pyrBar, {
                        width: `${(outCount / maxCount) * 100}%`,
                        backgroundColor: '#3B82F6',
                        borderRadius: inCount > 0 ? '0 4px 4px 0' : 4,
                      }]} />
                    )}
                  </View>
                  <Text style={styles.pyrCount}>{total}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Pyramide blocs couleur */}
        {Object.values(colorCounts).some(v => v > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pyramide — Blocs couleur</Text>
            <Text style={{ fontSize: typography.xs, color: palette.textMuted, marginBottom: spacing.md }}>
              Niveaux normalisés sur 6 tranches, comparables entre toutes les salles.
            </Text>
            {Object.entries(colorCounts).reverse().map(([level, count]) => {
              const maxCount = Math.max(...Object.values(colorCounts));
              const levelColors = {
                N1: '#FACC15', N2: '#22C55E', N3: '#3B82F6',
                N4: '#EF4444', N5: '#18181B', N6: '#7C3AED',
              };
              return (
                <View key={level} style={styles.pyrRow}>
                  <Text style={styles.pyrLabel}>{level}</Text>
                  <View style={styles.pyrBarWrap}>
                    <View style={[styles.pyrBar, {
                      width: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%',
                      backgroundColor: levelColors[level],
                    }]} />
                  </View>
                  <Text style={styles.pyrCount}>{count}</Text>
                </View>
              );
            })}

            {/* Légende niveaux couleur */}
            {Object.values(colorCounts).some(v => v > 0) && (
              <View style={{ flexDirection: 'column', gap: spacing.xs, marginTop: spacing.sm }}>
                {[
                  { key: 'N1', color: '#FACC15', label: 'Très facile' },
                  { key: 'N2', color: '#22C55E', label: 'Facile' },
                  { key: 'N3', color: '#3B82F6', label: 'Moyen' },
                  { key: 'N4', color: '#EF4444', label: 'Difficile' },
                  { key: 'N5', color: '#18181B', label: 'Très difficile' },
                  { key: 'N6', color: '#7C3AED', label: 'Élite' },
                ].map(l => (
                  <View key={l.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: l.color }} />
                    <Text style={{ fontSize: typography.xs, color: palette.textMuted }}>{l.key} · {l.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Pyramide blocs cotés */}
        {allBlocLabels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pyramide — Blocs cotés</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#F59E0B' }} />
                <Text style={{ fontSize: typography.xs, color: palette.textMuted }}>Intérieur</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#3B82F6' }} />
                <Text style={{ fontSize: typography.xs, color: palette.textMuted }}>Extérieur</Text>
              </View>
            </View>
            {allBlocLabels.map(label => {
              const inCount  = blocGradeCountsIn[label]  || 0;
              const outCount = blocGradeCountsOut[label] || 0;
              const total    = inCount + outCount;
              const maxCount = Math.max(...allBlocLabels.map(l => (blocGradeCountsIn[l] || 0) + (blocGradeCountsOut[l] || 0)));
              return (
                <View key={label} style={styles.pyrRow}>
                  <Text style={styles.pyrLabel}>{label}</Text>
                  <View style={styles.pyrBarWrap}>
                    {inCount > 0 && (
                      <View style={[styles.pyrBar, {
                        width: `${(inCount / maxCount) * 100}%`,
                        backgroundColor: '#F59E0B',
                      }]} />
                    )}
                    {outCount > 0 && (
                      <View style={[styles.pyrBar, {
                        width: `${(outCount / maxCount) * 100}%`,
                        backgroundColor: '#3B82F6',
                      }]} />
                    )}
                  </View>
                  <Text style={styles.pyrCount}>{total}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Résultats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#DBEAFE', borderRadius: radius.md, padding: spacing.md }}>
              <Text style={{ fontSize: typography.xxl, fontWeight: typography.black, color: '#1D4ED8' }}>
                {done.filter(a => a.result === 'Flash').length}
              </Text>
              <Text style={{ fontSize: typography.xs, fontWeight: typography.bold, color: '#1D4ED8', marginTop: 2 }}>FLASH</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: radius.md, padding: spacing.md }}>
              <Text style={{ fontSize: typography.xxl, fontWeight: typography.black, color: '#92400E' }}>
                {done.filter(a => a.result === 'Travaillé').length}
              </Text>
              <Text style={{ fontSize: typography.xs, fontWeight: typography.bold, color: '#92400E', marginTop: 2 }}>TRAVAILLÉ</Text>
            </View>
          </View>
        </View>

        {/* Pyramide par discipline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Par discipline</Text>
          {(() => {
            const types = ['Bloc', 'Diff', 'Trad', 'Grande voie', 'Deep water solo'];
            const counts = types.map(t => ({
              type:  t,
              count: done.filter(a => a.type === t).length,
            })).filter(t => t.count > 0);
            const maxCount = Math.max(...counts.map(t => t.count));

            return (
              <View style={{ gap: spacing.sm }}>
                {counts.map(({ type, count }) => (
                  <View key={type} style={styles.pyrRow}>
                    <Text style={[styles.pyrLabel, { width: 80, fontSize: typography.xs }]}>{type}</Text>
                    <View style={styles.pyrBarWrap}>
                      <View style={[styles.pyrBar, {
                        width: `${(count / maxCount) * 100}%`,
                        backgroundColor: colors.accent,
                      }]} />
                    </View>
                    <Text style={styles.pyrCount}>{count}</Text>
                  </View>
                ))}
              </View>
            );
          })()}
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}

// Composant carte statistique
function StatCard({ label, value, palette, accent, small }) {
  return (
    <View style={{
      flex:            1,
      minWidth:        '30%',
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.md,
      alignItems:      'center',
      justifyContent:  'center',
      borderWidth:     1,
      borderColor:     palette.border,
      minHeight:       80,
    }}>
      <Text style={{
        fontSize:   small ? typography.md : 28,
        fontWeight: '900',
        color:      accent ? colors.accent : palette.textPrimary,
        letterSpacing: -1,
        textAlign: 'center',
        alignSelf:     'stretch',
        width:        '100%',
      }}>
        {value}
      </Text>
      <Text style={{
        fontSize:   9,
        fontWeight: '700',
        color:      palette.textMuted,
        letterSpacing: 0.5,
        marginTop:  4,
      }}>
        {label}
      </Text>
    </View>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: palette.bg },
    headerWrap: {
      paddingHorizontal: spacing.xl,
      paddingVertical:   spacing.md,
      borderBottomWidth: 1,
    },
    title: {
      fontSize:   typography.xxl,
      fontWeight: typography.black,
      color:      palette.textPrimary,
    },
    content: {
      padding: spacing.sm,
      gap:     spacing.sm,
    },
    periodSelector: {
      flexDirection:   'row',
      backgroundColor: palette.bgInput,
      borderRadius:    radius.md,
      padding:         3,
      gap:             3,
    },
    periodBtn: {
      flex:            1,
      paddingVertical: spacing.sm,
      borderRadius:    radius.sm,
      alignItems:      'center',
    },
    periodBtnActive: {
      backgroundColor: palette.bgCard,
    },
    periodBtnText: {
      fontSize:   typography.xs,
      fontWeight: typography.semibold,
      color:      palette.textMuted,
    },
    periodBtnTextActive: {
      color: palette.textPrimary,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           spacing.sm,
    },
    section: {
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.lg,
      borderWidth:     1,
      borderColor:     palette.border,
    },
    sectionTitle: {
      fontSize:     typography.sm,
      fontWeight:   typography.bold,
      color:        palette.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom:  spacing.md,
    },
    pyrRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           spacing.sm,
      marginBottom:  spacing.xs,
    },
    pyrLabel: {
      width:      40,
      fontSize:   typography.xs,
      fontWeight: typography.semibold,
      color:      palette.textSecondary,
    },
    pyrBarWrap: {
      flex:            1,
      height:          20,
      backgroundColor: palette.bgInput,
      borderRadius:    4,
      overflow:        'hidden',
      flexDirection:   'row',
    },
    pyrBar: {
      height: '100%',
    },
    pyrCount: {
      width:    20,
      fontSize: typography.xs,
      color:    palette.textMuted,
      textAlign: 'right',
    },
  });
}