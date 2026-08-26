import { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } from '../../../lib/social';
import { ascentToPoints, topNAverage, ascentDisplayGrade, COLOR_LEVELS, pointsToGrade, topNColorAvg, pctToColorLevel } from '../../../lib/gradePoints';
import { supabase } from '../../../lib/supabase';
import { getAscents } from '../../../lib/db';
import { getGyms } from '../../../lib/gyms';

export default function PublicProfileScreen({ route, navigation }) {
  const { profileId, userId } = route.params;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [profile, setProfile]     = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [ascentsCount, setAscentsCount] = useState(0);
  const [gyms, setGyms] = useState([]);
  const [ascents, setAscents]   = useState([]);

  // Ascensions réussies (Flash uniquement pour les stats)
  const done = ascents.filter(a => a.result === 'Flash' || a.result === 'Travaillé');

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


  // Charge le profil public au focus
  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const [{ data: prof }, followStatus, followers, following_list, ascentsData, gymData] = await Promise.all([
            supabase.from('profiles').select('id, display_name, bio, avatar_url').eq('id', profileId).single(),
            isFollowing(userId, profileId),
            getFollowers(profileId),
            getFollowing(profileId),
            getAscents(profileId),
            getGyms(profileId),
          ]);
          setProfile(prof);
          setFollowing(followStatus);
          setFollowersCount(followers.length);
          setFollowingCount(following_list.length);
          setAscents(ascentsData);
          setGyms(gymData);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [profileId, userId])
  );

  // Toggle follow/unfollow
  async function handleFollow() {
    if (following) {
      await unfollowUser(userId, profileId);
    } else {
      await followUser(userId, profileId);
      await fetch('https://kskzkxsbriatufffsdvh.supabase.co/functions/v1/send-follow-notification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
        },        
        body: JSON.stringify({ 
          followerId: userId,
          followingId: profileId,
        })
      })
    }
    setFollowing(f => !f);
  }

  const initials = profile?.display_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{profile?.display_name || 'Profil'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar + stats */}
        <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
                {/* Photo de profil */}
                {profile?.avatar_url
                    ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                    : <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.initials}>{initials || '?'}</Text>
                    </View>
                }

                {/* Stats à droite */}
                <View style={styles.statsRight}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{ascentsCount}</Text>
                        <Text style={styles.statLabel}>ASCENSIONS</Text>
                    </View>
                    <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('FollowersList', { userId: profileId, type: 'followers', currentUserId: userId })}>                
                        <Text style={styles.statValue}>{followersCount}</Text>
                        <Text style={styles.statLabel}>FOLLOWERS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('FollowersList', { userId: profileId, type: 'following', currentUserId: userId })}>                
                        <Text style={styles.statValue}>{followingCount}</Text>
                        <Text style={styles.statLabel}>SUIVI</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Nom + bio */}
            <View style={styles.bioSection}>
            <Text style={styles.name}>{profile?.display_name}</Text>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            </View>

            {/* Bouton follow */}
            <TouchableOpacity
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={handleFollow}
            >
              <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                  {following ? '✓ Suivi' : '+ Suivre'}
              </Text>
            </TouchableOpacity>
          </View>

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
              <TouchableOpacity
                style={{ marginTop: spacing.sm }}
                onPress={() => navigation.navigate('PublicLogbook', { profileId, filter: 'voies' })}
              >
                <Text style={{ color: colors.accent, fontWeight: typography.semibold, fontSize: typography.sm }}>
                  Voir tout →
                </Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={{ marginTop: spacing.sm }}
                onPress={() => navigation.navigate('PublicLogbook', { profileId, filter: 'blocs' })}
              >
                <Text style={{ color: colors.accent, fontWeight: typography.semibold, fontSize: typography.sm }}>
                  Voir tout →
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
            <TouchableOpacity
                style={{ marginTop: spacing.sm }}
                onPress={() => navigation.navigate('PublicLogbook', { profileId, filter: 'all' })}
              >
                <Text style={{ color: colors.accent, fontWeight: typography.semibold, fontSize: typography.sm }}>
                  Voir tout →
                </Text>
              </TouchableOpacity>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container: {
      flex:            1,
      backgroundColor: palette.bg,
    },
    header: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical:   spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      backgroundColor:   palette.bgCard,
    },
    back: {
      fontSize:   typography.base,
      color:      colors.accent,
      fontWeight: typography.semibold,
    },
    title: {
      fontSize:   typography.lg,
      fontWeight: typography.black,
      color:      palette.textPrimary,
    },
    content: {
      padding: spacing.lg,
    },
    profileCard: {
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.xl,
      alignItems:      'center',
      borderWidth:     1,
      borderColor:     palette.border,
      gap:             spacing.sm,
    },
    avatar: {
      width:        80,
      height:       80,
      borderRadius: 40,
    },
    avatarFallback: {
      backgroundColor: colors.accent,
      alignItems:      'center',
      justifyContent:  'center',
    },
    initials: {
      fontSize:   typography.xxl,
      fontWeight: typography.black,
      color:      '#fff',
    },
    name: {
      fontSize:   typography.xl,
      fontWeight: typography.black,
      color:      palette.textPrimary,
    },
    bio: {
      fontSize:  typography.sm,
      color:     palette.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    followBtn: {
      paddingHorizontal: spacing.xl,
      paddingVertical:   spacing.sm,
      borderRadius:      radius.full,
      backgroundColor:   colors.accent,
      marginTop:         spacing.sm,
    },
    followingBtn: {
      backgroundColor: palette.bgInput,
      borderWidth:     1,
      borderColor:     palette.border,
    },
    followBtnText: {
      fontSize:   typography.base,
      fontWeight: typography.bold,
      color:      '#fff',
    },
    followingBtnText: {
      color: palette.textMuted,
    },
    profileHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.lg,
    },
    statsRight: {
    flex:           1,
    flexDirection:  'row',
    justifyContent: 'space-around',
    },
    statItem: {
    alignItems: 'center',
    },
    statValue: {
    fontSize:   typography.xl,
    fontWeight: typography.black,
    color:      palette.textPrimary,
    },
    statLabel: {
    fontSize:      9,
    fontWeight:    '700',
    color:         palette.textMuted,
    letterSpacing: 0.5,
    marginTop:     2,
    },
    bioSection: {
    marginTop: spacing.md,
    },
    name: {
    fontSize:   typography.lg,
    fontWeight: typography.black,
    color:      palette.textPrimary,
    },
    bio: {
    fontSize:  typography.sm,
    color:     palette.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
    },
    section: {
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.lg,
      borderWidth:     1,
      borderColor:     palette.border,
      marginBottom:    spacing.md,
    },
    sectionTitle: {
      fontSize:      typography.sm,
      fontWeight:    typography.bold,
      color:         palette.textSecondary,
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
      width:     20,
      fontSize:  typography.xs,
      color:     palette.textMuted,
      textAlign: 'right',
    },
  });
}