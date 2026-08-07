import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export default function ProjectCard({ project, onPress }) {
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const hasColor   = project.colorHex && !project.outdoor;
  const lastAttempt = project.attempts?.[0];

  // Calcule les jours restants avant la date objectif
  const daysLeft = project.objectiveDate
    ? Math.ceil((new Date(project.objectiveDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  // Couleur de la barre latérale selon le statut
  const barColor = hasColor ? project.colorHex :
    project.status === 'reussi'    ? colors.accent :
    project.status === 'abandonne' ? palette.textMuted :
    colors.warn;

  const formattedDate = lastAttempt?.date
    ? new Date(lastAttempt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Barre latérale colorée */}
      <View style={[styles.bar, { backgroundColor: barColor }]} />

      <View style={styles.body}>
        {/* Cotation ou couleur + statut */}
        <View style={styles.top}>
          <View style={styles.gradeBlock}>
            {hasColor ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: project.colorHex }} />
                <Text style={styles.grade}>{project.colorName}</Text>
                {project.gradeHint && <Text style={styles.hint}>~{project.gradeHint}</Text>}
              </View>
            ) : (
              <Text style={styles.grade}>{project.grade || '?'}</Text>
            )}
            {project.routeName && <Text style={styles.routeName}>{project.routeName}</Text>}
          </View>

          {/* Badge statut */}
          <View style={[styles.badge, {
            backgroundColor:
              project.status === 'reussi'    ? '#DCFCE7' :
              project.status === 'abandonne' ? palette.bgInput :
              '#FEF3C7',
          }]}>
            <Text style={[styles.badgeText, {
              color:
                project.status === 'reussi'    ? colors.accentText :
                project.status === 'abandonne' ? palette.textMuted :
                '#92400E',
            }]}>
              {project.status === 'reussi'    ? 'Réussi ✓' :
               project.status === 'abandonne' ? 'Abandonné' :
               'En cours'}
            </Text>
          </View>
        </View>

        {/* Type + lieu */}
        <View style={styles.meta}>
          <Text style={styles.metaText}>{project.type}</Text>
          {project.location && <Text style={styles.metaText}>📍 {project.location}</Text>}
        </View>

        {/* Tentatives + date objectif */}
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            🔄 {project.attempts?.length || 0} tentative{project.attempts?.length !== 1 ? 's' : ''}
          </Text>
          {formattedDate && <Text style={styles.metaText}>Dernière : {formattedDate}</Text>}
        </View>

        {/* Compte à rebours */}
        {daysLeft !== null && project.status === 'en_cours' && (
          <Text style={{ fontSize: typography.xs, fontWeight: typography.semibold, marginTop: spacing.xs, color: daysLeft < 7 ? colors.danger : palette.textMuted }}>
            🎯 {daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}` : 'Date objectif dépassée'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    card: {
      flexDirection:   'row',
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      borderWidth:     1,
      borderColor:     palette.border,
      overflow:        'hidden',
      marginBottom:    spacing.sm,
    },
    bar:  { width: 5 },
    body: { flex: 1, padding: spacing.md },
    top: {
      flexDirection:  'row',
      justifyContent: 'space-between',
      alignItems:     'flex-start',
      marginBottom:   spacing.sm,
    },
    gradeBlock: { flex: 1, gap: spacing.xs },
    grade: {
      fontSize:      typography.xl,
      fontWeight:    typography.black,
      letterSpacing: -0.5,
      color:         palette.textPrimary,
    },
    hint: {
      fontSize: typography.xs,
      color:    palette.textMuted,
    },
    routeName: {
      fontSize:   typography.sm,
      color:      palette.textSecondary,
      fontWeight: typography.medium,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical:   3,
      borderRadius:      radius.full,
    },
    badgeText: {
      fontSize:   typography.xs,
      fontWeight: typography.bold,
    },
    meta: {
      flexDirection: 'row',
      gap:           spacing.md,
      flexWrap:      'wrap',
      marginBottom:  spacing.xs,
    },
    metaText: {
      fontSize: typography.xs,
      color:    palette.textMuted,
    },
  });
}