import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import VideoPlayer from './VideoPlayer';
import Lightbox from '../common/Lightbox';

// Couleurs de la barre latérale selon le résultat
const RESULT_COLORS = {
  "Flash":     colors.flash,
  "Travaillé": colors.warn,
};

// Badge résultat
const RESULT_BADGE = {
  "Flash":     { bg: "#DBEAFE", text: "#1D4ED8" },
  "Travaillé": { bg: "#FEF3C7", text: "#92400E" },
};

export default function AscentCard({ ascent, onMenu }) {
  const hasColor   = ascent.colorHex && !ascent.outdoor;
  const barColor   = hasColor ? ascent.colorHex : (RESULT_COLORS[ascent.result] || colors.warn);
  const badgeStyle = RESULT_BADGE[ascent.result] || { bg: colors.light.bgInput, text: colors.light.textMuted };

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { url, type }

  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const formattedDate = ascent.date
    ? new Date(ascent.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : ""; 

  return (
    <View style={styles.card}>
      {/* Barre latérale colorée */}
      <View style={[styles.bar, { backgroundColor: barColor }]} />

      <View style={styles.body}>
        {/* Ligne du haut : cotation + résultat */}
        <View style={styles.top}>
        <View style={styles.gradeBlock}>
          {hasColor ? (
            <View style={styles.colorGrade}>
              <View style={[styles.colorDot, { backgroundColor: ascent.colorHex }]} />
              <Text style={styles.colorName}>{ascent.colorName}</Text>
              {ascent.gradeHint && (
                <Text style={styles.gradeHint}>{ascent.gradeHint}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.grade}>{ascent.grade}</Text>
          )}
          {ascent.routeName && (
            <Text style={styles.routeName}>{ascent.routeName}</Text>
          )}
        </View>

        {/* Badge résultat + bouton menu */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
              {ascent.result}
            </Text>
          </View>
          <TouchableOpacity onPress={onMenu} style={styles.menuBtn}>
            <Text style={styles.menuBtnText}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

        {/* Chips type + extérieur */}
        <View style={styles.chips}>
          <View style={styles.chipType}>
            <Text style={styles.chipTypeText}>{ascent.type}</Text>
          </View>
          {ascent.outdoor && (
            <View style={styles.chipOutdoor}>
              <Text style={styles.chipOutdoorText}>🌿 Extérieur</Text>
            </View>
          )}
        </View>

        {/* Méta : lieu + date */}
        <View style={styles.meta}>
          {ascent.location && (
            <Text style={styles.metaText}>📍 {ascent.location}</Text>
          )}
          {formattedDate && (
            <Text style={styles.metaText}>🗓 {formattedDate}</Text>
          )}
        </View>

        {/* Commentaire */}
        {ascent.comment && (
          <Text style={styles.comment}>"{ascent.comment}"</Text>
        )}

        {/* Tags */}
        {ascent.tags?.length > 0 && (
          <View style={styles.tags}>
            {ascent.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {ascent.mediaList?.filter(m => m.url).length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
            {ascent.mediaList.filter(m => m.url).map((m, i) =>
              m.type === "photo" ? (
                /* Tap sur la photo → ouvre la lightbox */
                <TouchableOpacity key={i} onPress={() => setLightbox({ url: m.url, type: 'photo' })}>
                  <Image source={{ uri: m.url }} style={styles.mediaThumbnail} />
                </TouchableOpacity>
              ) : (
                /* Tap sur la vidéo → ouvre la lightbox */
                <TouchableOpacity key={i} onPress={() => setLightbox({ url: m.url, type: 'video' })}
                  style={styles.videoThumb}>
                  <Text style={{ fontSize: 24 }}>🎥</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        )}
      </View>

      {/* Lightbox plein écran */}
      <Lightbox media={lightbox} onClose={() => setLightbox(null)} />
    </View>
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
    bar: {
      width: 5,
    },
    body: {
      flex:    1,
      padding: spacing.md,
    },
    top: {
      flexDirection:  'row',
      justifyContent: 'space-between',
      alignItems:     'flex-start',
      marginBottom:   spacing.sm,
    },
    gradeBlock: {
      flexDirection: 'row',
      alignItems:    'baseline',
      gap:           spacing.sm,
      flex:          1,
    },
    grade: {
      fontSize:      typography.hero,
      fontWeight:    typography.black,
      letterSpacing: -1,
      color:         palette.textPrimary,
      lineHeight:    36,
    },
    colorGrade: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           spacing.sm,
    },
    colorDot: {
      width:        20,
      height:       20,
      borderRadius: 10,
    },
    colorName: {
      fontSize:   typography.xl,
      fontWeight: typography.black,
      color:      palette.textPrimary,
    },
    gradeHint: {
      fontSize: typography.sm,
      color:    palette.textMuted,
    },
    routeName: {
      fontSize:   typography.base,
      fontWeight: typography.semibold,
      color:      palette.textPrimary,
      flex:       1,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical:   4,
      borderRadius:      radius.full,
      flexShrink:        0,
    },
    badgeText: {
      fontSize:   typography.xs,
      fontWeight: typography.bold,
    },
    chips: {
      flexDirection: 'row',
      gap:           spacing.xs,
      marginBottom:  spacing.xs,
      flexWrap:      'wrap',
    },
    chipType: {
      paddingHorizontal: spacing.sm,
      paddingVertical:   3,
      backgroundColor:   '#DCFCE7',
      borderRadius:      radius.full,
    },
    chipTypeText: {
      fontSize:   typography.xs,
      fontWeight: typography.bold,
      color:      colors.accentText,
    },
    chipOutdoor: {
      paddingHorizontal: spacing.sm,
      paddingVertical:   3,
      backgroundColor:   '#FEF9C3',
      borderRadius:      radius.full,
    },
    chipOutdoorText: {
      fontSize:   typography.xs,
      fontWeight: typography.bold,
      color:      '#713F12',
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
    comment: {
      fontSize:        typography.sm,
      color:           palette.textSecondary,
      fontStyle:       'italic',
      borderLeftWidth: 3,
      borderLeftColor: palette.border,
      paddingLeft:     spacing.sm,
      marginTop:       spacing.sm,
    },
    tags: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           spacing.xs,
      marginTop:     spacing.sm,
    },
    tag: {
      paddingHorizontal: spacing.sm,
      paddingVertical:   2,
      backgroundColor:   palette.bgInput,
      borderRadius:      radius.full,
    },
    tagText: {
      fontSize:   typography.xs,
      color:      palette.textMuted,
      fontWeight: typography.semibold,
    },
    mediaThumbnail: {
      width:        80,
      height:       80,
      borderRadius: radius.sm,
      marginRight:  spacing.sm,
    },
    videoThumb: {
      width:           80,
      height:          80,
      borderRadius:    radius.sm,
      backgroundColor: palette.bgInput,
      alignItems:      'center',
      justifyContent:  'center',
      marginRight:     spacing.sm,
    },
    menuBtn: {
      width:           28,
      height:          28,
      borderRadius:    14,
      backgroundColor: palette.bgInput,
      alignItems:      'center',
      justifyContent:  'center',
      marginLeft:      spacing.xs,
    },
    menuBtnText: {
      fontSize:      16,
      color:         palette.textMuted,
      letterSpacing: 1,
    },
  });
}